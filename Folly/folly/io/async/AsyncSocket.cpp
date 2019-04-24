/*
 * Copyright 2014-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <folly/io/async/AsyncSocket.h>

#include <folly/ExceptionWrapper.h>
#include <folly/Format.h>
#include <folly/Portability.h>
#include <folly/SocketAddress.h>
#include <folly/String.h>
#include <folly/io/Cursor.h>
#include <folly/io/IOBuf.h>
#include <folly/io/IOBufQueue.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/SysUio.h>
#include <folly/portability/Unistd.h>

#include <boost/preprocessor/control/if.hpp>
#include <errno.h>
#include <limits.h>
#include <sys/types.h>
#include <thread>

#if FOLLY_HAVE_VLA
#define FOLLY_HAVE_VLA_01 1
#else
#define FOLLY_HAVE_VLA_01 0
#endif

using std::string;
using std::unique_ptr;

namespace fsp = folly::portability::sockets;

namespace folly {

static constexpr bool msgErrQueueSupported =
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
    true;
#else
    false;
#endif // FOLLY_HAVE_MSG_ERRQUEUE

// static members initializers
const AsyncSocket::OptionMap AsyncSocket::emptyOptionMap;

const AsyncSocketException socketClosedLocallyEx(
    AsyncSocketException::END_OF_FILE,
    "socket closed locally");
const AsyncSocketException socketShutdownForWritesEx(
    AsyncSocketException::END_OF_FILE,
    "socket shutdown for writes");

// TODO: It might help performance to provide a version of BytesWriteRequest
// that users could derive from, so we can avoid the extra allocation for each
// call to write()/writev().
//
// We would need the version for external users where they provide the iovec
// storage space, and only our internal version would allocate it at the end of
// the WriteRequest.

/* The default WriteRequest implementation, used for write(), writev() and
 * writeChain()
 *
 * A new BytesWriteRequest operation is allocated on the heap for all write
 * operations that cannot be completed immediately.
 */
class AsyncSocket::BytesWriteRequest : public AsyncSocket::WriteRequest {
 public:
  static BytesWriteRequest* newRequest(
      AsyncSocket* socket,
      WriteCallback* callback,
      const iovec* ops,
      uint32_t opCount,
      uint32_t partialWritten,
      uint32_t bytesWritten,
      unique_ptr<IOBuf>&& ioBuf,
      WriteFlags flags) {
    assert(opCount > 0);
    // Since we put a variable size iovec array at the end
    // of each BytesWriteRequest, we have to manually allocate the memory.
    void* buf =
        malloc(sizeof(BytesWriteRequest) + (opCount * sizeof(struct iovec)));
    if (buf == nullptr) {
      throw std::bad_alloc();
    }

    return new (buf) BytesWriteRequest(
        socket,
        callback,
        ops,
        opCount,
        partialWritten,
        bytesWritten,
        std::move(ioBuf),
        flags);
  }

  void destroy() override {
    this->~BytesWriteRequest();
    free(this);
  }

  WriteResult performWrite() override {
    WriteFlags writeFlags = flags_;
    if (getNext() != nullptr) {
      writeFlags |= WriteFlags::CORK;
    }

    socket_->adjustZeroCopyFlags(writeFlags);

    auto writeResult = socket_->performWrite(
        getOps(), getOpCount(), writeFlags, &opsWritten_, &partialBytes_);
    bytesWritten_ = writeResult.writeReturn > 0 ? writeResult.writeReturn : 0;
    if (bytesWritten_) {
      if (socket_->isZeroCopyRequest(writeFlags)) {
        if (isComplete()) {
          socket_->addZeroCopyBuf(std::move(ioBuf_));
        } else {
          socket_->addZeroCopyBuf(ioBuf_.get());
        }
      } else {
        // this happens if at least one of the prev requests were sent
        // with zero copy but not the last one
        if (isComplete() && socket_->getZeroCopy() &&
            socket_->containsZeroCopyBuf(ioBuf_.get())) {
          socket_->setZeroCopyBuf(std::move(ioBuf_));
        }
      }
    }
    return writeResult;
  }

  bool isComplete() override {
    return opsWritten_ == getOpCount();
  }

  void consume() override {
    // Advance opIndex_ forward by opsWritten_
    opIndex_ += opsWritten_;
    assert(opIndex_ < opCount_);

    if (!socket_->isZeroCopyRequest(flags_)) {
      // If we've finished writing any IOBufs, release them
      if (ioBuf_) {
        for (uint32_t i = opsWritten_; i != 0; --i) {
          assert(ioBuf_);
          ioBuf_ = ioBuf_->pop();
        }
      }
    }

    // Move partialBytes_ forward into the current iovec buffer
    struct iovec* currentOp = writeOps_ + opIndex_;
    assert((partialBytes_ < currentOp->iov_len) || (currentOp->iov_len == 0));
    currentOp->iov_base =
        reinterpret_cast<uint8_t*>(currentOp->iov_base) + partialBytes_;
    currentOp->iov_len -= partialBytes_;

    // Increment the totalBytesWritten_ count by bytesWritten_;
    assert(bytesWritten_ >= 0);
    totalBytesWritten_ += uint32_t(bytesWritten_);
  }

 private:
  BytesWriteRequest(
      AsyncSocket* socket,
      WriteCallback* callback,
      const struct iovec* ops,
      uint32_t opCount,
      uint32_t partialBytes,
      uint32_t bytesWritten,
      unique_ptr<IOBuf>&& ioBuf,
      WriteFlags flags)
      : AsyncSocket::WriteRequest(socket, callback),
        opCount_(opCount),
        opIndex_(0),
        flags_(flags),
        ioBuf_(std::move(ioBuf)),
        opsWritten_(0),
        partialBytes_(partialBytes),
        bytesWritten_(bytesWritten) {
    memcpy(writeOps_, ops, sizeof(*ops) * opCount_);
  }

  // private destructor, to ensure callers use destroy()
  ~BytesWriteRequest() override = default;

  const struct iovec* getOps() const {
    assert(opCount_ > opIndex_);
    return writeOps_ + opIndex_;
  }

  uint32_t getOpCount() const {
    assert(opCount_ > opIndex_);
    return opCount_ - opIndex_;
  }

  uint32_t opCount_; ///< number of entries in writeOps_
  uint32_t opIndex_; ///< current index into writeOps_
  WriteFlags flags_; ///< set for WriteFlags
  unique_ptr<IOBuf> ioBuf_; ///< underlying IOBuf, or nullptr if N/A

  // for consume(), how much we wrote on the last write
  uint32_t opsWritten_; ///< complete ops written
  uint32_t partialBytes_; ///< partial bytes of incomplete op written
  ssize_t bytesWritten_; ///< bytes written altogether

  struct iovec writeOps_[]; ///< write operation(s) list
};

int AsyncSocket::SendMsgParamsCallback::getDefaultFlags(
    folly::WriteFlags flags,
    bool zeroCopyEnabled) noexcept {
  int msg_flags = MSG_DONTWAIT;

#ifdef MSG_NOSIGNAL // Linux-only
  msg_flags |= MSG_NOSIGNAL;
#ifdef MSG_MORE
  if (isSet(flags, WriteFlags::CORK)) {
    // MSG_MORE tells the kernel we have more data to send, so wait for us to
    // give it the rest of the data rather than immediately sending a partial
    // frame, even when TCP_NODELAY is enabled.
    msg_flags |= MSG_MORE;
  }
#endif // MSG_MORE
#endif // MSG_NOSIGNAL
  if (isSet(flags, WriteFlags::EOR)) {
    // marks that this is the last byte of a record (response)
    msg_flags |= MSG_EOR;
  }

  if (zeroCopyEnabled && isSet(flags, WriteFlags::WRITE_MSG_ZEROCOPY)) {
    msg_flags |= MSG_ZEROCOPY;
  }

  return msg_flags;
}

namespace {
static AsyncSocket::SendMsgParamsCallback defaultSendMsgParamsCallback;

// Based on flags, signal the transparent handler to disable certain functions
void disableTransparentFunctions(int fd, bool noTransparentTls, bool noTSocks) {
  (void)fd;
  (void)noTransparentTls;
  (void)noTSocks;
#if __linux__
  if (noTransparentTls) {
    // Ignore return value, errors are ok
    VLOG(5) << "Disabling TTLS for fd " << fd;
    ::setsockopt(fd, SOL_SOCKET, SO_NO_TRANSPARENT_TLS, nullptr, 0);
  }
  if (noTSocks) {
    VLOG(5) << "Disabling TSOCKS for fd " << fd;
    // Ignore return value, errors are ok
    ::setsockopt(fd, SOL_SOCKET, SO_NO_TSOCKS, nullptr, 0);
  }
#endif
}

} // namespace

AsyncSocket::AsyncSocket()
    : eventBase_(nullptr),
      writeTimeout_(this, nullptr),
      ioHandler_(this, nullptr),
      immediateReadHandler_(this) {
  VLOG(5) << "new AsyncSocket()";
  init();
}

AsyncSocket::AsyncSocket(EventBase* evb)
    : eventBase_(evb),
      writeTimeout_(this, evb),
      ioHandler_(this, evb),
      immediateReadHandler_(this) {
  VLOG(5) << "new AsyncSocket(" << this << ", evb=" << evb << ")";
  init();
}

AsyncSocket::AsyncSocket(
    EventBase* evb,
    const folly::SocketAddress& address,
    uint32_t connectTimeout)
    : AsyncSocket(evb) {
  connect(nullptr, address, connectTimeout);
}

AsyncSocket::AsyncSocket(
    EventBase* evb,
    const std::string& ip,
    uint16_t port,
    uint32_t connectTimeout)
    : AsyncSocket(evb) {
  connect(nullptr, ip, port, connectTimeout);
}

AsyncSocket::AsyncSocket(EventBase* evb, int fd, uint32_t zeroCopyBufId)
    : zeroCopyBufId_(zeroCopyBufId),
      eventBase_(evb),
      writeTimeout_(this, evb),
      ioHandler_(this, evb, fd),
      immediateReadHandler_(this) {
  VLOG(5) << "new AsyncSocket(" << this << ", evb=" << evb << ", fd=" << fd
          << ", zeroCopyBufId=" << zeroCopyBufId << ")";
  init();
  fd_ = fd;
  disableTransparentFunctions(fd_, noTransparentTls_, noTSocks_);
  setCloseOnExec();
  state_ = StateEnum::ESTABLISHED;
}

AsyncSocket::AsyncSocket(AsyncSocket::UniquePtr oldAsyncSocket)
    : AsyncSocket(
          oldAsyncSocket->getEventBase(),
          oldAsyncSocket->detachFd(),
          oldAsyncSocket->getZeroCopyBufId()) {
  preReceivedData_ = std::move(oldAsyncSocket->preReceivedData_);
}

// init() method, since constructor forwarding isn't supported in most
// compilers yet.
void AsyncSocket::init() {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }
  shutdownFlags_ = 0;
  state_ = StateEnum::UNINIT;
  eventFlags_ = EventHandler::NONE;
  fd_ = -1;
  sendTimeout_ = 0;
  maxReadsPerEvent_ = 16;
  connectCallback_ = nullptr;
  errMessageCallback_ = nullptr;
  readCallback_ = nullptr;
  writeReqHead_ = nullptr;
  writeReqTail_ = nullptr;
  wShutdownSocketSet_.reset();
  appBytesWritten_ = 0;
  appBytesReceived_ = 0;
  sendMsgParamCallback_ = &defaultSendMsgParamsCallback;
}

AsyncSocket::~AsyncSocket() {
  VLOG(7) << "actual destruction of AsyncSocket(this=" << this
          << ", evb=" << eventBase_ << ", fd=" << fd_ << ", state=" << state_
          << ")";
}

void AsyncSocket::destroy() {
  VLOG(5) << "AsyncSocket::destroy(this=" << this << ", evb=" << eventBase_
          << ", fd=" << fd_ << ", state=" << state_;
  // When destroy is called, close the socket immediately
  closeNow();

  // Then call DelayedDestruction::destroy() to take care of
  // whether or not we need immediate or delayed destruction
  DelayedDestruction::destroy();
}

int AsyncSocket::detachFd() {
  VLOG(6) << "AsyncSocket::detachFd(this=" << this << ", fd=" << fd_
          << ", evb=" << eventBase_ << ", state=" << state_
          << ", events=" << std::hex << eventFlags_ << ")";
  // Extract the fd, and set fd_ to -1 first, so closeNow() won't
  // actually close the descriptor.
  if (const auto socketSet = wShutdownSocketSet_.lock()) {
    socketSet->remove(fd_);
  }
  int fd = fd_;
  fd_ = -1;
  // Call closeNow() to invoke all pending callbacks with an error.
  closeNow();
  // Update the EventHandler to stop using this fd.
  // This can only be done after closeNow() unregisters the handler.
  ioHandler_.changeHandlerFD(-1);
  return fd;
}

const folly::SocketAddress& AsyncSocket::anyAddress() {
  static const folly::SocketAddress anyAddress =
      folly::SocketAddress("0.0.0.0", 0);
  return anyAddress;
}

void AsyncSocket::setShutdownSocketSet(
    const std::weak_ptr<ShutdownSocketSet>& wNewSS) {
  const auto newSS = wNewSS.lock();
  const auto shutdownSocketSet = wShutdownSocketSet_.lock();

  if (newSS == shutdownSocketSet) {
    return;
  }

  if (shutdownSocketSet && fd_ != -1) {
    shutdownSocketSet->remove(fd_);
  }

  if (newSS && fd_ != -1) {
    newSS->add(fd_);
  }

  wShutdownSocketSet_ = wNewSS;
}

void AsyncSocket::setCloseOnExec() {
  int rv = fcntl(fd_, F_SETFD, FD_CLOEXEC);
  if (rv != 0) {
    auto errnoCopy = errno;
    throw AsyncSocketException(
        AsyncSocketException::INTERNAL_ERROR,
        withAddr("failed to set close-on-exec flag"),
        errnoCopy);
  }
}

void AsyncSocket::connect(
    ConnectCallback* callback,
    const folly::SocketAddress& address,
    int timeout,
    const OptionMap& options,
    const folly::SocketAddress& bindAddr) noexcept {
  DestructorGuard dg(this);
  eventBase_->dcheckIsInEventBaseThread();

  addr_ = address;

  // Make sure we're in the uninitialized state
  if (state_ != StateEnum::UNINIT) {
    return invalidState(callback);
  }

  connectTimeout_ = std::chrono::milliseconds(timeout);
  connectStartTime_ = std::chrono::steady_clock::now();
  // Make connect end time at least >= connectStartTime.
  connectEndTime_ = connectStartTime_;

  assert(fd_ == -1);
  state_ = StateEnum::CONNECTING;
  connectCallback_ = callback;

  sockaddr_storage addrStorage;
  sockaddr* saddr = reinterpret_cast<sockaddr*>(&addrStorage);

  try {
    // Create the socket
    // Technically the first parameter should actually be a protocol family
    // constant (PF_xxx) rather than an address family (AF_xxx), but the
    // distinction is mainly just historical.  In pretty much all
    // implementations the PF_foo and AF_foo constants are identical.
    fd_ = fsp::socket(address.getFamily(), SOCK_STREAM, 0);
    if (fd_ < 0) {
      auto errnoCopy = errno;
      throw AsyncSocketException(
          AsyncSocketException::INTERNAL_ERROR,
          withAddr("failed to create socket"),
          errnoCopy);
    }
    disableTransparentFunctions(fd_, noTransparentTls_, noTSocks_);
    if (const auto shutdownSocketSet = wShutdownSocketSet_.lock()) {
      shutdownSocketSet->add(fd_);
    }
    ioHandler_.changeHandlerFD(fd_);

    setCloseOnExec();

    // Put the socket in non-blocking mode
    int flags = fcntl(fd_, F_GETFL, 0);
    if (flags == -1) {
      auto errnoCopy = errno;
      throw AsyncSocketException(
          AsyncSocketException::INTERNAL_ERROR,
          withAddr("failed to get socket flags"),
          errnoCopy);
    }
    int rv = fcntl(fd_, F_SETFL, flags | O_NONBLOCK);
    if (rv == -1) {
      auto errnoCopy = errno;
      throw AsyncSocketException(
          AsyncSocketException::INTERNAL_ERROR,
          withAddr("failed to put socket in non-blocking mode"),
          errnoCopy);
    }

#if !defined(MSG_NOSIGNAL) && defined(F_SETNOSIGPIPE)
    // iOS and OS X don't support MSG_NOSIGNAL; set F_SETNOSIGPIPE instead
    rv = fcntl(fd_, F_SETNOSIGPIPE, 1);
    if (rv == -1) {
      auto errnoCopy = errno;
      throw AsyncSocketException(
          AsyncSocketException::INTERNAL_ERROR,
          "failed to enable F_SETNOSIGPIPE on socket",
          errnoCopy);
    }
#endif

    // By default, turn on TCP_NODELAY
    // If setNoDelay() fails, we continue anyway; this isn't a fatal error.
    // setNoDelay() will log an error message if it fails.
    // Also set the cached zeroCopyVal_ since it cannot be set earlier if the fd
    // is not created
    if (address.getFamily() != AF_UNIX) {
      (void)setNoDelay(true);
      setZeroCopy(zeroCopyVal_);
    }

    VLOG(5) << "AsyncSocket::connect(this=" << this << ", evb=" << eventBase_
            << ", fd=" << fd_ << ", host=" << address.describe().c_str();

    // bind the socket
    if (bindAddr != anyAddress()) {
      int one = 1;
      if (setsockopt(fd_, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one))) {
        auto errnoCopy = errno;
        doClose();
        throw AsyncSocketException(
            AsyncSocketException::NOT_OPEN,
            "failed to setsockopt prior to bind on " + bindAddr.describe(),
            errnoCopy);
      }

      bindAddr.getAddress(&addrStorage);

      if (bind(fd_, saddr, bindAddr.getActualSize()) != 0) {
        auto errnoCopy = errno;
        doClose();
        throw AsyncSocketException(
            AsyncSocketException::NOT_OPEN,
            "failed to bind to async socket: " + bindAddr.describe(),
            errnoCopy);
      }
    }

    // Apply the additional options if any.
    for (const auto& opt : options) {
      rv = opt.first.apply(fd_, opt.second);
      if (rv != 0) {
        auto errnoCopy = errno;
        throw AsyncSocketException(
            AsyncSocketException::INTERNAL_ERROR,
            withAddr("failed to set socket option"),
            errnoCopy);
      }
    }

    // Perform the connect()
    address.getAddress(&addrStorage);

    if (tfoEnabled_) {
      state_ = StateEnum::FAST_OPEN;
      tfoAttempted_ = true;
    } else {
      if (socketConnect(saddr, addr_.getActualSize()) < 0) {
        return;
      }
    }

    // If we're still here the connect() succeeded immediately.
    // Fall through to call the callback outside of this try...catch block
  } catch (const AsyncSocketException& ex) {
    return failConnect(__func__, ex);
  } catch (const std::exception& ex) {
    // shouldn't happen, but handle it just in case
    VLOG(4) << "AsyncSocket::connect(this=" << this << ", fd=" << fd_
            << "): unexpected " << typeid(ex).name()
            << " exception: " << ex.what();
    AsyncSocketException tex(
        AsyncSocketException::INTERNAL_ERROR,
        withAddr(string("unexpected exception: ") + ex.what()));
    return failConnect(__func__, tex);
  }

  // The connection succeeded immediately
  // The read callback may not have been set yet, and no writes may be pending
  // yet, so we don't have to register for any events at the moment.
  VLOG(8) << "AsyncSocket::connect succeeded immediately; this=" << this;
  assert(errMessageCallback_ == nullptr);
  assert(readCallback_ == nullptr);
  assert(writeReqHead_ == nullptr);
  if (state_ != StateEnum::FAST_OPEN) {
    state_ = StateEnum::ESTABLISHED;
  }
  invokeConnectSuccess();
}

int AsyncSocket::socketConnect(const struct sockaddr* saddr, socklen_t len) {
  int rv = fsp::connect(fd_, saddr, len);
  if (rv < 0) {
    auto errnoCopy = errno;
    if (errnoCopy == EINPROGRESS) {
      scheduleConnectTimeout();
      registerForConnectEvents();
    } else {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "connect failed (immediately)",
          errnoCopy);
    }
  }
  return rv;
}

void AsyncSocket::scheduleConnectTimeout() {
  // Connection in progress.
  auto timeout = connectTimeout_.count();
  if (timeout > 0) {
    // Start a timer in case the connection takes too long.
    if (!writeTimeout_.scheduleTimeout(uint32_t(timeout))) {
      throw AsyncSocketException(
          AsyncSocketException::INTERNAL_ERROR,
          withAddr("failed to schedule AsyncSocket connect timeout"));
    }
  }
}

void AsyncSocket::registerForConnectEvents() {
  // Register for write events, so we'll
  // be notified when the connection finishes/fails.
  // Note that we don't register for a persistent event here.
  assert(eventFlags_ == EventHandler::NONE);
  eventFlags_ = EventHandler::WRITE;
  if (!ioHandler_.registerHandler(eventFlags_)) {
    throw AsyncSocketException(
        AsyncSocketException::INTERNAL_ERROR,
        withAddr("failed to register AsyncSocket connect handler"));
  }
}

void AsyncSocket::connect(
    ConnectCallback* callback,
    const string& ip,
    uint16_t port,
    int timeout,
    const OptionMap& options) noexcept {
  DestructorGuard dg(this);
  try {
    connectCallback_ = callback;
    connect(callback, folly::SocketAddress(ip, port), timeout, options);
  } catch (const std::exception& ex) {
    AsyncSocketException tex(AsyncSocketException::INTERNAL_ERROR, ex.what());
    return failConnect(__func__, tex);
  }
}

void AsyncSocket::cancelConnect() {
  connectCallback_ = nullptr;
  if (state_ == StateEnum::CONNECTING || state_ == StateEnum::FAST_OPEN) {
    closeNow();
  }
}

void AsyncSocket::setSendTimeout(uint32_t milliseconds) {
  sendTimeout_ = milliseconds;
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  // If we are currently pending on write requests, immediately update
  // writeTimeout_ with the new value.
  if ((eventFlags_ & EventHandler::WRITE) &&
      (state_ != StateEnum::CONNECTING && state_ != StateEnum::FAST_OPEN)) {
    assert(state_ == StateEnum::ESTABLISHED);
    assert((shutdownFlags_ & SHUT_WRITE) == 0);
    if (sendTimeout_ > 0) {
      if (!writeTimeout_.scheduleTimeout(sendTimeout_)) {
        AsyncSocketException ex(
            AsyncSocketException::INTERNAL_ERROR,
            withAddr("failed to reschedule send timeout in setSendTimeout"));
        return failWrite(__func__, ex);
      }
    } else {
      writeTimeout_.cancelTimeout();
    }
  }
}

void AsyncSocket::setErrMessageCB(ErrMessageCallback* callback) {
  VLOG(6) << "AsyncSocket::setErrMessageCB() this=" << this << ", fd=" << fd_
          << ", callback=" << callback << ", state=" << state_;

  // In the latest stable kernel 4.14.3 as of 2017-12-04, unix domain
  // socket does not support MSG_ERRQUEUE. So recvmsg(MSG_ERRQUEUE)
  // will read application data from unix doamin socket as error
  // message, which breaks the message flow in application.  Feel free
  // to remove the next code block if MSG_ERRQUEUE is added for unix
  // domain socket in the future.
  if (callback != nullptr) {
    cacheLocalAddress();
    if (localAddr_.getFamily() == AF_UNIX) {
      LOG(ERROR) << "Failed to set ErrMessageCallback=" << callback
                 << " for Unix Doamin Socket where MSG_ERRQUEUE is unsupported,"
                 << " fd=" << fd_;
      return;
    }
  }

  // Short circuit if callback is the same as the existing errMessageCallback_.
  if (callback == errMessageCallback_) {
    return;
  }

  if (!msgErrQueueSupported) {
    // Per-socket error message queue is not supported on this platform.
    return invalidState(callback);
  }

  DestructorGuard dg(this);
  eventBase_->dcheckIsInEventBaseThread();

  if (callback == nullptr) {
    // We should be able to reset the callback regardless of the
    // socket state. It's important to have a reliable callback
    // cancellation mechanism.
    errMessageCallback_ = callback;
    return;
  }

  switch ((StateEnum)state_) {
    case StateEnum::CONNECTING:
    case StateEnum::FAST_OPEN:
    case StateEnum::ESTABLISHED: {
      errMessageCallback_ = callback;
      return;
    }
    case StateEnum::CLOSED:
    case StateEnum::ERROR:
      // We should never reach here.  SHUT_READ should always be set
      // if we are in STATE_CLOSED or STATE_ERROR.
      assert(false);
      return invalidState(callback);
    case StateEnum::UNINIT:
      // We do not allow setReadCallback() to be called before we start
      // connecting.
      return invalidState(callback);
  }

  // We don't put a default case in the switch statement, so that the compiler
  // will warn us to update the switch statement if a new state is added.
  return invalidState(callback);
}

AsyncSocket::ErrMessageCallback* AsyncSocket::getErrMessageCallback() const {
  return errMessageCallback_;
}

void AsyncSocket::setSendMsgParamCB(SendMsgParamsCallback* callback) {
  sendMsgParamCallback_ = callback;
}

AsyncSocket::SendMsgParamsCallback* AsyncSocket::getSendMsgParamsCB() const {
  return sendMsgParamCallback_;
}

void AsyncSocket::setReadCB(ReadCallback* callback) {
  VLOG(6) << "AsyncSocket::setReadCallback() this=" << this << ", fd=" << fd_
          << ", callback=" << callback << ", state=" << state_;

  // Short circuit if callback is the same as the existing readCallback_.
  //
  // Note that this is needed for proper functioning during some cleanup cases.
  // During cleanup we allow setReadCallback(nullptr) to be called even if the
  // read callback is already unset and we have been detached from an event
  // base.  This check prevents us from asserting
  // eventBase_->isInEventBaseThread() when eventBase_ is nullptr.
  if (callback == readCallback_) {
    return;
  }

  /* We are removing a read callback */
  if (callback == nullptr && immediateReadHandler_.isLoopCallbackScheduled()) {
    immediateReadHandler_.cancelLoopCallback();
  }

  if (shutdownFlags_ & SHUT_READ) {
    // Reads have already been shut down on this socket.
    //
    // Allow setReadCallback(nullptr) to be called in this case, but don't
    // allow a new callback to be set.
    //
    // For example, setReadCallback(nullptr) can happen after an error if we
    // invoke some other error callback before invoking readError().  The other
    // error callback that is invoked first may go ahead and clear the read
    // callback before we get a chance to invoke readError().
    if (callback != nullptr) {
      return invalidState(callback);
    }
    assert((eventFlags_ & EventHandler::READ) == 0);
    readCallback_ = nullptr;
    return;
  }

  DestructorGuard dg(this);
  eventBase_->dcheckIsInEventBaseThread();

  switch ((StateEnum)state_) {
    case StateEnum::CONNECTING:
    case StateEnum::FAST_OPEN:
      // For convenience, we allow the read callback to be set while we are
      // still connecting.  We just store the callback for now.  Once the
      // connection completes we'll register for read events.
      readCallback_ = callback;
      return;
    case StateEnum::ESTABLISHED: {
      readCallback_ = callback;
      uint16_t oldFlags = eventFlags_;
      if (readCallback_) {
        eventFlags_ |= EventHandler::READ;
      } else {
        eventFlags_ &= ~EventHandler::READ;
      }

      // Update our registration if our flags have changed
      if (eventFlags_ != oldFlags) {
        // We intentionally ignore the return value here.
        // updateEventRegistration() will move us into the error state if it
        // fails, and we don't need to do anything else here afterwards.
        (void)updateEventRegistration();
      }

      if (readCallback_) {
        checkForImmediateRead();
      }
      return;
    }
    case StateEnum::CLOSED:
    case StateEnum::ERROR:
      // We should never reach here.  SHUT_READ should always be set
      // if we are in STATE_CLOSED or STATE_ERROR.
      assert(false);
      return invalidState(callback);
    case StateEnum::UNINIT:
      // We do not allow setReadCallback() to be called before we start
      // connecting.
      return invalidState(callback);
  }

  // We don't put a default case in the switch statement, so that the compiler
  // will warn us to update the switch statement if a new state is added.
  return invalidState(callback);
}

AsyncSocket::ReadCallback* AsyncSocket::getReadCallback() const {
  return readCallback_;
}

bool AsyncSocket::setZeroCopy(bool enable) {
  if (msgErrQueueSupported) {
    zeroCopyVal_ = enable;

    if (fd_ < 0) {
      return false;
    }

    int val = enable ? 1 : 0;
    int ret = setsockopt(fd_, SOL_SOCKET, SO_ZEROCOPY, &val, sizeof(val));

    // if enable == false, set zeroCopyEnabled_ = false regardless
    // if SO_ZEROCOPY is set or not
    if (!enable) {
      zeroCopyEnabled_ = enable;
      return true;
    }

    /* if the setsockopt failed, try to see if the socket inherited the flag
     * since we cannot set SO_ZEROCOPY on a socket s = accept
     */
    if (ret) {
      val = 0;
      socklen_t optlen = sizeof(val);
      ret = getsockopt(fd_, SOL_SOCKET, SO_ZEROCOPY, &val, &optlen);

      if (!ret) {
        enable = val ? true : false;
      }
    }

    if (!ret) {
      zeroCopyEnabled_ = enable;

      return true;
    }
  }

  return false;
}

void AsyncSocket::setZeroCopyReenableThreshold(size_t threshold) {
  zeroCopyReenableThreshold_ = threshold;
}

bool AsyncSocket::isZeroCopyRequest(WriteFlags flags) {
  return (zeroCopyEnabled_ && isSet(flags, WriteFlags::WRITE_MSG_ZEROCOPY));
}

void AsyncSocket::adjustZeroCopyFlags(folly::WriteFlags& flags) {
  if (!zeroCopyEnabled_) {
    // if the zeroCopyReenableCounter_ is > 0
    // we try to dec and if we reach 0
    // we set zeroCopyEnabled_ to true
    if (zeroCopyReenableCounter_) {
      if (0 == --zeroCopyReenableCounter_) {
        zeroCopyEnabled_ = true;
        return;
      }
    }
    flags = unSet(flags, folly::WriteFlags::WRITE_MSG_ZEROCOPY);
  }
}

void AsyncSocket::addZeroCopyBuf(std::unique_ptr<folly::IOBuf>&& buf) {
  uint32_t id = getNextZeroCopyBufId();
  folly::IOBuf* ptr = buf.get();

  idZeroCopyBufPtrMap_[id] = ptr;
  auto& p = idZeroCopyBufInfoMap_[ptr];
  p.count_++;
  CHECK(p.buf_.get() == nullptr);
  p.buf_ = std::move(buf);
}

void AsyncSocket::addZeroCopyBuf(folly::IOBuf* ptr) {
  uint32_t id = getNextZeroCopyBufId();
  idZeroCopyBufPtrMap_[id] = ptr;

  idZeroCopyBufInfoMap_[ptr].count_++;
}

void AsyncSocket::releaseZeroCopyBuf(uint32_t id) {
  auto iter = idZeroCopyBufPtrMap_.find(id);
  CHECK(iter != idZeroCopyBufPtrMap_.end());
  auto ptr = iter->second;
  auto iter1 = idZeroCopyBufInfoMap_.find(ptr);
  CHECK(iter1 != idZeroCopyBufInfoMap_.end());
  if (0 == --iter1->second.count_) {
    idZeroCopyBufInfoMap_.erase(iter1);
  }

  idZeroCopyBufPtrMap_.erase(iter);
}

void AsyncSocket::setZeroCopyBuf(std::unique_ptr<folly::IOBuf>&& buf) {
  folly::IOBuf* ptr = buf.get();
  auto& p = idZeroCopyBufInfoMap_[ptr];
  CHECK(p.buf_.get() == nullptr);

  p.buf_ = std::move(buf);
}

bool AsyncSocket::containsZeroCopyBuf(folly::IOBuf* ptr) {
  return (idZeroCopyBufInfoMap_.find(ptr) != idZeroCopyBufInfoMap_.end());
}

bool AsyncSocket::isZeroCopyMsg(const cmsghdr& cmsg) const {
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  if ((cmsg.cmsg_level == SOL_IP && cmsg.cmsg_type == IP_RECVERR) ||
      (cmsg.cmsg_level == SOL_IPV6 && cmsg.cmsg_type == IPV6_RECVERR)) {
    const struct sock_extended_err* serr =
        reinterpret_cast<const struct sock_extended_err*>(CMSG_DATA(&cmsg));
    return (
        (serr->ee_errno == 0) && (serr->ee_origin == SO_EE_ORIGIN_ZEROCOPY));
  }
#endif
  (void)cmsg;
  return false;
}

void AsyncSocket::processZeroCopyMsg(const cmsghdr& cmsg) {
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  const struct sock_extended_err* serr =
      reinterpret_cast<const struct sock_extended_err*>(CMSG_DATA(&cmsg));
  uint32_t hi = serr->ee_data;
  uint32_t lo = serr->ee_info;
  // disable zero copy if the buffer was actually copied
  if ((serr->ee_code & SO_EE_CODE_ZEROCOPY_COPIED) && zeroCopyEnabled_) {
    VLOG(2) << "AsyncSocket::processZeroCopyMsg(): setting "
            << "zeroCopyEnabled_ = false due to SO_EE_CODE_ZEROCOPY_COPIED "
            << "on " << fd_;
    zeroCopyEnabled_ = false;
  }

  for (uint32_t i = lo; i <= hi; i++) {
    releaseZeroCopyBuf(i);
  }
#else
  (void)cmsg;
#endif
}

void AsyncSocket::write(
    WriteCallback* callback,
    const void* buf,
    size_t bytes,
    WriteFlags flags) {
  iovec op;
  op.iov_base = const_cast<void*>(buf);
  op.iov_len = bytes;
  writeImpl(callback, &op, 1, unique_ptr<IOBuf>(), flags);
}

void AsyncSocket::writev(
    WriteCallback* callback,
    const iovec* vec,
    size_t count,
    WriteFlags flags) {
  writeImpl(callback, vec, count, unique_ptr<IOBuf>(), flags);
}

void AsyncSocket::writeChain(
    WriteCallback* callback,
    unique_ptr<IOBuf>&& buf,
    WriteFlags flags) {
  adjustZeroCopyFlags(flags);

  constexpr size_t kSmallSizeMax = 64;
  size_t count = buf->countChainElements();
  if (count <= kSmallSizeMax) {
    // suppress "warning: variable length array 'vec' is used [-Wvla]"
    FOLLY_PUSH_WARNING
    FOLLY_GNU_DISABLE_WARNING("-Wvla")
    iovec vec[BOOST_PP_IF(FOLLY_HAVE_VLA_01, count, kSmallSizeMax)];
    FOLLY_POP_WARNING

    writeChainImpl(callback, vec, count, std::move(buf), flags);
  } else {
    iovec* vec = new iovec[count];
    writeChainImpl(callback, vec, count, std::move(buf), flags);
    delete[] vec;
  }
}

void AsyncSocket::writeChainImpl(
    WriteCallback* callback,
    iovec* vec,
    size_t count,
    unique_ptr<IOBuf>&& buf,
    WriteFlags flags) {
  size_t veclen = buf->fillIov(vec, count);
  writeImpl(callback, vec, veclen, std::move(buf), flags);
}

void AsyncSocket::writeImpl(
    WriteCallback* callback,
    const iovec* vec,
    size_t count,
    unique_ptr<IOBuf>&& buf,
    WriteFlags flags) {
  VLOG(6) << "AsyncSocket::writev() this=" << this << ", fd=" << fd_
          << ", callback=" << callback << ", count=" << count
          << ", state=" << state_;
  DestructorGuard dg(this);
  unique_ptr<IOBuf> ioBuf(std::move(buf));
  eventBase_->dcheckIsInEventBaseThread();

  if (shutdownFlags_ & (SHUT_WRITE | SHUT_WRITE_PENDING)) {
    // No new writes may be performed after the write side of the socket has
    // been shutdown.
    //
    // We could just call callback->writeError() here to fail just this write.
    // However, fail hard and use invalidState() to fail all outstanding
    // callbacks and move the socket into the error state.  There's most likely
    // a bug in the caller's code, so we abort everything rather than trying to
    // proceed as best we can.
    return invalidState(callback);
  }

  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  ssize_t bytesWritten = 0;
  bool mustRegister = false;
  if ((state_ == StateEnum::ESTABLISHED || state_ == StateEnum::FAST_OPEN) &&
      !connecting()) {
    if (writeReqHead_ == nullptr) {
      // If we are established and there are no other writes pending,
      // we can attempt to perform the write immediately.
      assert(writeReqTail_ == nullptr);
      assert((eventFlags_ & EventHandler::WRITE) == 0);

      auto writeResult = performWrite(
          vec, uint32_t(count), flags, &countWritten, &partialWritten);
      bytesWritten = writeResult.writeReturn;
      if (bytesWritten < 0) {
        auto errnoCopy = errno;
        if (writeResult.exception) {
          return failWrite(__func__, callback, 0, *writeResult.exception);
        }
        AsyncSocketException ex(
            AsyncSocketException::INTERNAL_ERROR,
            withAddr("writev failed"),
            errnoCopy);
        return failWrite(__func__, callback, 0, ex);
      } else if (countWritten == count) {
        // done, add the whole buffer
        if (countWritten && isZeroCopyRequest(flags)) {
          addZeroCopyBuf(std::move(ioBuf));
        }
        // We successfully wrote everything.
        // Invoke the callback and return.
        if (callback) {
          callback->writeSuccess();
        }
        return;
      } else { // continue writing the next writeReq
        // add just the ptr
        if (bytesWritten && isZeroCopyRequest(flags)) {
          addZeroCopyBuf(ioBuf.get());
        }
        if (bufferCallback_) {
          bufferCallback_->onEgressBuffered();
        }
      }
      if (!connecting()) {
        // Writes might put the socket back into connecting state
        // if TFO is enabled, and using TFO fails.
        // This means that write timeouts would not be active, however
        // connect timeouts would affect this stage.
        mustRegister = true;
      }
    }
  } else if (!connecting()) {
    // Invalid state for writing
    return invalidState(callback);
  }

  // Create a new WriteRequest to add to the queue
  WriteRequest* req;
  try {
    req = BytesWriteRequest::newRequest(
        this,
        callback,
        vec + countWritten,
        uint32_t(count - countWritten),
        partialWritten,
        uint32_t(bytesWritten),
        std::move(ioBuf),
        flags);
  } catch (const std::exception& ex) {
    // we mainly expect to catch std::bad_alloc here
    AsyncSocketException tex(
        AsyncSocketException::INTERNAL_ERROR,
        withAddr(string("failed to append new WriteRequest: ") + ex.what()));
    return failWrite(__func__, callback, size_t(bytesWritten), tex);
  }
  req->consume();
  if (writeReqTail_ == nullptr) {
    assert(writeReqHead_ == nullptr);
    writeReqHead_ = writeReqTail_ = req;
  } else {
    writeReqTail_->append(req);
    writeReqTail_ = req;
  }

  // Register for write events if are established and not currently
  // waiting on write events
  if (mustRegister) {
    assert(state_ == StateEnum::ESTABLISHED);
    assert((eventFlags_ & EventHandler::WRITE) == 0);
    if (!updateEventRegistration(EventHandler::WRITE, 0)) {
      assert(state_ == StateEnum::ERROR);
      return;
    }
    if (sendTimeout_ > 0) {
      // Schedule a timeout to fire if the write takes too long.
      if (!writeTimeout_.scheduleTimeout(sendTimeout_)) {
        AsyncSocketException ex(
            AsyncSocketException::INTERNAL_ERROR,
            withAddr("failed to schedule send timeout"));
        return failWrite(__func__, ex);
      }
    }
  }
}

void AsyncSocket::writeRequest(WriteRequest* req) {
  if (writeReqTail_ == nullptr) {
    assert(writeReqHead_ == nullptr);
    writeReqHead_ = writeReqTail_ = req;
    req->start();
  } else {
    writeReqTail_->append(req);
    writeReqTail_ = req;
  }
}

void AsyncSocket::close() {
  VLOG(5) << "AsyncSocket::close(): this=" << this << ", fd_=" << fd_
          << ", state=" << state_ << ", shutdownFlags=" << std::hex
          << (int)shutdownFlags_;

  // close() is only different from closeNow() when there are pending writes
  // that need to drain before we can close.  In all other cases, just call
  // closeNow().
  //
  // Note that writeReqHead_ can be non-nullptr even in STATE_CLOSED or
  // STATE_ERROR if close() is invoked while a previous closeNow() or failure
  // is still running.  (e.g., If there are multiple pending writes, and we
  // call writeError() on the first one, it may call close().  In this case we
  // will already be in STATE_CLOSED or STATE_ERROR, but the remaining pending
  // writes will still be in the queue.)
  //
  // We only need to drain pending writes if we are still in STATE_CONNECTING
  // or STATE_ESTABLISHED
  if ((writeReqHead_ == nullptr) ||
      !(state_ == StateEnum::CONNECTING || state_ == StateEnum::ESTABLISHED)) {
    closeNow();
    return;
  }

  // Declare a DestructorGuard to ensure that the AsyncSocket cannot be
  // destroyed until close() returns.
  DestructorGuard dg(this);
  eventBase_->dcheckIsInEventBaseThread();

  // Since there are write requests pending, we have to set the
  // SHUT_WRITE_PENDING flag, and wait to perform the real close until the
  // connect finishes and we finish writing these requests.
  //
  // Set SHUT_READ to indicate that reads are shut down, and set the
  // SHUT_WRITE_PENDING flag to mark that we want to shutdown once the
  // pending writes complete.
  shutdownFlags_ |= (SHUT_READ | SHUT_WRITE_PENDING);

  // If a read callback is set, invoke readEOF() immediately to inform it that
  // the socket has been closed and no more data can be read.
  if (readCallback_) {
    // Disable reads if they are enabled
    if (!updateEventRegistration(0, EventHandler::READ)) {
      // We're now in the error state; callbacks have been cleaned up
      assert(state_ == StateEnum::ERROR);
      assert(readCallback_ == nullptr);
    } else {
      ReadCallback* callback = readCallback_;
      readCallback_ = nullptr;
      callback->readEOF();
    }
  }
}

void AsyncSocket::closeNow() {
  VLOG(5) << "AsyncSocket::closeNow(): this=" << this << ", fd_=" << fd_
          << ", state=" << state_ << ", shutdownFlags=" << std::hex
          << (int)shutdownFlags_;
  DestructorGuard dg(this);
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  switch (state_) {
    case StateEnum::ESTABLISHED:
    case StateEnum::CONNECTING:
    case StateEnum::FAST_OPEN: {
      shutdownFlags_ |= (SHUT_READ | SHUT_WRITE);
      state_ = StateEnum::CLOSED;

      // If the write timeout was set, cancel it.
      writeTimeout_.cancelTimeout();

      // If we are registered for I/O events, unregister.
      if (eventFlags_ != EventHandler::NONE) {
        eventFlags_ = EventHandler::NONE;
        if (!updateEventRegistration()) {
          // We will have been moved into the error state.
          assert(state_ == StateEnum::ERROR);
          return;
        }
      }

      if (immediateReadHandler_.isLoopCallbackScheduled()) {
        immediateReadHandler_.cancelLoopCallback();
      }

      if (fd_ >= 0) {
        ioHandler_.changeHandlerFD(-1);
        doClose();
      }

      invokeConnectErr(socketClosedLocallyEx);

      failAllWrites(socketClosedLocallyEx);

      if (readCallback_) {
        ReadCallback* callback = readCallback_;
        readCallback_ = nullptr;
        callback->readEOF();
      }
      return;
    }
    case StateEnum::CLOSED:
      // Do nothing.  It's possible that we are being called recursively
      // from inside a callback that we invoked inside another call to close()
      // that is still running.
      return;
    case StateEnum::ERROR:
      // Do nothing.  The error handling code has performed (or is performing)
      // cleanup.
      return;
    case StateEnum::UNINIT:
      assert(eventFlags_ == EventHandler::NONE);
      assert(connectCallback_ == nullptr);
      assert(readCallback_ == nullptr);
      assert(writeReqHead_ == nullptr);
      shutdownFlags_ |= (SHUT_READ | SHUT_WRITE);
      state_ = StateEnum::CLOSED;
      return;
  }

  LOG(DFATAL) << "AsyncSocket::closeNow() (this=" << this << ", fd=" << fd_
              << ") called in unknown state " << state_;
}

void AsyncSocket::closeWithReset() {
  // Enable SO_LINGER, with the linger timeout set to 0.
  // This will trigger a TCP reset when we close the socket.
  if (fd_ >= 0) {
    struct linger optLinger = {1, 0};
    if (setSockOpt(SOL_SOCKET, SO_LINGER, &optLinger) != 0) {
      VLOG(2) << "AsyncSocket::closeWithReset(): error setting SO_LINGER "
              << "on " << fd_ << ": errno=" << errno;
    }
  }

  // Then let closeNow() take care of the rest
  closeNow();
}

void AsyncSocket::shutdownWrite() {
  VLOG(5) << "AsyncSocket::shutdownWrite(): this=" << this << ", fd=" << fd_
          << ", state=" << state_ << ", shutdownFlags=" << std::hex
          << (int)shutdownFlags_;

  // If there are no pending writes, shutdownWrite() is identical to
  // shutdownWriteNow().
  if (writeReqHead_ == nullptr) {
    shutdownWriteNow();
    return;
  }

  eventBase_->dcheckIsInEventBaseThread();

  // There are pending writes.  Set SHUT_WRITE_PENDING so that the actual
  // shutdown will be performed once all writes complete.
  shutdownFlags_ |= SHUT_WRITE_PENDING;
}

void AsyncSocket::shutdownWriteNow() {
  VLOG(5) << "AsyncSocket::shutdownWriteNow(): this=" << this << ", fd=" << fd_
          << ", state=" << state_ << ", shutdownFlags=" << std::hex
          << (int)shutdownFlags_;

  if (shutdownFlags_ & SHUT_WRITE) {
    // Writes are already shutdown; nothing else to do.
    return;
  }

  // If SHUT_READ is already set, just call closeNow() to completely
  // close the socket.  This can happen if close() was called with writes
  // pending, and then shutdownWriteNow() is called before all pending writes
  // complete.
  if (shutdownFlags_ & SHUT_READ) {
    closeNow();
    return;
  }

  DestructorGuard dg(this);
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  switch (static_cast<StateEnum>(state_)) {
    case StateEnum::ESTABLISHED: {
      shutdownFlags_ |= SHUT_WRITE;

      // If the write timeout was set, cancel it.
      writeTimeout_.cancelTimeout();

      // If we are registered for write events, unregister.
      if (!updateEventRegistration(0, EventHandler::WRITE)) {
        // We will have been moved into the error state.
        assert(state_ == StateEnum::ERROR);
        return;
      }

      // Shutdown writes on the file descriptor
      shutdown(fd_, SHUT_WR);

      // Immediately fail all write requests
      failAllWrites(socketShutdownForWritesEx);
      return;
    }
    case StateEnum::CONNECTING: {
      // Set the SHUT_WRITE_PENDING flag.
      // When the connection completes, it will check this flag,
      // shutdown the write half of the socket, and then set SHUT_WRITE.
      shutdownFlags_ |= SHUT_WRITE_PENDING;

      // Immediately fail all write requests
      failAllWrites(socketShutdownForWritesEx);
      return;
    }
    case StateEnum::UNINIT:
      // Callers normally shouldn't call shutdownWriteNow() before the socket
      // even starts connecting.  Nonetheless, go ahead and set
      // SHUT_WRITE_PENDING.  Once the socket eventually connects it will
      // immediately shut down the write side of the socket.
      shutdownFlags_ |= SHUT_WRITE_PENDING;
      return;
    case StateEnum::FAST_OPEN:
      // In fast open state we haven't call connected yet, and if we shutdown
      // the writes, we will never try to call connect, so shut everything down
      shutdownFlags_ |= SHUT_WRITE;
      // Immediately fail all write requests
      failAllWrites(socketShutdownForWritesEx);
      return;
    case StateEnum::CLOSED:
    case StateEnum::ERROR:
      // We should never get here.  SHUT_WRITE should always be set
      // in STATE_CLOSED and STATE_ERROR.
      VLOG(4) << "AsyncSocket::shutdownWriteNow() (this=" << this
              << ", fd=" << fd_ << ") in unexpected state " << state_
              << " with SHUT_WRITE not set (" << std::hex << (int)shutdownFlags_
              << ")";
      assert(false);
      return;
  }

  LOG(DFATAL) << "AsyncSocket::shutdownWriteNow() (this=" << this
              << ", fd=" << fd_ << ") called in unknown state " << state_;
}

bool AsyncSocket::readable() const {
  if (fd_ == -1) {
    return false;
  }
  struct pollfd fds[1];
  fds[0].fd = fd_;
  fds[0].events = POLLIN;
  fds[0].revents = 0;
  int rc = poll(fds, 1, 0);
  return rc == 1;
}

bool AsyncSocket::writable() const {
  if (fd_ == -1) {
    return false;
  }
  struct pollfd fds[1];
  fds[0].fd = fd_;
  fds[0].events = POLLOUT;
  fds[0].revents = 0;
  int rc = poll(fds, 1, 0);
  return rc == 1;
}

bool AsyncSocket::isPending() const {
  return ioHandler_.isPending();
}

bool AsyncSocket::hangup() const {
  if (fd_ == -1) {
    // sanity check, no one should ask for hangup if we are not connected.
    assert(false);
    return false;
  }
#ifdef POLLRDHUP // Linux-only
  struct pollfd fds[1];
  fds[0].fd = fd_;
  fds[0].events = POLLRDHUP | POLLHUP;
  fds[0].revents = 0;
  poll(fds, 1, 0);
  return (fds[0].revents & (POLLRDHUP | POLLHUP)) != 0;
#else
  return false;
#endif
}

bool AsyncSocket::good() const {
  return (
      (state_ == StateEnum::CONNECTING || state_ == StateEnum::FAST_OPEN ||
       state_ == StateEnum::ESTABLISHED) &&
      (shutdownFlags_ == 0) && (eventBase_ != nullptr));
}

bool AsyncSocket::error() const {
  return (state_ == StateEnum::ERROR);
}

void AsyncSocket::attachEventBase(EventBase* eventBase) {
  VLOG(5) << "AsyncSocket::attachEventBase(this=" << this << ", fd=" << fd_
          << ", old evb=" << eventBase_ << ", new evb=" << eventBase
          << ", state=" << state_ << ", events=" << std::hex << eventFlags_
          << ")";
  assert(eventBase_ == nullptr);
  eventBase->dcheckIsInEventBaseThread();

  eventBase_ = eventBase;
  ioHandler_.attachEventBase(eventBase);

  updateEventRegistration();

  writeTimeout_.attachEventBase(eventBase);
  if (evbChangeCb_) {
    evbChangeCb_->evbAttached(this);
  }
}

void AsyncSocket::detachEventBase() {
  VLOG(5) << "AsyncSocket::detachEventBase(this=" << this << ", fd=" << fd_
          << ", old evb=" << eventBase_ << ", state=" << state_
          << ", events=" << std::hex << eventFlags_ << ")";
  assert(eventBase_ != nullptr);
  eventBase_->dcheckIsInEventBaseThread();

  eventBase_ = nullptr;

  ioHandler_.unregisterHandler();

  ioHandler_.detachEventBase();
  writeTimeout_.detachEventBase();
  if (evbChangeCb_) {
    evbChangeCb_->evbDetached(this);
  }
}

bool AsyncSocket::isDetachable() const {
  DCHECK(eventBase_ != nullptr);
  eventBase_->dcheckIsInEventBaseThread();

  return !writeTimeout_.isScheduled();
}

void AsyncSocket::cacheAddresses() {
  if (fd_ >= 0) {
    try {
      cacheLocalAddress();
      cachePeerAddress();
    } catch (const std::system_error& e) {
      if (e.code() != std::error_code(ENOTCONN, std::system_category())) {
        VLOG(2) << "Error caching addresses: " << e.code().value() << ", "
                << e.code().message();
      }
    }
  }
}

void AsyncSocket::cacheLocalAddress() const {
  if (!localAddr_.isInitialized()) {
    localAddr_.setFromLocalAddress(fd_);
  }
}

void AsyncSocket::cachePeerAddress() const {
  if (!addr_.isInitialized()) {
    addr_.setFromPeerAddress(fd_);
  }
}

bool AsyncSocket::isZeroCopyWriteInProgress() const noexcept {
  eventBase_->dcheckIsInEventBaseThread();
  return (!idZeroCopyBufPtrMap_.empty());
}

void AsyncSocket::getLocalAddress(folly::SocketAddress* address) const {
  cacheLocalAddress();
  *address = localAddr_;
}

void AsyncSocket::getPeerAddress(folly::SocketAddress* address) const {
  cachePeerAddress();
  *address = addr_;
}

bool AsyncSocket::getTFOSucceded() const {
  return detail::tfo_succeeded(fd_);
}

int AsyncSocket::setNoDelay(bool noDelay) {
  if (fd_ < 0) {
    VLOG(4) << "AsyncSocket::setNoDelay() called on non-open socket " << this
            << "(state=" << state_ << ")";
    return EINVAL;
  }

  int value = noDelay ? 1 : 0;
  if (setsockopt(fd_, IPPROTO_TCP, TCP_NODELAY, &value, sizeof(value)) != 0) {
    int errnoCopy = errno;
    VLOG(2) << "failed to update TCP_NODELAY option on AsyncSocket " << this
            << " (fd=" << fd_ << ", state=" << state_
            << "): " << errnoStr(errnoCopy);
    return errnoCopy;
  }

  return 0;
}

int AsyncSocket::setCongestionFlavor(const std::string& cname) {
#ifndef TCP_CONGESTION
#define TCP_CONGESTION 13
#endif

  if (fd_ < 0) {
    VLOG(4) << "AsyncSocket::setCongestionFlavor() called on non-open "
            << "socket " << this << "(state=" << state_ << ")";
    return EINVAL;
  }

  if (setsockopt(
          fd_,
          IPPROTO_TCP,
          TCP_CONGESTION,
          cname.c_str(),
          socklen_t(cname.length() + 1)) != 0) {
    int errnoCopy = errno;
    VLOG(2) << "failed to update TCP_CONGESTION option on AsyncSocket " << this
            << "(fd=" << fd_ << ", state=" << state_
            << "): " << errnoStr(errnoCopy);
    return errnoCopy;
  }

  return 0;
}

int AsyncSocket::setQuickAck(bool quickack) {
  (void)quickack;
  if (fd_ < 0) {
    VLOG(4) << "AsyncSocket::setQuickAck() called on non-open socket " << this
            << "(state=" << state_ << ")";
    return EINVAL;
  }

#ifdef TCP_QUICKACK // Linux-only
  int value = quickack ? 1 : 0;
  if (setsockopt(fd_, IPPROTO_TCP, TCP_QUICKACK, &value, sizeof(value)) != 0) {
    int errnoCopy = errno;
    VLOG(2) << "failed to update TCP_QUICKACK option on AsyncSocket" << this
            << "(fd=" << fd_ << ", state=" << state_
            << "): " << errnoStr(errnoCopy);
    return errnoCopy;
  }

  return 0;
#else
  return ENOSYS;
#endif
}

int AsyncSocket::setSendBufSize(size_t bufsize) {
  if (fd_ < 0) {
    VLOG(4) << "AsyncSocket::setSendBufSize() called on non-open socket "
            << this << "(state=" << state_ << ")";
    return EINVAL;
  }

  if (setsockopt(fd_, SOL_SOCKET, SO_SNDBUF, &bufsize, sizeof(bufsize)) != 0) {
    int errnoCopy = errno;
    VLOG(2) << "failed to update SO_SNDBUF option on AsyncSocket" << this
            << "(fd=" << fd_ << ", state=" << state_
            << "): " << errnoStr(errnoCopy);
    return errnoCopy;
  }

  return 0;
}

int AsyncSocket::setRecvBufSize(size_t bufsize) {
  if (fd_ < 0) {
    VLOG(4) << "AsyncSocket::setRecvBufSize() called on non-open socket "
            << this << "(state=" << state_ << ")";
    return EINVAL;
  }

  if (setsockopt(fd_, SOL_SOCKET, SO_RCVBUF, &bufsize, sizeof(bufsize)) != 0) {
    int errnoCopy = errno;
    VLOG(2) << "failed to update SO_RCVBUF option on AsyncSocket" << this
            << "(fd=" << fd_ << ", state=" << state_
            << "): " << errnoStr(errnoCopy);
    return errnoCopy;
  }

  return 0;
}

int AsyncSocket::setTCPProfile(int profd) {
  if (fd_ < 0) {
    VLOG(4) << "AsyncSocket::setTCPProfile() called on non-open socket " << this
            << "(state=" << state_ << ")";
    return EINVAL;
  }

  if (setsockopt(fd_, SOL_SOCKET, SO_SET_NAMESPACE, &profd, sizeof(int)) != 0) {
    int errnoCopy = errno;
    VLOG(2) << "failed to set socket namespace option on AsyncSocket" << this
            << "(fd=" << fd_ << ", state=" << state_
            << "): " << errnoStr(errnoCopy);
    return errnoCopy;
  }

  return 0;
}

void AsyncSocket::ioReady(uint16_t events) noexcept {
  VLOG(7) << "AsyncSocket::ioRead() this=" << this << ", fd=" << fd_
          << ", events=" << std::hex << events << ", state=" << state_;
  DestructorGuard dg(this);
  assert(events & EventHandler::READ_WRITE);
  eventBase_->dcheckIsInEventBaseThread();

  uint16_t relevantEvents = uint16_t(events & EventHandler::READ_WRITE);
  EventBase* originalEventBase = eventBase_;
  // If we got there it means that either EventHandler::READ or
  // EventHandler::WRITE is set. Any of these flags can
  // indicate that there are messages available in the socket
  // error message queue.
  // Return if we handle any error messages - this is to avoid
  // unnecessary read/write calls
  if (handleErrMessages()) {
    return;
  }

  // Return now if handleErrMessages() detached us from our EventBase
  if (eventBase_ != originalEventBase) {
    return;
  }

  if (relevantEvents == EventHandler::READ) {
    handleRead();
  } else if (relevantEvents == EventHandler::WRITE) {
    handleWrite();
  } else if (relevantEvents == EventHandler::READ_WRITE) {
    // If both read and write events are ready, process writes first.
    handleWrite();

    // Return now if handleWrite() detached us from our EventBase
    if (eventBase_ != originalEventBase) {
      return;
    }

    // Only call handleRead() if a read callback is still installed.
    // (It's possible that the read callback was uninstalled during
    // handleWrite().)
    if (readCallback_) {
      handleRead();
    }
  } else {
    VLOG(4) << "AsyncSocket::ioRead() called with unexpected events "
            << std::hex << events << "(this=" << this << ")";
    abort();
  }
}

AsyncSocket::ReadResult
AsyncSocket::performRead(void** buf, size_t* buflen, size_t* /* offset */) {
  VLOG(5) << "AsyncSocket::performRead() this=" << this << ", buf=" << *buf
          << ", buflen=" << *buflen;

  if (preReceivedData_ && !preReceivedData_->empty()) {
    VLOG(5) << "AsyncSocket::performRead() this=" << this
            << ", reading pre-received data";

    io::Cursor cursor(preReceivedData_.get());
    auto len = cursor.pullAtMost(*buf, *buflen);

    IOBufQueue queue;
    queue.append(std::move(preReceivedData_));
    queue.trimStart(len);
    preReceivedData_ = queue.move();

    appBytesReceived_ += len;
    return ReadResult(len);
  }

  ssize_t bytes = recv(fd_, *buf, *buflen, MSG_DONTWAIT);
  if (bytes < 0) {
    if (errno == EAGAIN || errno == EWOULDBLOCK) {
      // No more data to read right now.
      return ReadResult(READ_BLOCKING);
    } else {
      return ReadResult(READ_ERROR);
    }
  } else {
    appBytesReceived_ += bytes;
    return ReadResult(bytes);
  }
}

void AsyncSocket::prepareReadBuffer(void** buf, size_t* buflen) {
  // no matter what, buffer should be preapared for non-ssl socket
  CHECK(readCallback_);
  readCallback_->getReadBuffer(buf, buflen);
}

size_t AsyncSocket::handleErrMessages() noexcept {
  // This method has non-empty implementation only for platforms
  // supporting per-socket error queues.
  VLOG(5) << "AsyncSocket::handleErrMessages() this=" << this << ", fd=" << fd_
          << ", state=" << state_;
  if (errMessageCallback_ == nullptr && idZeroCopyBufPtrMap_.empty()) {
    VLOG(7) << "AsyncSocket::handleErrMessages(): "
            << "no callback installed - exiting.";
    return 0;
  }

#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  uint8_t ctrl[1024];
  unsigned char data;
  struct msghdr msg;
  iovec entry;

  entry.iov_base = &data;
  entry.iov_len = sizeof(data);
  msg.msg_iov = &entry;
  msg.msg_iovlen = 1;
  msg.msg_name = nullptr;
  msg.msg_namelen = 0;
  msg.msg_control = ctrl;
  msg.msg_controllen = sizeof(ctrl);
  msg.msg_flags = 0;

  int ret;
  size_t num = 0;
  while (true) {
    ret = recvmsg(fd_, &msg, MSG_ERRQUEUE);
    VLOG(5) << "AsyncSocket::handleErrMessages(): recvmsg returned " << ret;

    if (ret < 0) {
      if (errno != EAGAIN) {
        auto errnoCopy = errno;
        LOG(ERROR) << "::recvmsg exited with code " << ret
                   << ", errno: " << errnoCopy;
        AsyncSocketException ex(
            AsyncSocketException::INTERNAL_ERROR,
            withAddr("recvmsg() failed"),
            errnoCopy);
        failErrMessageRead(__func__, ex);
      }

      return num;
    }

    for (struct cmsghdr* cmsg = CMSG_FIRSTHDR(&msg);
         cmsg != nullptr && cmsg->cmsg_len != 0;
         cmsg = CMSG_NXTHDR(&msg, cmsg)) {
      ++num;
      if (isZeroCopyMsg(*cmsg)) {
        processZeroCopyMsg(*cmsg);
      } else {
        if (errMessageCallback_) {
          errMessageCallback_->errMessage(*cmsg);
        }
      }
    }
  }
#else
  return 0;
#endif // FOLLY_HAVE_MSG_ERRQUEUE
}

bool AsyncSocket::processZeroCopyWriteInProgress() noexcept {
  eventBase_->dcheckIsInEventBaseThread();
  if (idZeroCopyBufPtrMap_.empty()) {
    return true;
  }

  handleErrMessages();

  return idZeroCopyBufPtrMap_.empty();
}

void AsyncSocket::handleRead() noexcept {
  VLOG(5) << "AsyncSocket::handleRead() this=" << this << ", fd=" << fd_
          << ", state=" << state_;
  assert(state_ == StateEnum::ESTABLISHED);
  assert((shutdownFlags_ & SHUT_READ) == 0);
  assert(readCallback_ != nullptr);
  assert(eventFlags_ & EventHandler::READ);

  // Loop until:
  // - a read attempt would block
  // - readCallback_ is uninstalled
  // - the number of loop iterations exceeds the optional maximum
  // - this AsyncSocket is moved to another EventBase
  //
  // When we invoke readDataAvailable() it may uninstall the readCallback_,
  // which is why need to check for it here.
  //
  // The last bullet point is slightly subtle.  readDataAvailable() may also
  // detach this socket from this EventBase.  However, before
  // readDataAvailable() returns another thread may pick it up, attach it to
  // a different EventBase, and install another readCallback_.  We need to
  // exit immediately after readDataAvailable() returns if the eventBase_ has
  // changed.  (The caller must perform some sort of locking to transfer the
  // AsyncSocket between threads properly.  This will be sufficient to ensure
  // that this thread sees the updated eventBase_ variable after
  // readDataAvailable() returns.)
  uint16_t numReads = 0;
  EventBase* originalEventBase = eventBase_;
  while (readCallback_ && eventBase_ == originalEventBase) {
    // Get the buffer to read into.
    void* buf = nullptr;
    size_t buflen = 0, offset = 0;
    try {
      prepareReadBuffer(&buf, &buflen);
      VLOG(5) << "prepareReadBuffer() buf=" << buf << ", buflen=" << buflen;
    } catch (const AsyncSocketException& ex) {
      return failRead(__func__, ex);
    } catch (const std::exception& ex) {
      AsyncSocketException tex(
          AsyncSocketException::BAD_ARGS,
          string("ReadCallback::getReadBuffer() "
                 "threw exception: ") +
              ex.what());
      return failRead(__func__, tex);
    } catch (...) {
      AsyncSocketException ex(
          AsyncSocketException::BAD_ARGS,
          "ReadCallback::getReadBuffer() threw "
          "non-exception type");
      return failRead(__func__, ex);
    }
    if (!isBufferMovable_ && (buf == nullptr || buflen == 0)) {
      AsyncSocketException ex(
          AsyncSocketException::BAD_ARGS,
          "ReadCallback::getReadBuffer() returned "
          "empty buffer");
      return failRead(__func__, ex);
    }

    // Perform the read
    auto readResult = performRead(&buf, &buflen, &offset);
    auto bytesRead = readResult.readReturn;
    VLOG(4) << "this=" << this << ", AsyncSocket::handleRead() got "
            << bytesRead << " bytes";
    if (bytesRead > 0) {
      if (!isBufferMovable_) {
        readCallback_->readDataAvailable(size_t(bytesRead));
      } else {
        CHECK(kOpenSslModeMoveBufferOwnership);
        VLOG(5) << "this=" << this << ", AsyncSocket::handleRead() got "
                << "buf=" << buf << ", " << bytesRead << "/" << buflen
                << ", offset=" << offset;
        auto readBuf = folly::IOBuf::takeOwnership(buf, buflen);
        readBuf->trimStart(offset);
        readBuf->trimEnd(buflen - offset - bytesRead);
        readCallback_->readBufferAvailable(std::move(readBuf));
      }

      // Fall through and continue around the loop if the read
      // completely filled the available buffer.
      // Note that readCallback_ may have been uninstalled or changed inside
      // readDataAvailable().
      if (size_t(bytesRead) < buflen) {
        return;
      }
    } else if (bytesRead == READ_BLOCKING) {
      // No more data to read right now.
      return;
    } else if (bytesRead == READ_ERROR) {
      readErr_ = READ_ERROR;
      if (readResult.exception) {
        return failRead(__func__, *readResult.exception);
      }
      auto errnoCopy = errno;
      AsyncSocketException ex(
          AsyncSocketException::INTERNAL_ERROR,
          withAddr("recv() failed"),
          errnoCopy);
      return failRead(__func__, ex);
    } else {
      assert(bytesRead == READ_EOF);
      readErr_ = READ_EOF;
      // EOF
      shutdownFlags_ |= SHUT_READ;
      if (!updateEventRegistration(0, EventHandler::READ)) {
        // we've already been moved into STATE_ERROR
        assert(state_ == StateEnum::ERROR);
        assert(readCallback_ == nullptr);
        return;
      }

      ReadCallback* callback = readCallback_;
      readCallback_ = nullptr;
      callback->readEOF();
      return;
    }
    if (maxReadsPerEvent_ && (++numReads >= maxReadsPerEvent_)) {
      if (readCallback_ != nullptr) {
        // We might still have data in the socket.
        // (e.g. see comment in AsyncSSLSocket::checkForImmediateRead)
        scheduleImmediateRead();
      }
      return;
    }
  }
}

/**
 * This function attempts to write as much data as possible, until no more data
 * can be written.
 *
 * - If it sends all available data, it unregisters for write events, and stops
 *   the writeTimeout_.
 *
 * - If not all of the data can be sent immediately, it reschedules
 *   writeTimeout_ (if a non-zero timeout is set), and ensures the handler is
 *   registered for write events.
 */
void AsyncSocket::handleWrite() noexcept {
  VLOG(5) << "AsyncSocket::handleWrite() this=" << this << ", fd=" << fd_
          << ", state=" << state_;
  DestructorGuard dg(this);

  if (state_ == StateEnum::CONNECTING) {
    handleConnect();
    return;
  }

  // Normal write
  assert(state_ == StateEnum::ESTABLISHED);
  assert((shutdownFlags_ & SHUT_WRITE) == 0);
  assert(writeReqHead_ != nullptr);

  // Loop until we run out of write requests,
  // or until this socket is moved to another EventBase.
  // (See the comment in handleRead() explaining how this can happen.)
  EventBase* originalEventBase = eventBase_;
  while (writeReqHead_ != nullptr && eventBase_ == originalEventBase) {
    auto writeResult = writeReqHead_->performWrite();
    if (writeResult.writeReturn < 0) {
      if (writeResult.exception) {
        return failWrite(__func__, *writeResult.exception);
      }
      auto errnoCopy = errno;
      AsyncSocketException ex(
          AsyncSocketException::INTERNAL_ERROR,
          withAddr("writev() failed"),
          errnoCopy);
      return failWrite(__func__, ex);
    } else if (writeReqHead_->isComplete()) {
      // We finished this request
      WriteRequest* req = writeReqHead_;
      writeReqHead_ = req->getNext();

      if (writeReqHead_ == nullptr) {
        writeReqTail_ = nullptr;
        // This is the last write request.
        // Unregister for write events and cancel the send timer
        // before we invoke the callback.  We have to update the state properly
        // before calling the callback, since it may want to detach us from
        // the EventBase.
        if (eventFlags_ & EventHandler::WRITE) {
          if (!updateEventRegistration(0, EventHandler::WRITE)) {
            assert(state_ == StateEnum::ERROR);
            return;
          }
          // Stop the send timeout
          writeTimeout_.cancelTimeout();
        }
        assert(!writeTimeout_.isScheduled());

        // If SHUT_WRITE_PENDING is set, we should shutdown the socket after
        // we finish sending the last write request.
        //
        // We have to do this before invoking writeSuccess(), since
        // writeSuccess() may detach us from our EventBase.
        if (shutdownFlags_ & SHUT_WRITE_PENDING) {
          assert(connectCallback_ == nullptr);
          shutdownFlags_ |= SHUT_WRITE;

          if (shutdownFlags_ & SHUT_READ) {
            // Reads have already been shutdown.  Fully close the socket and
            // move to STATE_CLOSED.
            //
            // Note: This code currently moves us to STATE_CLOSED even if
            // close() hasn't ever been called.  This can occur if we have
            // received EOF from the peer and shutdownWrite() has been called
            // locally.  Should we bother staying in STATE_ESTABLISHED in this
            // case, until close() is actually called?  I can't think of a
            // reason why we would need to do so.  No other operations besides
            // calling close() or destroying the socket can be performed at
            // this point.
            assert(readCallback_ == nullptr);
            state_ = StateEnum::CLOSED;
            if (fd_ >= 0) {
              ioHandler_.changeHandlerFD(-1);
              doClose();
            }
          } else {
            // Reads are still enabled, so we are only doing a half-shutdown
            shutdown(fd_, SHUT_WR);
          }
        }
      }

      // Invoke the callback
      WriteCallback* callback = req->getCallback();
      req->destroy();
      if (callback) {
        callback->writeSuccess();
      }
      // We'll continue around the loop, trying to write another request
    } else {
      // Partial write.
      if (bufferCallback_) {
        bufferCallback_->onEgressBuffered();
      }
      writeReqHead_->consume();
      // Stop after a partial write; it's highly likely that a subsequent write
      // attempt will just return EAGAIN.
      //
      // Ensure that we are registered for write events.
      if ((eventFlags_ & EventHandler::WRITE) == 0) {
        if (!updateEventRegistration(EventHandler::WRITE, 0)) {
          assert(state_ == StateEnum::ERROR);
          return;
        }
      }

      // Reschedule the send timeout, since we have made some write progress.
      if (sendTimeout_ > 0) {
        if (!writeTimeout_.scheduleTimeout(sendTimeout_)) {
          AsyncSocketException ex(
              AsyncSocketException::INTERNAL_ERROR,
              withAddr("failed to reschedule write timeout"));
          return failWrite(__func__, ex);
        }
      }
      return;
    }
  }
  if (!writeReqHead_ && bufferCallback_) {
    bufferCallback_->onEgressBufferCleared();
  }
}

void AsyncSocket::checkForImmediateRead() noexcept {
  // We currently don't attempt to perform optimistic reads in AsyncSocket.
  // (However, note that some subclasses do override this method.)
  //
  // Simply calling handleRead() here would be bad, as this would call
  // readCallback_->getReadBuffer(), forcing the callback to allocate a read
  // buffer even though no data may be available.  This would waste lots of
  // memory, since the buffer will sit around unused until the socket actually
  // becomes readable.
  //
  // Checking if the socket is readable now also seems like it would probably
  // be a pessimism.  In most cases it probably wouldn't be readable, and we
  // would just waste an extra system call.  Even if it is readable, waiting to
  // find out from libevent on the next event loop doesn't seem that bad.
  //
  // The exception to this is if we have pre-received data. In that case there
  // is definitely data available immediately.
  if (preReceivedData_ && !preReceivedData_->empty()) {
    handleRead();
  }
}

void AsyncSocket::handleInitialReadWrite() noexcept {
  // Our callers should already be holding a DestructorGuard, but grab
  // one here just to make sure, in case one of our calling code paths ever
  // changes.
  DestructorGuard dg(this);
  // If we have a readCallback_, make sure we enable read events.  We
  // may already be registered for reads if connectSuccess() set
  // the read calback.
  if (readCallback_ && !(eventFlags_ & EventHandler::READ)) {
    assert(state_ == StateEnum::ESTABLISHED);
    assert((shutdownFlags_ & SHUT_READ) == 0);
    if (!updateEventRegistration(EventHandler::READ, 0)) {
      assert(state_ == StateEnum::ERROR);
      return;
    }
    checkForImmediateRead();
  } else if (readCallback_ == nullptr) {
    // Unregister for read events.
    updateEventRegistration(0, EventHandler::READ);
  }

  // If we have write requests pending, try to send them immediately.
  // Since we just finished accepting, there is a very good chance that we can
  // write without blocking.
  //
  // However, we only process them if EventHandler::WRITE is not already set,
  // which means that we're already blocked on a write attempt.  (This can
  // happen if connectSuccess() called write() before returning.)
  if (writeReqHead_ && !(eventFlags_ & EventHandler::WRITE)) {
    // Call handleWrite() to perform write processing.
    handleWrite();
  } else if (writeReqHead_ == nullptr) {
    // Unregister for write event.
    updateEventRegistration(0, EventHandler::WRITE);
  }
}

void AsyncSocket::handleConnect() noexcept {
  VLOG(5) << "AsyncSocket::handleConnect() this=" << this << ", fd=" << fd_
          << ", state=" << state_;
  assert(state_ == StateEnum::CONNECTING);
  // SHUT_WRITE can never be set while we are still connecting;
  // SHUT_WRITE_PENDING may be set, be we only set SHUT_WRITE once the connect
  // finishes
  assert((shutdownFlags_ & SHUT_WRITE) == 0);

  // In case we had a connect timeout, cancel the timeout
  writeTimeout_.cancelTimeout();
  // We don't use a persistent registration when waiting on a connect event,
  // so we have been automatically unregistered now.  Update eventFlags_ to
  // reflect reality.
  assert(eventFlags_ == EventHandler::WRITE);
  eventFlags_ = EventHandler::NONE;

  // Call getsockopt() to check if the connect succeeded
  int error;
  socklen_t len = sizeof(error);
  int rv = getsockopt(fd_, SOL_SOCKET, SO_ERROR, &error, &len);
  if (rv != 0) {
    auto errnoCopy = errno;
    AsyncSocketException ex(
        AsyncSocketException::INTERNAL_ERROR,
        withAddr("error calling getsockopt() after connect"),
        errnoCopy);
    VLOG(4) << "AsyncSocket::handleConnect(this=" << this << ", fd=" << fd_
            << " host=" << addr_.describe() << ") exception:" << ex.what();
    return failConnect(__func__, ex);
  }

  if (error != 0) {
    AsyncSocketException ex(
        AsyncSocketException::NOT_OPEN, "connect failed", error);
    VLOG(2) << "AsyncSocket::handleConnect(this=" << this << ", fd=" << fd_
            << " host=" << addr_.describe() << ") exception: " << ex.what();
    return failConnect(__func__, ex);
  }

  // Move into STATE_ESTABLISHED
  state_ = StateEnum::ESTABLISHED;

  // If SHUT_WRITE_PENDING is set and we don't have any write requests to
  // perform, immediately shutdown the write half of the socket.
  if ((shutdownFlags_ & SHUT_WRITE_PENDING) && writeReqHead_ == nullptr) {
    // SHUT_READ shouldn't be set.  If close() is called on the socket while we
    // are still connecting we just abort the connect rather than waiting for
    // it to complete.
    assert((shutdownFlags_ & SHUT_READ) == 0);
    shutdown(fd_, SHUT_WR);
    shutdownFlags_ |= SHUT_WRITE;
  }

  VLOG(7) << "AsyncSocket " << this << ": fd " << fd_
          << "successfully connected; state=" << state_;

  // Remember the EventBase we are attached to, before we start invoking any
  // callbacks (since the callbacks may call detachEventBase()).
  EventBase* originalEventBase = eventBase_;

  invokeConnectSuccess();
  // Note that the connect callback may have changed our state.
  // (set or unset the read callback, called write(), closed the socket, etc.)
  // The following code needs to handle these situations correctly.
  //
  // If the socket has been closed, readCallback_ and writeReqHead_ will
  // always be nullptr, so that will prevent us from trying to read or write.
  //
  // The main thing to check for is if eventBase_ is still originalEventBase.
  // If not, we have been detached from this event base, so we shouldn't
  // perform any more operations.
  if (eventBase_ != originalEventBase) {
    return;
  }

  handleInitialReadWrite();
}

void AsyncSocket::timeoutExpired() noexcept {
  VLOG(7) << "AsyncSocket " << this << ", fd " << fd_ << ": timeout expired: "
          << "state=" << state_ << ", events=" << std::hex << eventFlags_;
  DestructorGuard dg(this);
  eventBase_->dcheckIsInEventBaseThread();

  if (state_ == StateEnum::CONNECTING) {
    // connect() timed out
    // Unregister for I/O events.
    if (connectCallback_) {
      AsyncSocketException ex(
          AsyncSocketException::TIMED_OUT,
          folly::sformat(
              "connect timed out after {}ms", connectTimeout_.count()));
      failConnect(__func__, ex);
    } else {
      // we faced a connect error without a connect callback, which could
      // happen due to TFO.
      AsyncSocketException ex(
          AsyncSocketException::TIMED_OUT, "write timed out during connection");
      failWrite(__func__, ex);
    }
  } else {
    // a normal write operation timed out
    AsyncSocketException ex(
        AsyncSocketException::TIMED_OUT,
        folly::sformat("write timed out after {}ms", sendTimeout_));
    failWrite(__func__, ex);
  }
}

ssize_t AsyncSocket::tfoSendMsg(int fd, struct msghdr* msg, int msg_flags) {
  return detail::tfo_sendmsg(fd, msg, msg_flags);
}

AsyncSocket::WriteResult
AsyncSocket::sendSocketMessage(int fd, struct msghdr* msg, int msg_flags) {
  ssize_t totalWritten = 0;
  if (state_ == StateEnum::FAST_OPEN) {
    sockaddr_storage addr;
    auto len = addr_.getAddress(&addr);
    msg->msg_name = &addr;
    msg->msg_namelen = len;
    totalWritten = tfoSendMsg(fd_, msg, msg_flags);
    if (totalWritten >= 0) {
      tfoFinished_ = true;
      state_ = StateEnum::ESTABLISHED;
      // We schedule this asynchrously so that we don't end up
      // invoking initial read or write while a write is in progress.
      scheduleInitialReadWrite();
    } else if (errno == EINPROGRESS) {
      VLOG(4) << "TFO falling back to connecting";
      // A normal sendmsg doesn't return EINPROGRESS, however
      // TFO might fallback to connecting if there is no
      // cookie.
      state_ = StateEnum::CONNECTING;
      try {
        scheduleConnectTimeout();
        registerForConnectEvents();
      } catch (const AsyncSocketException& ex) {
        return WriteResult(
            WRITE_ERROR, std::make_unique<AsyncSocketException>(ex));
      }
      // Let's fake it that no bytes were written and return an errno.
      errno = EAGAIN;
      totalWritten = -1;
    } else if (errno == EOPNOTSUPP) {
      // Try falling back to connecting.
      VLOG(4) << "TFO not supported";
      state_ = StateEnum::CONNECTING;
      try {
        int ret = socketConnect((const sockaddr*)&addr, len);
        if (ret == 0) {
          // connect succeeded immediately
          // Treat this like no data was written.
          state_ = StateEnum::ESTABLISHED;
          scheduleInitialReadWrite();
        }
        // If there was no exception during connections,
        // we would return that no bytes were written.
        errno = EAGAIN;
        totalWritten = -1;
      } catch (const AsyncSocketException& ex) {
        return WriteResult(
            WRITE_ERROR, std::make_unique<AsyncSocketException>(ex));
      }
    } else if (errno == EAGAIN) {
      // Normally sendmsg would indicate that the write would block.
      // However in the fast open case, it would indicate that sendmsg
      // fell back to a connect. This is a return code from connect()
      // instead, and is an error condition indicating no fds available.
      return WriteResult(
          WRITE_ERROR,
          std::make_unique<AsyncSocketException>(
              AsyncSocketException::UNKNOWN, "No more free local ports"));
    }
  } else {
    totalWritten = ::sendmsg(fd, msg, msg_flags);
  }
  return WriteResult(totalWritten);
}

AsyncSocket::WriteResult AsyncSocket::performWrite(
    const iovec* vec,
    uint32_t count,
    WriteFlags flags,
    uint32_t* countWritten,
    uint32_t* partialWritten) {
  // We use sendmsg() instead of writev() so that we can pass in MSG_NOSIGNAL
  // We correctly handle EPIPE errors, so we never want to receive SIGPIPE
  // (since it may terminate the program if the main program doesn't explicitly
  // ignore it).
  struct msghdr msg;
  msg.msg_name = nullptr;
  msg.msg_namelen = 0;
  msg.msg_iov = const_cast<iovec*>(vec);
  msg.msg_iovlen = std::min<size_t>(count, kIovMax);
  msg.msg_flags = 0;
  msg.msg_controllen = sendMsgParamCallback_->getAncillaryDataSize(flags);
  CHECK_GE(
      AsyncSocket::SendMsgParamsCallback::maxAncillaryDataSize,
      msg.msg_controllen);

  if (msg.msg_controllen != 0) {
    msg.msg_control = reinterpret_cast<char*>(alloca(msg.msg_controllen));
    sendMsgParamCallback_->getAncillaryData(flags, msg.msg_control);
  } else {
    msg.msg_control = nullptr;
  }
  int msg_flags = sendMsgParamCallback_->getFlags(flags, zeroCopyEnabled_);

  auto writeResult = sendSocketMessage(fd_, &msg, msg_flags);
  auto totalWritten = writeResult.writeReturn;
  if (totalWritten < 0 && zeroCopyEnabled_ && errno == ENOBUFS) {
    // workaround for running with zerocopy enabled but without a big enough
    // memlock value - see ulimit -l
    zeroCopyEnabled_ = false;
    zeroCopyReenableCounter_ = zeroCopyReenableThreshold_;
    msg_flags = sendMsgParamCallback_->getFlags(flags, zeroCopyEnabled_);
    writeResult = sendSocketMessage(fd_, &msg, msg_flags);
    totalWritten = writeResult.writeReturn;
  }
  if (totalWritten < 0) {
    bool tryAgain = (errno == EAGAIN);
#ifdef __APPLE__
    // Apple has a bug where doing a second write on a socket which we
    // have opened with TFO causes an ENOTCONN to be thrown. However the
    // socket is really connected, so treat ENOTCONN as a EAGAIN until
    // this bug is fixed.
    tryAgain |= (errno == ENOTCONN);
#endif

    if (!writeResult.exception && tryAgain) {
      // TCP buffer is full; we can't write any more data right now.
      *countWritten = 0;
      *partialWritten = 0;
      return WriteResult(0);
    }
    // error
    *countWritten = 0;
    *partialWritten = 0;
    return writeResult;
  }

  appBytesWritten_ += totalWritten;

  uint32_t bytesWritten;
  uint32_t n;
  for (bytesWritten = uint32_t(totalWritten), n = 0; n < count; ++n) {
    const iovec* v = vec + n;
    if (v->iov_len > bytesWritten) {
      // Partial write finished in the middle of this iovec
      *countWritten = n;
      *partialWritten = bytesWritten;
      return WriteResult(totalWritten);
    }

    bytesWritten -= uint32_t(v->iov_len);
  }

  assert(bytesWritten == 0);
  *countWritten = n;
  *partialWritten = 0;
  return WriteResult(totalWritten);
}

/**
 * Re-register the EventHandler after eventFlags_ has changed.
 *
 * If an error occurs, fail() is called to move the socket into the error state
 * and call all currently installed callbacks.  After an error, the
 * AsyncSocket is completely unregistered.
 *
 * @return Returns true on success, or false on error.
 */
bool AsyncSocket::updateEventRegistration() {
  VLOG(5) << "AsyncSocket::updateEventRegistration(this=" << this
          << ", fd=" << fd_ << ", evb=" << eventBase_ << ", state=" << state_
          << ", events=" << std::hex << eventFlags_;
  eventBase_->dcheckIsInEventBaseThread();
  if (eventFlags_ == EventHandler::NONE) {
    ioHandler_.unregisterHandler();
    return true;
  }

  // Always register for persistent events, so we don't have to re-register
  // after being called back.
  if (!ioHandler_.registerHandler(
          uint16_t(eventFlags_ | EventHandler::PERSIST))) {
    eventFlags_ = EventHandler::NONE; // we're not registered after error
    AsyncSocketException ex(
        AsyncSocketException::INTERNAL_ERROR,
        withAddr("failed to update AsyncSocket event registration"));
    fail("updateEventRegistration", ex);
    return false;
  }

  return true;
}

bool AsyncSocket::updateEventRegistration(uint16_t enable, uint16_t disable) {
  uint16_t oldFlags = eventFlags_;
  eventFlags_ |= enable;
  eventFlags_ &= ~disable;
  if (eventFlags_ == oldFlags) {
    return true;
  } else {
    return updateEventRegistration();
  }
}

void AsyncSocket::startFail() {
  // startFail() should only be called once
  assert(state_ != StateEnum::ERROR);
  assert(getDestructorGuardCount() > 0);
  state_ = StateEnum::ERROR;
  // Ensure that SHUT_READ and SHUT_WRITE are set,
  // so all future attempts to read or write will be rejected
  shutdownFlags_ |= (SHUT_READ | SHUT_WRITE);

  // Cancel any scheduled immediate read.
  if (immediateReadHandler_.isLoopCallbackScheduled()) {
    immediateReadHandler_.cancelLoopCallback();
  }

  if (eventFlags_ != EventHandler::NONE) {
    eventFlags_ = EventHandler::NONE;
    ioHandler_.unregisterHandler();
  }
  writeTimeout_.cancelTimeout();

  if (fd_ >= 0) {
    ioHandler_.changeHandlerFD(-1);
    doClose();
  }
}

void AsyncSocket::invokeAllErrors(const AsyncSocketException& ex) {
  invokeConnectErr(ex);
  failAllWrites(ex);

  if (readCallback_) {
    ReadCallback* callback = readCallback_;
    readCallback_ = nullptr;
    callback->readErr(ex);
  }
}

void AsyncSocket::finishFail() {
  assert(state_ == StateEnum::ERROR);
  assert(getDestructorGuardCount() > 0);

  AsyncSocketException ex(
      AsyncSocketException::INTERNAL_ERROR,
      withAddr("socket closing after error"));
  invokeAllErrors(ex);
}

void AsyncSocket::finishFail(const AsyncSocketException& ex) {
  assert(state_ == StateEnum::ERROR);
  assert(getDestructorGuardCount() > 0);
  invokeAllErrors(ex);
}

void AsyncSocket::fail(const char* fn, const AsyncSocketException& ex) {
  VLOG(4) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << ", state=" << state_ << " host=" << addr_.describe()
          << "): failed in " << fn << "(): " << ex.what();
  startFail();
  finishFail();
}

void AsyncSocket::failConnect(const char* fn, const AsyncSocketException& ex) {
  VLOG(5) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << ", state=" << state_ << " host=" << addr_.describe()
          << "): failed while connecting in " << fn << "(): " << ex.what();
  startFail();

  invokeConnectErr(ex);
  finishFail(ex);
}

void AsyncSocket::failRead(const char* fn, const AsyncSocketException& ex) {
  VLOG(5) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << ", state=" << state_ << " host=" << addr_.describe()
          << "): failed while reading in " << fn << "(): " << ex.what();
  startFail();

  if (readCallback_ != nullptr) {
    ReadCallback* callback = readCallback_;
    readCallback_ = nullptr;
    callback->readErr(ex);
  }

  finishFail();
}

void AsyncSocket::failErrMessageRead(
    const char* fn,
    const AsyncSocketException& ex) {
  VLOG(5) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << ", state=" << state_ << " host=" << addr_.describe()
          << "): failed while reading message in " << fn << "(): " << ex.what();
  startFail();

  if (errMessageCallback_ != nullptr) {
    ErrMessageCallback* callback = errMessageCallback_;
    errMessageCallback_ = nullptr;
    callback->errMessageError(ex);
  }

  finishFail();
}

void AsyncSocket::failWrite(const char* fn, const AsyncSocketException& ex) {
  VLOG(5) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << ", state=" << state_ << " host=" << addr_.describe()
          << "): failed while writing in " << fn << "(): " << ex.what();
  startFail();

  // Only invoke the first write callback, since the error occurred while
  // writing this request.  Let any other pending write callbacks be invoked in
  // finishFail().
  if (writeReqHead_ != nullptr) {
    WriteRequest* req = writeReqHead_;
    writeReqHead_ = req->getNext();
    WriteCallback* callback = req->getCallback();
    uint32_t bytesWritten = req->getTotalBytesWritten();
    req->destroy();
    if (callback) {
      callback->writeErr(bytesWritten, ex);
    }
  }

  finishFail();
}

void AsyncSocket::failWrite(
    const char* fn,
    WriteCallback* callback,
    size_t bytesWritten,
    const AsyncSocketException& ex) {
  // This version of failWrite() is used when the failure occurs before
  // we've added the callback to writeReqHead_.
  VLOG(4) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << ", state=" << state_ << " host=" << addr_.describe()
          << "): failed while writing in " << fn << "(): " << ex.what();
  startFail();

  if (callback != nullptr) {
    callback->writeErr(bytesWritten, ex);
  }

  finishFail();
}

void AsyncSocket::failAllWrites(const AsyncSocketException& ex) {
  // Invoke writeError() on all write callbacks.
  // This is used when writes are forcibly shutdown with write requests
  // pending, or when an error occurs with writes pending.
  while (writeReqHead_ != nullptr) {
    WriteRequest* req = writeReqHead_;
    writeReqHead_ = req->getNext();
    WriteCallback* callback = req->getCallback();
    if (callback) {
      callback->writeErr(req->getTotalBytesWritten(), ex);
    }
    req->destroy();
  }
}

void AsyncSocket::invalidState(ConnectCallback* callback) {
  VLOG(5) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << "): connect() called in invalid state " << state_;

  /*
   * The invalidState() methods don't use the normal failure mechanisms,
   * since we don't know what state we are in.  We don't want to call
   * startFail()/finishFail() recursively if we are already in the middle of
   * cleaning up.
   */

  AsyncSocketException ex(
      AsyncSocketException::ALREADY_OPEN,
      "connect() called with socket in invalid state");
  connectEndTime_ = std::chrono::steady_clock::now();
  if (state_ == StateEnum::CLOSED || state_ == StateEnum::ERROR) {
    if (callback) {
      callback->connectErr(ex);
    }
  } else {
    // We can't use failConnect() here since connectCallback_
    // may already be set to another callback.  Invoke this ConnectCallback
    // here; any other connectCallback_ will be invoked in finishFail()
    startFail();
    if (callback) {
      callback->connectErr(ex);
    }
    finishFail();
  }
}

void AsyncSocket::invalidState(ErrMessageCallback* callback) {
  VLOG(4) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << "): setErrMessageCB(" << callback << ") called in invalid state "
          << state_;

  AsyncSocketException ex(
      AsyncSocketException::NOT_OPEN,
      msgErrQueueSupported
          ? "setErrMessageCB() called with socket in invalid state"
          : "This platform does not support socket error message notifications");
  if (state_ == StateEnum::CLOSED || state_ == StateEnum::ERROR) {
    if (callback) {
      callback->errMessageError(ex);
    }
  } else {
    startFail();
    if (callback) {
      callback->errMessageError(ex);
    }
    finishFail();
  }
}

void AsyncSocket::invokeConnectErr(const AsyncSocketException& ex) {
  connectEndTime_ = std::chrono::steady_clock::now();
  if (connectCallback_) {
    ConnectCallback* callback = connectCallback_;
    connectCallback_ = nullptr;
    callback->connectErr(ex);
  }
}

void AsyncSocket::invokeConnectSuccess() {
  connectEndTime_ = std::chrono::steady_clock::now();
  if (connectCallback_) {
    ConnectCallback* callback = connectCallback_;
    connectCallback_ = nullptr;
    callback->connectSuccess();
  }
}

void AsyncSocket::invalidState(ReadCallback* callback) {
  VLOG(4) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << "): setReadCallback(" << callback << ") called in invalid state "
          << state_;

  AsyncSocketException ex(
      AsyncSocketException::NOT_OPEN,
      "setReadCallback() called with socket in "
      "invalid state");
  if (state_ == StateEnum::CLOSED || state_ == StateEnum::ERROR) {
    if (callback) {
      callback->readErr(ex);
    }
  } else {
    startFail();
    if (callback) {
      callback->readErr(ex);
    }
    finishFail();
  }
}

void AsyncSocket::invalidState(WriteCallback* callback) {
  VLOG(4) << "AsyncSocket(this=" << this << ", fd=" << fd_
          << "): write() called in invalid state " << state_;

  AsyncSocketException ex(
      AsyncSocketException::NOT_OPEN,
      withAddr("write() called with socket in invalid state"));
  if (state_ == StateEnum::CLOSED || state_ == StateEnum::ERROR) {
    if (callback) {
      callback->writeErr(0, ex);
    }
  } else {
    startFail();
    if (callback) {
      callback->writeErr(0, ex);
    }
    finishFail();
  }
}

void AsyncSocket::doClose() {
  if (fd_ == -1) {
    return;
  }
  if (const auto shutdownSocketSet = wShutdownSocketSet_.lock()) {
    shutdownSocketSet->close(fd_);
  } else {
    ::close(fd_);
  }
  fd_ = -1;

  // we also want to clear the zerocopy maps
  // if the fd has been closed
  idZeroCopyBufPtrMap_.clear();
  idZeroCopyBufInfoMap_.clear();
}

std::ostream& operator<<(
    std::ostream& os,
    const AsyncSocket::StateEnum& state) {
  os << static_cast<int>(state);
  return os;
}

std::string AsyncSocket::withAddr(const std::string& s) {
  // Don't use addr_ directly because it may not be initialized
  // e.g. if constructed from fd
  folly::SocketAddress peer, local;
  try {
    getPeerAddress(&peer);
    getLocalAddress(&local);
  } catch (const std::exception&) {
    // ignore
  } catch (...) {
    // ignore
  }
  return s + " (peer=" + peer.describe() + ", local=" + local.describe() + ")";
}

void AsyncSocket::setBufferCallback(BufferCallback* cb) {
  bufferCallback_ = cb;
}

} // namespace folly

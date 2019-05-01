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

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS
#endif

#include <folly/io/async/AsyncServerSocket.h>

#include <folly/FileUtil.h>
#include <folly/Portability.h>
#include <folly/SocketAddress.h>
#include <folly/String.h>
#include <folly/detail/SocketFastOpen.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/NotificationQueue.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Unistd.h>

#include <errno.h>
#include <string.h>
#include <sys/types.h>

namespace fsp = folly::portability::sockets;

namespace folly {

#ifndef TCP_SAVE_SYN
#define TCP_SAVE_SYN 27
#endif

#ifndef TCP_SAVED_SYN
#define TCP_SAVED_SYN 28
#endif

static constexpr bool msgErrQueueSupported =
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
    true;
#else
    false;
#endif // FOLLY_HAVE_MSG_ERRQUEUE

const uint32_t AsyncServerSocket::kDefaultMaxAcceptAtOnce;
const uint32_t AsyncServerSocket::kDefaultCallbackAcceptAtOnce;
const uint32_t AsyncServerSocket::kDefaultMaxMessagesInQueue;

int setCloseOnExec(int fd, int value) {
  // Read the current flags
  int old_flags = fcntl(fd, F_GETFD, 0);

  // If reading the flags failed, return error indication now
  if (old_flags < 0) {
    return -1;
  }

  // Set just the flag we want to set
  int new_flags;
  if (value != 0) {
    new_flags = old_flags | FD_CLOEXEC;
  } else {
    new_flags = old_flags & ~FD_CLOEXEC;
  }

  // Store modified flag word in the descriptor
  return fcntl(fd, F_SETFD, new_flags);
}

void AsyncServerSocket::RemoteAcceptor::start(
    EventBase* eventBase,
    uint32_t maxAtOnce,
    uint32_t maxInQueue) {
  setMaxReadAtOnce(maxAtOnce);
  queue_.setMaxQueueSize(maxInQueue);

  if (!eventBase->runInEventBaseThread([=]() {
        callback_->acceptStarted();
        this->startConsuming(eventBase, &queue_);
      })) {
    throw std::invalid_argument(
        "unable to start waiting on accept "
        "notification queue in the specified "
        "EventBase thread");
  }
}

void AsyncServerSocket::RemoteAcceptor::stop(
    EventBase* eventBase,
    AcceptCallback* callback) {
  if (!eventBase->runInEventBaseThread([=]() {
        callback->acceptStopped();
        delete this;
      })) {
    throw std::invalid_argument(
        "unable to start waiting on accept "
        "notification queue in the specified "
        "EventBase thread");
  }
}

void AsyncServerSocket::RemoteAcceptor::messageAvailable(
    QueueMessage&& msg) noexcept {
  switch (msg.type) {
    case MessageType::MSG_NEW_CONN: {
      if (connectionEventCallback_) {
        connectionEventCallback_->onConnectionDequeuedByAcceptorCallback(
            msg.fd, msg.address);
      }
      callback_->connectionAccepted(msg.fd, msg.address);
      break;
    }
    case MessageType::MSG_ERROR: {
      std::runtime_error ex(msg.msg);
      callback_->acceptError(ex);
      break;
    }
    default: {
      LOG(ERROR) << "invalid accept notification message type "
                 << int(msg.type);
      std::runtime_error ex(
          "received invalid accept notification message type");
      callback_->acceptError(ex);
    }
  }
}

/*
 * AsyncServerSocket::BackoffTimeout
 */
class AsyncServerSocket::BackoffTimeout : public AsyncTimeout {
 public:
  // Disallow copy, move, and default constructors.
  BackoffTimeout(BackoffTimeout&&) = delete;
  explicit BackoffTimeout(AsyncServerSocket* socket)
      : AsyncTimeout(socket->getEventBase()), socket_(socket) {}

  void timeoutExpired() noexcept override {
    socket_->backoffTimeoutExpired();
  }

 private:
  AsyncServerSocket* socket_;
};

/*
 * AsyncServerSocket methods
 */

AsyncServerSocket::AsyncServerSocket(EventBase* eventBase)
    : eventBase_(eventBase),
      accepting_(false),
      maxAcceptAtOnce_(kDefaultMaxAcceptAtOnce),
      maxNumMsgsInQueue_(kDefaultMaxMessagesInQueue),
      acceptRateAdjustSpeed_(0),
      acceptRate_(1),
      lastAccepTimestamp_(std::chrono::steady_clock::now()),
      numDroppedConnections_(0),
      callbackIndex_(0),
      backoffTimeout_(nullptr),
      callbacks_(),
      keepAliveEnabled_(true),
      closeOnExec_(true) {
  disableTransparentTls();
}

void AsyncServerSocket::setShutdownSocketSet(
    const std::weak_ptr<ShutdownSocketSet>& wNewSS) {
  const auto newSS = wNewSS.lock();
  const auto shutdownSocketSet = wShutdownSocketSet_.lock();

  if (shutdownSocketSet == newSS) {
    return;
  }

  if (shutdownSocketSet) {
    for (auto& h : sockets_) {
      shutdownSocketSet->remove(h.socket_);
    }
  }

  if (newSS) {
    for (auto& h : sockets_) {
      newSS->add(h.socket_);
    }
  }

  wShutdownSocketSet_ = wNewSS;
}

AsyncServerSocket::~AsyncServerSocket() {
  assert(callbacks_.empty());
}

int AsyncServerSocket::stopAccepting(int shutdownFlags) {
  int result = 0;
  for (auto& handler : sockets_) {
    VLOG(10) << "AsyncServerSocket::stopAccepting " << this << handler.socket_;
  }
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  // When destroy is called, unregister and close the socket immediately.
  accepting_ = false;

  // Close the sockets in reverse order as they were opened to avoid
  // the condition where another process concurrently tries to open
  // the same port, succeed to bind the first socket but fails on the
  // second because it hasn't been closed yet.
  for (; !sockets_.empty(); sockets_.pop_back()) {
    auto& handler = sockets_.back();
    handler.unregisterHandler();
    if (const auto shutdownSocketSet = wShutdownSocketSet_.lock()) {
      shutdownSocketSet->close(handler.socket_);
    } else if (shutdownFlags >= 0) {
      result = shutdownNoInt(handler.socket_, shutdownFlags);
      pendingCloseSockets_.push_back(handler.socket_);
    } else {
      closeNoInt(handler.socket_);
    }
  }

  // Destroy the backoff timout.  This will cancel it if it is running.
  delete backoffTimeout_;
  backoffTimeout_ = nullptr;

  // Close all of the callback queues to notify them that they are being
  // destroyed.  No one should access the AsyncServerSocket any more once
  // destroy() is called.  However, clear out callbacks_ before invoking the
  // accept callbacks just in case.  This will potentially help us detect the
  // bug if one of the callbacks calls addAcceptCallback() or
  // removeAcceptCallback().
  std::vector<CallbackInfo> callbacksCopy;
  callbacks_.swap(callbacksCopy);
  for (std::vector<CallbackInfo>::iterator it = callbacksCopy.begin();
       it != callbacksCopy.end();
       ++it) {
    // consumer may not be set if we are running in primary event base
    if (it->consumer) {
      DCHECK(it->eventBase);
      it->consumer->stop(it->eventBase, it->callback);
    } else {
      DCHECK(it->callback);
      it->callback->acceptStopped();
    }
  }

  return result;
}

void AsyncServerSocket::destroy() {
  stopAccepting();
  for (auto s : pendingCloseSockets_) {
    closeNoInt(s);
  }
  // Then call DelayedDestruction::destroy() to take care of
  // whether or not we need immediate or delayed destruction
  DelayedDestruction::destroy();
}

void AsyncServerSocket::attachEventBase(EventBase* eventBase) {
  assert(eventBase_ == nullptr);
  eventBase->dcheckIsInEventBaseThread();

  eventBase_ = eventBase;
  for (auto& handler : sockets_) {
    handler.attachEventBase(eventBase);
  }
}

void AsyncServerSocket::detachEventBase() {
  assert(eventBase_ != nullptr);
  eventBase_->dcheckIsInEventBaseThread();
  assert(!accepting_);

  eventBase_ = nullptr;
  for (auto& handler : sockets_) {
    handler.detachEventBase();
  }
}

void AsyncServerSocket::useExistingSockets(const std::vector<int>& fds) {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  if (sockets_.size() > 0) {
    throw std::invalid_argument(
        "cannot call useExistingSocket() on a "
        "AsyncServerSocket that already has a socket");
  }

  for (auto fd : fds) {
    // Set addressFamily_ from this socket.
    // Note that the socket may not have been bound yet, but
    // setFromLocalAddress() will still work and get the correct address family.
    // We will update addressFamily_ again anyway if bind() is called later.
    SocketAddress address;
    address.setFromLocalAddress(fd);

#if __linux__
    if (noTransparentTls_) {
      // Ignore return value, errors are ok
      setsockopt(fd, SOL_SOCKET, SO_NO_TRANSPARENT_TLS, nullptr, 0);
    }
#endif

    setupSocket(fd, address.getFamily());
    sockets_.emplace_back(eventBase_, fd, this, address.getFamily());
    sockets_.back().changeHandlerFD(fd);
  }
}

void AsyncServerSocket::useExistingSocket(int fd) {
  useExistingSockets({fd});
}

void AsyncServerSocket::bindSocket(
    int fd,
    const SocketAddress& address,
    bool isExistingSocket) {
  sockaddr_storage addrStorage;
  address.getAddress(&addrStorage);
  sockaddr* saddr = reinterpret_cast<sockaddr*>(&addrStorage);

  if (fsp::bind(fd, saddr, address.getActualSize()) != 0) {
    if (!isExistingSocket) {
      closeNoInt(fd);
    }
    folly::throwSystemError(
        errno, "failed to bind to async server socket: " + address.describe());
  }

#if __linux__
  if (noTransparentTls_) {
    // Ignore return value, errors are ok
    setsockopt(fd, SOL_SOCKET, SO_NO_TRANSPARENT_TLS, nullptr, 0);
  }
#endif

  // If we just created this socket, update the EventHandler and set socket_
  if (!isExistingSocket) {
    sockets_.emplace_back(eventBase_, fd, this, address.getFamily());
  }
}

bool AsyncServerSocket::setZeroCopy(bool enable) {
  if (msgErrQueueSupported) {
    int fd = getSocket();
    int val = enable ? 1 : 0;
    int ret = setsockopt(fd, SOL_SOCKET, SO_ZEROCOPY, &val, sizeof(val));

    return (0 == ret);
  }

  return false;
}

void AsyncServerSocket::bind(const SocketAddress& address) {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  // useExistingSocket() may have been called to initialize socket_ already.
  // However, in the normal case we need to create a new socket now.
  // Don't set socket_ yet, so that socket_ will remain uninitialized if an
  // error occurs.
  int fd;
  if (sockets_.size() == 0) {
    fd = createSocket(address.getFamily());
  } else if (sockets_.size() == 1) {
    if (address.getFamily() != sockets_[0].addressFamily_) {
      throw std::invalid_argument(
          "Attempted to bind address to socket with "
          "different address family");
    }
    fd = sockets_[0].socket_;
  } else {
    throw std::invalid_argument("Attempted to bind to multiple fds");
  }

  bindSocket(fd, address, !sockets_.empty());
}

void AsyncServerSocket::bind(
    const std::vector<IPAddress>& ipAddresses,
    uint16_t port) {
  if (ipAddresses.empty()) {
    throw std::invalid_argument("No ip addresses were provided");
  }
  if (!sockets_.empty()) {
    throw std::invalid_argument(
        "Cannot call bind on a AsyncServerSocket "
        "that already has a socket.");
  }

  for (const IPAddress& ipAddress : ipAddresses) {
    SocketAddress address(ipAddress.toFullyQualified(), port);
    int fd = createSocket(address.getFamily());

    bindSocket(fd, address, false);
  }
  if (sockets_.size() == 0) {
    throw std::runtime_error(
        "did not bind any async server socket for port and addresses");
  }
}

void AsyncServerSocket::bind(uint16_t port) {
  struct addrinfo hints, *res0;
  char sport[sizeof("65536")];

  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = AI_PASSIVE | AI_NUMERICSERV;
  snprintf(sport, sizeof(sport), "%u", port);

  // On Windows the value we need to pass to bind to all available
  // addresses is an empty string. Everywhere else, it's nullptr.
  constexpr const char* kWildcardNode = kIsWindows ? "" : nullptr;
  if (getaddrinfo(kWildcardNode, sport, &hints, &res0)) {
    throw std::invalid_argument(
        "Attempted to bind address to socket with "
        "bad getaddrinfo");
  }

  SCOPE_EXIT {
    freeaddrinfo(res0);
  };

  auto setupAddress = [&](struct addrinfo* res) {
    int s = fsp::socket(res->ai_family, res->ai_socktype, res->ai_protocol);
    // IPv6/IPv4 may not be supported by the kernel
    if (s < 0 && errno == EAFNOSUPPORT) {
      return;
    }
    CHECK_GE(s, 0);

    try {
      setupSocket(s, res->ai_family);
    } catch (...) {
      closeNoInt(s);
      throw;
    }

    if (res->ai_family == AF_INET6) {
      int v6only = 1;
      CHECK(
          0 ==
          setsockopt(s, IPPROTO_IPV6, IPV6_V6ONLY, &v6only, sizeof(v6only)));
    }

    // Bind to the socket
    if (fsp::bind(s, res->ai_addr, socklen_t(res->ai_addrlen)) != 0) {
      folly::throwSystemError(
          errno,
          "failed to bind to async server socket for port ",
          SocketAddress::getPortFrom(res->ai_addr),
          " family ",
          SocketAddress::getFamilyNameFrom(res->ai_addr, "<unknown>"));
    }

#if __linux__
    if (noTransparentTls_) {
      // Ignore return value, errors are ok
      setsockopt(s, SOL_SOCKET, SO_NO_TRANSPARENT_TLS, nullptr, 0);
    }
#endif

    SocketAddress address;
    address.setFromLocalAddress(s);

    sockets_.emplace_back(eventBase_, s, this, address.getFamily());
  };

  const int kNumTries = 25;
  for (int tries = 1; true; tries++) {
    // Prefer AF_INET6 addresses. RFC 3484 mandates that getaddrinfo
    // should return IPv6 first and then IPv4 addresses, but glibc's
    // getaddrinfo(nullptr) with AI_PASSIVE returns:
    // - 0.0.0.0 (IPv4-only)
    // - :: (IPv6+IPv4) in this order
    // See: https://sourceware.org/bugzilla/show_bug.cgi?id=9981
    for (struct addrinfo* res = res0; res; res = res->ai_next) {
      if (res->ai_family == AF_INET6) {
        setupAddress(res);
      }
    }

    // If port == 0, then we should try to bind to the same port on ipv4 and
    // ipv6.  So if we did bind to ipv6, figure out that port and use it.
    if (sockets_.size() == 1 && port == 0) {
      SocketAddress address;
      address.setFromLocalAddress(sockets_.back().socket_);
      snprintf(sport, sizeof(sport), "%u", address.getPort());
      freeaddrinfo(res0);
      CHECK_EQ(0, getaddrinfo(nullptr, sport, &hints, &res0));
    }

    try {
      for (struct addrinfo* res = res0; res; res = res->ai_next) {
        if (res->ai_family != AF_INET6) {
          setupAddress(res);
        }
      }
    } catch (const std::system_error&) {
      // If we can't bind to the same port on ipv4 as ipv6 when using
      // port=0 then we will retry again before giving up after
      // kNumTries attempts.  We do this by closing the sockets that
      // were opened, then restarting from scratch.
      if (port == 0 && !sockets_.empty() && tries != kNumTries) {
        for (const auto& socket : sockets_) {
          if (socket.socket_ <= 0) {
            continue;
          } else if (
              const auto shutdownSocketSet = wShutdownSocketSet_.lock()) {
            shutdownSocketSet->close(socket.socket_);
          } else {
            closeNoInt(socket.socket_);
          }
        }
        sockets_.clear();
        snprintf(sport, sizeof(sport), "%u", port);
        freeaddrinfo(res0);
        CHECK_EQ(0, getaddrinfo(nullptr, sport, &hints, &res0));
        continue;
      }

      throw;
    }

    break;
  }

  if (sockets_.size() == 0) {
    throw std::runtime_error("did not bind any async server socket for port");
  }
}

void AsyncServerSocket::listen(int backlog) {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  // Start listening
  for (auto& handler : sockets_) {
    if (fsp::listen(handler.socket_, backlog) == -1) {
      folly::throwSystemError(errno, "failed to listen on async server socket");
    }
  }
}

void AsyncServerSocket::getAddress(SocketAddress* addressReturn) const {
  CHECK(sockets_.size() >= 1);
  VLOG_IF(2, sockets_.size() > 1)
      << "Warning: getAddress() called and multiple addresses available ("
      << sockets_.size() << "). Returning only the first one.";

  addressReturn->setFromLocalAddress(sockets_[0].socket_);
}

std::vector<SocketAddress> AsyncServerSocket::getAddresses() const {
  CHECK(sockets_.size() >= 1);
  auto tsaVec = std::vector<SocketAddress>(sockets_.size());
  auto tsaIter = tsaVec.begin();
  for (const auto& socket : sockets_) {
    (tsaIter++)->setFromLocalAddress(socket.socket_);
  };
  return tsaVec;
}

void AsyncServerSocket::addAcceptCallback(
    AcceptCallback* callback,
    EventBase* eventBase,
    uint32_t maxAtOnce) {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  // If this is the first accept callback and we are supposed to be accepting,
  // start accepting once the callback is installed.
  bool runStartAccepting = accepting_ && callbacks_.empty();

  callbacks_.emplace_back(callback, eventBase);

  SCOPE_SUCCESS {
    // If this is the first accept callback and we are supposed to be accepting,
    // start accepting.
    if (runStartAccepting) {
      startAccepting();
    }
  };

  if (!eventBase) {
    // Run in AsyncServerSocket's eventbase; notify that we are
    // starting to accept connections
    callback->acceptStarted();
    return;
  }

  // Start the remote acceptor.
  //
  // It would be nice if we could avoid starting the remote acceptor if
  // eventBase == eventBase_.  However, that would cause issues if
  // detachEventBase() and attachEventBase() were ever used to change the
  // primary EventBase for the server socket.  Therefore we require the caller
  // to specify a nullptr EventBase if they want to ensure that the callback is
  // always invoked in the primary EventBase, and to be able to invoke that
  // callback more efficiently without having to use a notification queue.
  RemoteAcceptor* acceptor = nullptr;
  try {
    acceptor = new RemoteAcceptor(callback, connectionEventCallback_);
    acceptor->start(eventBase, maxAtOnce, maxNumMsgsInQueue_);
  } catch (...) {
    callbacks_.pop_back();
    delete acceptor;
    throw;
  }
  callbacks_.back().consumer = acceptor;
}

void AsyncServerSocket::removeAcceptCallback(
    AcceptCallback* callback,
    EventBase* eventBase) {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  // Find the matching AcceptCallback.
  // We just do a simple linear search; we don't expect removeAcceptCallback()
  // to be called frequently, and we expect there to only be a small number of
  // callbacks anyway.
  std::vector<CallbackInfo>::iterator it = callbacks_.begin();
  uint32_t n = 0;
  while (true) {
    if (it == callbacks_.end()) {
      throw std::runtime_error(
          "AsyncServerSocket::removeAcceptCallback(): "
          "accept callback not found");
    }
    if (it->callback == callback &&
        (it->eventBase == eventBase || eventBase == nullptr)) {
      break;
    }
    ++it;
    ++n;
  }

  // Remove this callback from callbacks_.
  //
  // Do this before invoking the acceptStopped() callback, in case
  // acceptStopped() invokes one of our methods that examines callbacks_.
  //
  // Save a copy of the CallbackInfo first.
  CallbackInfo info(*it);
  callbacks_.erase(it);
  if (n < callbackIndex_) {
    // We removed an element before callbackIndex_.  Move callbackIndex_ back
    // one step, since things after n have been shifted back by 1.
    --callbackIndex_;
  } else {
    // We removed something at or after callbackIndex_.
    // If we removed the last element and callbackIndex_ was pointing at it,
    // we need to reset callbackIndex_ to 0.
    if (callbackIndex_ >= callbacks_.size()) {
      callbackIndex_ = 0;
    }
  }

  if (info.consumer) {
    // consumer could be nullptr is we run callbacks in primary event
    // base
    DCHECK(info.eventBase);
    info.consumer->stop(info.eventBase, info.callback);
  } else {
    // callback invoked in the primary event base, just call directly
    DCHECK(info.callback);
    callback->acceptStopped();
  }

  // If we are supposed to be accepting but the last accept callback
  // was removed, unregister for events until a callback is added.
  if (accepting_ && callbacks_.empty()) {
    for (auto& handler : sockets_) {
      handler.unregisterHandler();
    }
  }
}

void AsyncServerSocket::startAccepting() {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }

  accepting_ = true;
  if (callbacks_.empty()) {
    // We can't actually begin accepting if no callbacks are defined.
    // Wait until a callback is added to start accepting.
    return;
  }

  for (auto& handler : sockets_) {
    if (!handler.registerHandler(EventHandler::READ | EventHandler::PERSIST)) {
      throw std::runtime_error("failed to register for accept events");
    }
  }
}

void AsyncServerSocket::pauseAccepting() {
  if (eventBase_) {
    eventBase_->dcheckIsInEventBaseThread();
  }
  accepting_ = false;
  for (auto& handler : sockets_) {
    handler.unregisterHandler();
  }

  // If we were in the accept backoff state, disable the backoff timeout
  if (backoffTimeout_) {
    backoffTimeout_->cancelTimeout();
  }
}

int AsyncServerSocket::createSocket(int family) {
  int fd = fsp::socket(family, SOCK_STREAM, 0);
  if (fd == -1) {
    folly::throwSystemError(errno, "error creating async server socket");
  }

  try {
    setupSocket(fd, family);
  } catch (...) {
    closeNoInt(fd);
    throw;
  }
  return fd;
}

/**
 * Enable/Disable TOS reflection for the server socket
 * If enabled, the 'accepted' connections will reflect the
 * TOS derived from the client's connect request
 */
void AsyncServerSocket::setTosReflect(bool enable) {
  if (!kIsLinux || enable == false) {
    tosReflect_ = false;
    return;
  }

  for (auto& handler : sockets_) {
    if (handler.socket_ < 0) {
      continue;
    }

    int val = (enable) ? 1 : 0;
    int ret = setsockopt(
        handler.socket_, IPPROTO_TCP, TCP_SAVE_SYN, &val, sizeof(val));

    if (ret == 0) {
      VLOG(10) << "Enabled SYN save for socket " << handler.socket_;
    } else {
      folly::throwSystemError(errno, "failed to enable TOS reflect");
    }
  }
  tosReflect_ = true;
}

void AsyncServerSocket::setupSocket(int fd, int family) {
  // Put the socket in non-blocking mode
  if (fcntl(fd, F_SETFL, O_NONBLOCK) != 0) {
    folly::throwSystemError(errno, "failed to put socket in non-blocking mode");
  }

  // Set reuseaddr to avoid 2MSL delay on server restart
  int one = 1;
  if (setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one)) != 0) {
    // This isn't a fatal error; just log an error message and continue
    LOG(ERROR) << "failed to set SO_REUSEADDR on async server socket " << errno;
  }

  // Set reuseport to support multiple accept threads
  int zero = 0;
  if (reusePortEnabled_ &&
      setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &one, sizeof(int)) != 0) {
    LOG(ERROR) << "failed to set SO_REUSEPORT on async server socket "
               << errnoStr(errno);
#ifdef WIN32
    folly::throwSystemError(errno, "failed to bind to the async server socket");
#else
    SocketAddress address;
    address.setFromLocalAddress(fd);
    folly::throwSystemError(
        errno, "failed to bind to async server socket: " + address.describe());
#endif
  }

  // Set keepalive as desired
  if (setsockopt(
          fd,
          SOL_SOCKET,
          SO_KEEPALIVE,
          (keepAliveEnabled_) ? &one : &zero,
          sizeof(int)) != 0) {
    LOG(ERROR) << "failed to set SO_KEEPALIVE on async server socket: "
               << errnoStr(errno);
  }

  // Setup FD_CLOEXEC flag
  if (closeOnExec_ && (-1 == folly::setCloseOnExec(fd, closeOnExec_))) {
    LOG(ERROR) << "failed to set FD_CLOEXEC on async server socket: "
               << errnoStr(errno);
  }

  // Set TCP nodelay if available, MAC OS X Hack
  // See http://lists.danga.com/pipermail/memcached/2005-March/001240.html
#ifndef TCP_NOPUSH
  if (family != AF_UNIX) {
    if (setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &one, sizeof(one)) != 0) {
      // This isn't a fatal error; just log an error message and continue
      LOG(ERROR) << "failed to set TCP_NODELAY on async server socket: "
                 << errnoStr(errno);
    }
  }
#else
  (void)family; // to avoid unused parameter warning
#endif

#if FOLLY_ALLOW_TFO
  if (tfo_ && detail::tfo_enable(fd, tfoMaxQueueSize_) != 0) {
    // This isn't a fatal error; just log an error message and continue
    LOG(WARNING) << "failed to set TCP_FASTOPEN on async server socket: "
                 << folly::errnoStr(errno);
  }
#endif

  if (const auto shutdownSocketSet = wShutdownSocketSet_.lock()) {
    shutdownSocketSet->add(fd);
  }
}

void AsyncServerSocket::handlerReady(
    uint16_t /* events */,
    int fd,
    sa_family_t addressFamily) noexcept {
  assert(!callbacks_.empty());
  DestructorGuard dg(this);

  // Only accept up to maxAcceptAtOnce_ connections at a time,
  // to avoid starving other I/O handlers using this EventBase.
  for (uint32_t n = 0; n < maxAcceptAtOnce_; ++n) {
    SocketAddress address;

    sockaddr_storage addrStorage;
    socklen_t addrLen = sizeof(addrStorage);
    sockaddr* saddr = reinterpret_cast<sockaddr*>(&addrStorage);

    // In some cases, accept() doesn't seem to update these correctly.
    saddr->sa_family = addressFamily;
    if (addressFamily == AF_UNIX) {
      addrLen = sizeof(struct sockaddr_un);
    }

    // Accept a new client socket
#ifdef SOCK_NONBLOCK
    int clientSocket = accept4(fd, saddr, &addrLen, SOCK_NONBLOCK);
#else
    int clientSocket = accept(fd, saddr, &addrLen);
#endif

    address.setFromSockaddr(saddr, addrLen);

    if (clientSocket >= 0 && connectionEventCallback_) {
      connectionEventCallback_->onConnectionAccepted(clientSocket, address);
    }

    // Connection accepted, get the SYN packet from the client if
    // TOS reflect is enabled
    if (kIsLinux && clientSocket >= 0 && tosReflect_) {
      std::array<uint32_t, 64> buffer;
      socklen_t len = sizeof(buffer);
      int ret =
          getsockopt(clientSocket, IPPROTO_TCP, TCP_SAVED_SYN, &buffer, &len);

      if (ret == 0) {
        uint32_t tosWord = folly::Endian::big(buffer[0]);
        if (addressFamily == AF_INET6) {
          tosWord = (tosWord & 0x0FC00000) >> 20;
          ret = setsockopt(
              clientSocket,
              IPPROTO_IPV6,
              IPV6_TCLASS,
              &tosWord,
              sizeof(tosWord));
        } else if (addressFamily == AF_INET) {
          tosWord = (tosWord & 0x00FC0000) >> 16;
          ret = setsockopt(
              clientSocket, IPPROTO_IP, IP_TOS, &tosWord, sizeof(tosWord));
        }

        if (ret != 0) {
          LOG(ERROR) << "Unable to set TOS for accepted socket "
                     << clientSocket;
        }
      } else {
        LOG(ERROR) << "Unable to get SYN packet for accepted socket "
                   << clientSocket;
      }
    }

    std::chrono::time_point<std::chrono::steady_clock> nowMs =
        std::chrono::steady_clock::now();
    auto timeSinceLastAccept = std::max<int64_t>(
        0,
        nowMs.time_since_epoch().count() -
            lastAccepTimestamp_.time_since_epoch().count());
    lastAccepTimestamp_ = nowMs;
    if (acceptRate_ < 1) {
      acceptRate_ *= 1 + acceptRateAdjustSpeed_ * timeSinceLastAccept;
      if (acceptRate_ >= 1) {
        acceptRate_ = 1;
      } else if (rand() > acceptRate_ * RAND_MAX) {
        ++numDroppedConnections_;
        if (clientSocket >= 0) {
          closeNoInt(clientSocket);
          if (connectionEventCallback_) {
            connectionEventCallback_->onConnectionDropped(
                clientSocket, address);
          }
        }
        continue;
      }
    }

    if (clientSocket < 0) {
      if (errno == EAGAIN) {
        // No more sockets to accept right now.
        // Check for this code first, since it's the most common.
        return;
      } else if (errno == EMFILE || errno == ENFILE) {
        // We're out of file descriptors.  Perhaps we're accepting connections
        // too quickly. Pause accepting briefly to back off and give the server
        // a chance to recover.
        LOG(ERROR) << "accept failed: out of file descriptors; entering accept "
                      "back-off state";
        enterBackoff();

        // Dispatch the error message
        dispatchError("accept() failed", errno);
      } else {
        dispatchError("accept() failed", errno);
      }
      if (connectionEventCallback_) {
        connectionEventCallback_->onConnectionAcceptError(errno);
      }
      return;
    }

#ifndef SOCK_NONBLOCK
    // Explicitly set the new connection to non-blocking mode
    if (fcntl(clientSocket, F_SETFL, O_NONBLOCK) != 0) {
      closeNoInt(clientSocket);
      dispatchError(
          "failed to set accepted socket to non-blocking mode", errno);
      if (connectionEventCallback_) {
        connectionEventCallback_->onConnectionDropped(clientSocket, address);
      }
      return;
    }
#endif

    // Inform the callback about the new connection
    dispatchSocket(clientSocket, std::move(address));

    // If we aren't accepting any more, break out of the loop
    if (!accepting_ || callbacks_.empty()) {
      break;
    }
  }
}

void AsyncServerSocket::dispatchSocket(int socket, SocketAddress&& address) {
  uint32_t startingIndex = callbackIndex_;

  // Short circuit if the callback is in the primary EventBase thread

  CallbackInfo* info = nextCallback();
  if (info->eventBase == nullptr || info->eventBase == this->eventBase_) {
    info->callback->connectionAccepted(socket, address);
    return;
  }

  const SocketAddress addr(address);
  // Create a message to send over the notification queue
  QueueMessage msg;
  msg.type = MessageType::MSG_NEW_CONN;
  msg.address = std::move(address);
  msg.fd = socket;

  // Loop until we find a free queue to write to
  while (true) {
    if (info->consumer->getQueue()->tryPutMessageNoThrow(std::move(msg))) {
      if (connectionEventCallback_) {
        connectionEventCallback_->onConnectionEnqueuedForAcceptorCallback(
            socket, addr);
      }
      // Success! return.
      return;
    }

    // We couldn't add to queue.  Fall through to below

    ++numDroppedConnections_;
    if (acceptRateAdjustSpeed_ > 0) {
      // aggressively decrease accept rate when in trouble
      static const double kAcceptRateDecreaseSpeed = 0.1;
      acceptRate_ *= 1 - kAcceptRateDecreaseSpeed;
    }

    if (callbackIndex_ == startingIndex) {
      // The notification queue was full
      // We can't really do anything at this point other than close the socket.
      //
      // This should only happen if a user's service is behaving extremely
      // badly and none of the EventBase threads are looping fast enough to
      // process the incoming connections.  If the service is overloaded, it
      // should use pauseAccepting() to temporarily back off accepting new
      // connections, before they reach the point where their threads can't
      // even accept new messages.
      LOG_EVERY_N(ERROR, 100) << "failed to dispatch newly accepted socket:"
                              << " all accept callback queues are full";
      closeNoInt(socket);
      if (connectionEventCallback_) {
        connectionEventCallback_->onConnectionDropped(socket, addr);
      }
      return;
    }

    info = nextCallback();
  }
}

void AsyncServerSocket::dispatchError(const char* msgstr, int errnoValue) {
  uint32_t startingIndex = callbackIndex_;
  CallbackInfo* info = nextCallback();

  // Create a message to send over the notification queue
  QueueMessage msg;
  msg.type = MessageType::MSG_ERROR;
  msg.err = errnoValue;
  msg.msg = std::move(msgstr);

  while (true) {
    // Short circuit if the callback is in the primary EventBase thread
    if (info->eventBase == nullptr || info->eventBase == this->eventBase_) {
      std::runtime_error ex(
          std::string(msgstr) + folly::to<std::string>(errnoValue));
      info->callback->acceptError(ex);
      return;
    }

    if (info->consumer->getQueue()->tryPutMessageNoThrow(std::move(msg))) {
      return;
    }
    // Fall through and try another callback

    if (callbackIndex_ == startingIndex) {
      // The notification queues for all of the callbacks were full.
      // We can't really do anything at this point.
      LOG_EVERY_N(ERROR, 100)
          << "failed to dispatch accept error: all accept"
          << " callback queues are full: error msg:  " << msg.msg << ": "
          << errnoValue;
      return;
    }
    info = nextCallback();
  }
}

void AsyncServerSocket::enterBackoff() {
  // If this is the first time we have entered the backoff state,
  // allocate backoffTimeout_.
  if (backoffTimeout_ == nullptr) {
    try {
      backoffTimeout_ = new BackoffTimeout(this);
    } catch (const std::bad_alloc&) {
      // Man, we couldn't even allocate the timer to re-enable accepts.
      // We must be in pretty bad shape.  Don't pause accepting for now,
      // since we won't be able to re-enable ourselves later.
      LOG(ERROR) << "failed to allocate AsyncServerSocket backoff"
                 << " timer; unable to temporarly pause accepting";
      if (connectionEventCallback_) {
        connectionEventCallback_->onBackoffError();
      }
      return;
    }
  }

  // For now, we simply pause accepting for 1 second.
  //
  // We could add some smarter backoff calculation here in the future.  (e.g.,
  // start sleeping for longer if we keep hitting the backoff frequently.)
  // Typically the user needs to figure out why the server is overloaded and
  // fix it in some other way, though.  The backoff timer is just a simple
  // mechanism to try and give the connection processing code a little bit of
  // breathing room to catch up, and to avoid just spinning and failing to
  // accept over and over again.
  const uint32_t timeoutMS = 1000;
  if (!backoffTimeout_->scheduleTimeout(timeoutMS)) {
    LOG(ERROR) << "failed to schedule AsyncServerSocket backoff timer;"
               << "unable to temporarly pause accepting";
    if (connectionEventCallback_) {
      connectionEventCallback_->onBackoffError();
    }
    return;
  }

  // The backoff timer is scheduled to re-enable accepts.
  // Go ahead and disable accepts for now.  We leave accepting_ set to true,
  // since that tracks the desired state requested by the user.
  for (auto& handler : sockets_) {
    handler.unregisterHandler();
  }
  if (connectionEventCallback_) {
    connectionEventCallback_->onBackoffStarted();
  }
}

void AsyncServerSocket::backoffTimeoutExpired() {
  // accepting_ should still be true.
  // If pauseAccepting() was called while in the backoff state it will cancel
  // the backoff timeout.
  assert(accepting_);
  // We can't be detached from the EventBase without being paused
  assert(eventBase_ != nullptr);
  eventBase_->dcheckIsInEventBaseThread();

  // If all of the callbacks were removed, we shouldn't re-enable accepts
  if (callbacks_.empty()) {
    if (connectionEventCallback_) {
      connectionEventCallback_->onBackoffEnded();
    }
    return;
  }

  // Register the handler.
  for (auto& handler : sockets_) {
    if (!handler.registerHandler(EventHandler::READ | EventHandler::PERSIST)) {
      // We're hosed.  We could just re-schedule backoffTimeout_ to
      // re-try again after a little bit.  However, we don't want to
      // loop retrying forever if we can't re-enable accepts.  Just
      // abort the entire program in this state; things are really bad
      // and restarting the entire server is probably the best remedy.
      LOG(ERROR)
          << "failed to re-enable AsyncServerSocket accepts after backoff; "
          << "crashing now";
      abort();
    }
  }
  if (connectionEventCallback_) {
    connectionEventCallback_->onBackoffEnded();
  }
}

} // namespace folly

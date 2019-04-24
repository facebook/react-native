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

#include <folly/io/async/AsyncUDPSocket.h>

#include <folly/Likely.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Unistd.h>

#include <errno.h>

// Due to the way kernel headers are included, this may or may not be defined.
// Number pulled from 3.10 kernel headers.
#ifndef SO_REUSEPORT
#define SO_REUSEPORT 15
#endif

namespace fsp = folly::portability::sockets;

namespace folly {

AsyncUDPSocket::AsyncUDPSocket(EventBase* evb)
    : EventHandler(CHECK_NOTNULL(evb)),
      readCallback_(nullptr),
      eventBase_(evb),
      fd_(-1) {
  evb->dcheckIsInEventBaseThread();
}

AsyncUDPSocket::~AsyncUDPSocket() {
  if (fd_ != -1) {
    close();
  }
}

void AsyncUDPSocket::bind(const folly::SocketAddress& address) {
  int socket = fsp::socket(address.getFamily(), SOCK_DGRAM, IPPROTO_UDP);
  if (socket == -1) {
    throw AsyncSocketException(
        AsyncSocketException::NOT_OPEN,
        "error creating async udp socket",
        errno);
  }

  auto g = folly::makeGuard([&] { ::close(socket); });

  // put the socket in non-blocking mode
  int ret = fcntl(socket, F_SETFL, O_NONBLOCK);
  if (ret != 0) {
    throw AsyncSocketException(
        AsyncSocketException::NOT_OPEN,
        "failed to put socket in non-blocking mode",
        errno);
  }

  if (reuseAddr_) {
    // put the socket in reuse mode
    int value = 1;
    if (setsockopt(socket, SOL_SOCKET, SO_REUSEADDR, &value, sizeof(value)) !=
        0) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "failed to put socket in reuse mode",
          errno);
    }
  }

  if (reusePort_) {
    // put the socket in port reuse mode
    int value = 1;
    if (setsockopt(socket, SOL_SOCKET, SO_REUSEPORT, &value, sizeof(value)) !=
        0) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "failed to put socket in reuse_port mode",
          errno);
    }
  }

  if (busyPollUs_ > 0) {
#ifdef SO_BUSY_POLL
    // Set busy_poll time in microseconds on the socket.
    // It sets how long socket will be in busy_poll mode when no event occurs.
    int value = busyPollUs_;
    if (setsockopt(socket, SOL_SOCKET, SO_BUSY_POLL, &value, sizeof(value)) !=
        0) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "failed to set SO_BUSY_POLL on the socket",
          errno);
    }
#else /* SO_BUSY_POLL is not supported*/
    throw AsyncSocketException(
        AsyncSocketException::NOT_OPEN, "SO_BUSY_POLL is not supported", errno);
#endif
  }

  if (rcvBuf_ > 0) {
    // Set the size of the buffer for the received messages in rx_queues.
    int value = rcvBuf_;
    if (setsockopt(socket, SOL_SOCKET, SO_RCVBUF, &value, sizeof(value)) != 0) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "failed to set SO_RCVBUF on the socket",
          errno);
    }
  }

  if (sndBuf_ > 0) {
    // Set the size of the buffer for the sent messages in tx_queues.
    int value = rcvBuf_;
    if (setsockopt(socket, SOL_SOCKET, SO_SNDBUF, &value, sizeof(value)) != 0) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "failed to set SO_SNDBUF on the socket",
          errno);
    }
  }

  // If we're using IPv6, make sure we don't accept V4-mapped connections
  if (address.getFamily() == AF_INET6) {
    int flag = 1;
    if (setsockopt(socket, IPPROTO_IPV6, IPV6_V6ONLY, &flag, sizeof(flag))) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN, "Failed to set IPV6_V6ONLY", errno);
    }
  }

  // bind to the address
  sockaddr_storage addrStorage;
  address.getAddress(&addrStorage);
  sockaddr* saddr = reinterpret_cast<sockaddr*>(&addrStorage);
  if (fsp::bind(socket, saddr, address.getActualSize()) != 0) {
    throw AsyncSocketException(
        AsyncSocketException::NOT_OPEN,
        "failed to bind the async udp socket for:" + address.describe(),
        errno);
  }

  // success
  g.dismiss();
  fd_ = socket;
  ownership_ = FDOwnership::OWNS;

  // attach to EventHandler
  EventHandler::changeHandlerFD(fd_);

  if (address.getPort() != 0) {
    localAddress_ = address;
  } else {
    localAddress_.setFromLocalAddress(fd_);
  }
}

void AsyncUDPSocket::dontFragment(bool df) {
  (void)df; // to avoid potential unused variable warning
#if defined(IP_MTU_DISCOVER) && defined(IP_PMTUDISC_DO) && \
    defined(IP_PMTUDISC_WANT)
  if (address().getFamily() == AF_INET) {
    int v4 = df ? IP_PMTUDISC_DO : IP_PMTUDISC_WANT;
    if (fsp::setsockopt(fd_, IPPROTO_IP, IP_MTU_DISCOVER, &v4, sizeof(v4))) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "Failed to set DF with IP_MTU_DISCOVER",
          errno);
    }
  }
#endif
#if defined(IPV6_MTU_DISCOVER) && defined(IPV6_PMTUDISC_DO) && \
    defined(IPV6_PMTUDISC_WANT)
  if (address().getFamily() == AF_INET6) {
    int v6 = df ? IPV6_PMTUDISC_DO : IPV6_PMTUDISC_WANT;
    if (fsp::setsockopt(
            fd_, IPPROTO_IPV6, IPV6_MTU_DISCOVER, &v6, sizeof(v6))) {
      throw AsyncSocketException(
          AsyncSocketException::NOT_OPEN,
          "Failed to set DF with IPV6_MTU_DISCOVER",
          errno);
    }
  }
#endif
}

void AsyncUDPSocket::setErrMessageCallback(
    ErrMessageCallback* errMessageCallback) {
  errMessageCallback_ = errMessageCallback;
  int err = (errMessageCallback_ != nullptr);
#if defined(IP_RECVERR)
  if (address().getFamily() == AF_INET &&
      fsp::setsockopt(fd_, IPPROTO_IP, IP_RECVERR, &err, sizeof(err))) {
    throw AsyncSocketException(
        AsyncSocketException::NOT_OPEN, "Failed to set IP_RECVERR", errno);
  }
#endif
#if defined(IPV6_RECVERR)
  if (address().getFamily() == AF_INET6 &&
      fsp::setsockopt(fd_, IPPROTO_IPV6, IPV6_RECVERR, &err, sizeof(err))) {
    throw AsyncSocketException(
        AsyncSocketException::NOT_OPEN, "Failed to set IPV6_RECVERR", errno);
  }
#endif
  (void)err;
}

void AsyncUDPSocket::setFD(int fd, FDOwnership ownership) {
  CHECK_EQ(-1, fd_) << "Already bound to another FD";

  fd_ = fd;
  ownership_ = ownership;

  EventHandler::changeHandlerFD(fd_);
  localAddress_.setFromLocalAddress(fd_);
}

ssize_t AsyncUDPSocket::writeGSO(
    const folly::SocketAddress& address,
    const std::unique_ptr<folly::IOBuf>& buf,
    int gso) {
  // UDP's typical MTU size is 1500, so high number of buffers
  //   really do not make sense. Optimize for buffer chains with
  //   buffers less than 16, which is the highest I can think of
  //   for a real use case.
  iovec vec[16];
  size_t iovec_len = buf->fillIov(vec, sizeof(vec) / sizeof(vec[0]));
  if (UNLIKELY(iovec_len == 0)) {
    buf->coalesce();
    vec[0].iov_base = const_cast<uint8_t*>(buf->data());
    vec[0].iov_len = buf->length();
    iovec_len = 1;
  }

  return writev(address, vec, iovec_len, gso);
}

ssize_t AsyncUDPSocket::write(
    const folly::SocketAddress& address,
    const std::unique_ptr<folly::IOBuf>& buf) {
  return writeGSO(address, buf, 0);
}

ssize_t AsyncUDPSocket::writev(
    const folly::SocketAddress& address,
    const struct iovec* vec,
    size_t iovec_len,
    int gso) {
  CHECK_NE(-1, fd_) << "Socket not yet bound";

  sockaddr_storage addrStorage;
  address.getAddress(&addrStorage);

  struct msghdr msg;
  msg.msg_name = reinterpret_cast<void*>(&addrStorage);
  msg.msg_namelen = address.getActualSize();
  msg.msg_iov = const_cast<struct iovec*>(vec);
  msg.msg_iovlen = iovec_len;
  msg.msg_control = nullptr;
  msg.msg_controllen = 0;
  msg.msg_flags = 0;

#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  if (gso > 0) {
    char control[CMSG_SPACE(sizeof(uint16_t))];
    msg.msg_control = control;
    msg.msg_controllen = sizeof(control);

    struct cmsghdr* cm = CMSG_FIRSTHDR(&msg);
    cm->cmsg_level = SOL_UDP;
    cm->cmsg_type = UDP_SEGMENT;
    cm->cmsg_len = CMSG_LEN(sizeof(uint16_t));
    uint16_t gso_len = static_cast<uint16_t>(gso);
    memcpy(CMSG_DATA(cm), &gso_len, sizeof(gso_len));

    return sendmsg(fd_, &msg, 0);
  }
#else
  CHECK_LT(gso, 1) << "GSO not supported";
#endif

  return sendmsg(fd_, &msg, 0);
}

ssize_t AsyncUDPSocket::writev(
    const folly::SocketAddress& address,
    const struct iovec* vec,
    size_t iovec_len) {
  return writev(address, vec, iovec_len, 0);
}
void AsyncUDPSocket::resumeRead(ReadCallback* cob) {
  CHECK(!readCallback_) << "Another read callback already installed";
  CHECK_NE(-1, fd_) << "UDP server socket not yet bind to an address";

  readCallback_ = CHECK_NOTNULL(cob);
  if (!updateRegistration()) {
    AsyncSocketException ex(
        AsyncSocketException::NOT_OPEN, "failed to register for accept events");

    readCallback_ = nullptr;
    cob->onReadError(ex);
    return;
  }
}

void AsyncUDPSocket::pauseRead() {
  // It is ok to pause an already paused socket
  readCallback_ = nullptr;
  updateRegistration();
}

void AsyncUDPSocket::close() {
  eventBase_->dcheckIsInEventBaseThread();

  if (readCallback_) {
    auto cob = readCallback_;
    readCallback_ = nullptr;

    cob->onReadClosed();
  }

  // Unregister any events we are registered for
  unregisterHandler();

  if (fd_ != -1 && ownership_ == FDOwnership::OWNS) {
    ::close(fd_);
  }

  fd_ = -1;
}

void AsyncUDPSocket::handlerReady(uint16_t events) noexcept {
  if (events & EventHandler::READ) {
    DCHECK(readCallback_);
    handleRead();
  }
}

size_t AsyncUDPSocket::handleErrMessages() noexcept {
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  if (errMessageCallback_ == nullptr) {
    return 0;
  }
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
  while (fd_ != -1) {
    ret = recvmsg(fd_, &msg, MSG_ERRQUEUE);
    VLOG(5) << "AsyncSocket::handleErrMessages(): recvmsg returned " << ret;

    if (ret < 0) {
      if (errno != EAGAIN) {
        auto errnoCopy = errno;
        LOG(ERROR) << "::recvmsg exited with code " << ret
                   << ", errno: " << errnoCopy;
        AsyncSocketException ex(
            AsyncSocketException::INTERNAL_ERROR,
            "recvmsg() failed",
            errnoCopy);
        failErrMessageRead(ex);
      }
      return num;
    }

    for (struct cmsghdr* cmsg = CMSG_FIRSTHDR(&msg);
         cmsg != nullptr && cmsg->cmsg_len != 0;
         cmsg = CMSG_NXTHDR(&msg, cmsg)) {
      ++num;
      errMessageCallback_->errMessage(*cmsg);
      if (fd_ == -1) {
        // once the socket is closed there is no use for more read errors.
        return num;
      }
    }
  }
  return num;
#else
  return 0;
#endif
}

void AsyncUDPSocket::failErrMessageRead(const AsyncSocketException& ex) {
  if (errMessageCallback_ != nullptr) {
    ErrMessageCallback* callback = errMessageCallback_;
    errMessageCallback_ = nullptr;
    callback->errMessageError(ex);
  }
}

int AsyncUDPSocket::connect(const folly::SocketAddress& address) {
  CHECK_NE(-1, fd_) << "Socket not yet bound";
  sockaddr_storage addrStorage;
  address.getAddress(&addrStorage);
  return fsp::connect(
      fd_, reinterpret_cast<sockaddr*>(&addrStorage), address.getActualSize());
}

void AsyncUDPSocket::handleRead() noexcept {
  void* buf{nullptr};
  size_t len{0};

  if (handleErrMessages()) {
    return;
  }

  if (fd_ == -1) {
    // The socket may have been closed by the error callbacks.
    return;
  }

  readCallback_->getReadBuffer(&buf, &len);
  if (buf == nullptr || len == 0) {
    AsyncSocketException ex(
        AsyncSocketException::BAD_ARGS,
        "AsyncUDPSocket::getReadBuffer() returned empty buffer");

    auto cob = readCallback_;
    readCallback_ = nullptr;

    cob->onReadError(ex);
    updateRegistration();
    return;
  }

  struct sockaddr_storage addrStorage;
  socklen_t addrLen = sizeof(addrStorage);
  memset(&addrStorage, 0, size_t(addrLen));
  struct sockaddr* rawAddr = reinterpret_cast<sockaddr*>(&addrStorage);
  rawAddr->sa_family = localAddress_.getFamily();

  ssize_t bytesRead = recvfrom(fd_, buf, len, MSG_TRUNC, rawAddr, &addrLen);
  if (bytesRead >= 0) {
    clientAddress_.setFromSockaddr(rawAddr, addrLen);

    if (bytesRead > 0) {
      bool truncated = false;
      if ((size_t)bytesRead > len) {
        truncated = true;
        bytesRead = ssize_t(len);
      }

      readCallback_->onDataAvailable(
          clientAddress_, size_t(bytesRead), truncated);
    }
  } else {
    if (errno == EAGAIN || errno == EWOULDBLOCK) {
      // No data could be read without blocking the socket
      return;
    }

    AsyncSocketException ex(
        AsyncSocketException::INTERNAL_ERROR, "::recvfrom() failed", errno);

    // In case of UDP we can continue reading from the socket
    // even if the current request fails. We notify the user
    // so that he can do some logging/stats collection if he wants.
    auto cob = readCallback_;
    readCallback_ = nullptr;

    cob->onReadError(ex);
    updateRegistration();
  }
}

bool AsyncUDPSocket::updateRegistration() noexcept {
  uint16_t flags = NONE;

  if (readCallback_) {
    flags |= READ;
  }

  return registerHandler(uint16_t(flags | PERSIST));
}

bool AsyncUDPSocket::setGSO(int val) {
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  int ret = ::setsockopt(fd_, SOL_UDP, UDP_SEGMENT, &val, sizeof(val));

  gso_ = ret ? -1 : val;

  return !ret;
#else
  (void)val;
  return false;
#endif
}

int AsyncUDPSocket::getGSO() {
  // check if we can return the cached value
  if (FOLLY_UNLIKELY(!gso_.hasValue())) {
#ifdef FOLLY_HAVE_MSG_ERRQUEUE
    int gso = -1;
    socklen_t optlen = sizeof(gso);
    if (!::getsockopt(fd_, SOL_UDP, UDP_SEGMENT, &gso, &optlen)) {
      gso_ = gso;
    } else {
      gso_ = -1;
    }
#else
    gso_ = -1;
#endif
  }

  return gso_.value();
}

void AsyncUDPSocket::detachEventBase() {
  DCHECK(eventBase_ && eventBase_->isInEventBaseThread());
  registerHandler(uint16_t(NONE));
  eventBase_ = nullptr;
  EventHandler::detachEventBase();
}

void AsyncUDPSocket::attachEventBase(folly::EventBase* evb) {
  DCHECK(!eventBase_);
  DCHECK(evb && evb->isInEventBaseThread());
  eventBase_ = evb;
  EventHandler::attachEventBase(evb);
  updateRegistration();
}

} // namespace folly

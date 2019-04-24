/*
 * Copyright 2015-present Facebook, Inc.
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
#pragma once

#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/test/BlockingSocket.h>
#include <folly/portability/Sockets.h>

#include <memory>

enum StateEnum { STATE_WAITING, STATE_SUCCEEDED, STATE_FAILED };

typedef std::function<void()> VoidCallback;

class ConnCallback : public folly::AsyncSocket::ConnectCallback {
 public:
  ConnCallback()
      : state(STATE_WAITING),
        exception(folly::AsyncSocketException::UNKNOWN, "none") {}

  void connectSuccess() noexcept override {
    state = STATE_SUCCEEDED;
    if (successCallback) {
      successCallback();
    }
  }

  void connectErr(const folly::AsyncSocketException& ex) noexcept override {
    state = STATE_FAILED;
    exception = ex;
    if (errorCallback) {
      errorCallback();
    }
  }

  StateEnum state;
  folly::AsyncSocketException exception;
  VoidCallback successCallback;
  VoidCallback errorCallback;
};

class WriteCallback : public folly::AsyncTransportWrapper::WriteCallback {
 public:
  WriteCallback()
      : state(STATE_WAITING),
        bytesWritten(0),
        exception(folly::AsyncSocketException::UNKNOWN, "none") {}

  void writeSuccess() noexcept override {
    state = STATE_SUCCEEDED;
    if (successCallback) {
      successCallback();
    }
  }

  void writeErr(
      size_t nBytesWritten,
      const folly::AsyncSocketException& ex) noexcept override {
    LOG(ERROR) << ex.what();
    state = STATE_FAILED;
    this->bytesWritten = nBytesWritten;
    exception = ex;
    if (errorCallback) {
      errorCallback();
    }
  }

  StateEnum state;
  std::atomic<size_t> bytesWritten;
  folly::AsyncSocketException exception;
  VoidCallback successCallback;
  VoidCallback errorCallback;
};

class ReadCallback : public folly::AsyncTransportWrapper::ReadCallback {
 public:
  explicit ReadCallback(size_t _maxBufferSz = 4096)
      : state(STATE_WAITING),
        exception(folly::AsyncSocketException::UNKNOWN, "none"),
        buffers(),
        maxBufferSz(_maxBufferSz) {}

  ~ReadCallback() override {
    for (std::vector<Buffer>::iterator it = buffers.begin();
         it != buffers.end();
         ++it) {
      it->free();
    }
    currentBuffer.free();
  }

  void getReadBuffer(void** bufReturn, size_t* lenReturn) override {
    if (!currentBuffer.buffer) {
      currentBuffer.allocate(maxBufferSz);
    }
    *bufReturn = currentBuffer.buffer;
    *lenReturn = currentBuffer.length;
  }

  void readDataAvailable(size_t len) noexcept override {
    currentBuffer.length = len;
    buffers.push_back(currentBuffer);
    currentBuffer.reset();
    if (dataAvailableCallback) {
      dataAvailableCallback();
    }
  }

  void readEOF() noexcept override {
    state = STATE_SUCCEEDED;
  }

  void readErr(const folly::AsyncSocketException& ex) noexcept override {
    state = STATE_FAILED;
    exception = ex;
  }

  void verifyData(const char* expected, size_t expectedLen) const {
    size_t offset = 0;
    for (size_t idx = 0; idx < buffers.size(); ++idx) {
      const auto& buf = buffers[idx];
      size_t cmpLen = std::min(buf.length, expectedLen - offset);
      CHECK_EQ(memcmp(buf.buffer, expected + offset, cmpLen), 0);
      CHECK_EQ(cmpLen, buf.length);
      offset += cmpLen;
    }
    CHECK_EQ(offset, expectedLen);
  }

  size_t dataRead() const {
    size_t ret = 0;
    for (const auto& buf : buffers) {
      ret += buf.length;
    }
    return ret;
  }

  class Buffer {
   public:
    Buffer() : buffer(nullptr), length(0) {}
    Buffer(char* buf, size_t len) : buffer(buf), length(len) {}

    void reset() {
      buffer = nullptr;
      length = 0;
    }
    void allocate(size_t len) {
      assert(buffer == nullptr);
      this->buffer = static_cast<char*>(malloc(len));
      this->length = len;
    }
    void free() {
      ::free(buffer);
      reset();
    }

    char* buffer;
    size_t length;
  };

  StateEnum state;
  folly::AsyncSocketException exception;
  std::vector<Buffer> buffers;
  Buffer currentBuffer;
  VoidCallback dataAvailableCallback;
  const size_t maxBufferSz;
};

class BufferCallback : public folly::AsyncTransport::BufferCallback {
 public:
  BufferCallback() : buffered_(false), bufferCleared_(false) {}

  void onEgressBuffered() override {
    buffered_ = true;
  }

  void onEgressBufferCleared() override {
    bufferCleared_ = true;
  }

  bool hasBuffered() const {
    return buffered_;
  }

  bool hasBufferCleared() const {
    return bufferCleared_;
  }

 private:
  bool buffered_{false};
  bool bufferCleared_{false};
};

class ReadVerifier {};

class TestSendMsgParamsCallback
    : public folly::AsyncSocket::SendMsgParamsCallback {
 public:
  TestSendMsgParamsCallback(int flags, uint32_t dataSize, void* data)
      : flags_(flags),
        writeFlags_(folly::WriteFlags::NONE),
        dataSize_(dataSize),
        data_(data),
        queriedFlags_(false),
        queriedData_(false) {}

  void reset(int flags) {
    flags_ = flags;
    writeFlags_ = folly::WriteFlags::NONE;
    queriedFlags_ = false;
    queriedData_ = false;
  }

  int getFlagsImpl(
      folly::WriteFlags flags,
      int /*defaultFlags*/) noexcept override {
    queriedFlags_ = true;
    if (writeFlags_ == folly::WriteFlags::NONE) {
      writeFlags_ = flags;
    } else {
      assert(flags == writeFlags_);
    }
    return flags_;
  }

  void getAncillaryData(folly::WriteFlags flags, void* data) noexcept override {
    queriedData_ = true;
    if (writeFlags_ == folly::WriteFlags::NONE) {
      writeFlags_ = flags;
    } else {
      assert(flags == writeFlags_);
    }
    assert(data != nullptr);
    memcpy(data, data_, dataSize_);
  }

  uint32_t getAncillaryDataSize(folly::WriteFlags flags) noexcept override {
    if (writeFlags_ == folly::WriteFlags::NONE) {
      writeFlags_ = flags;
    } else {
      assert(flags == writeFlags_);
    }
    return dataSize_;
  }

  int flags_;
  folly::WriteFlags writeFlags_;
  uint32_t dataSize_;
  void* data_;
  bool queriedFlags_;
  bool queriedData_;
};

class TestServer {
 public:
  // Create a TestServer.
  // This immediately starts listening on an ephemeral port.
  explicit TestServer(bool enableTFO = false, int bufSize = -1) : fd_(-1) {
    namespace fsp = folly::portability::sockets;
    fd_ = fsp::socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (fd_ < 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "failed to create test server socket",
          errno);
    }
    if (fcntl(fd_, F_SETFL, O_NONBLOCK) != 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "failed to put test server socket in "
          "non-blocking mode",
          errno);
    }
    if (enableTFO) {
#if FOLLY_ALLOW_TFO
      folly::detail::tfo_enable(fd_, 100);
#endif
    }

    struct addrinfo hints, *res;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE;

    if (getaddrinfo(nullptr, "0", &hints, &res)) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "Attempted to bind address to socket with "
          "bad getaddrinfo",
          errno);
    }

    SCOPE_EXIT {
      freeaddrinfo(res);
    };

    if (bufSize > 0) {
      setsockopt(fd_, SOL_SOCKET, SO_SNDBUF, &bufSize, sizeof(bufSize));
      setsockopt(fd_, SOL_SOCKET, SO_RCVBUF, &bufSize, sizeof(bufSize));
    }

    if (bind(fd_, res->ai_addr, res->ai_addrlen)) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "failed to bind to async server socket for port 10",
          errno);
    }

    if (listen(fd_, 10) != 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "failed to listen on test server socket",
          errno);
    }

    address_.setFromLocalAddress(fd_);
    // The local address will contain 0.0.0.0.
    // Change it to 127.0.0.1, so it can be used to connect to the server
    address_.setFromIpPort("127.0.0.1", address_.getPort());
  }

  ~TestServer() {
    if (fd_ != -1) {
      close(fd_);
    }
  }

  // Get the address for connecting to the server
  const folly::SocketAddress& getAddress() const {
    return address_;
  }

  int acceptFD(int timeout = 50) {
    namespace fsp = folly::portability::sockets;
    struct pollfd pfd;
    pfd.fd = fd_;
    pfd.events = POLLIN;
    int ret = poll(&pfd, 1, timeout);
    if (ret == 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "test server accept() timed out");
    } else if (ret < 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "test server accept() poll failed",
          errno);
    }

    int acceptedFd = fsp::accept(fd_, nullptr, nullptr);
    if (acceptedFd < 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::INTERNAL_ERROR,
          "test server accept() failed",
          errno);
    }

    return acceptedFd;
  }

  std::shared_ptr<BlockingSocket> accept(int timeout = 50) {
    int fd = acceptFD(timeout);
    return std::make_shared<BlockingSocket>(fd);
  }

  std::shared_ptr<folly::AsyncSocket> acceptAsync(
      folly::EventBase* evb,
      int timeout = 50) {
    int fd = acceptFD(timeout);
    return folly::AsyncSocket::newSocket(evb, fd);
  }

  /**
   * Accept a connection, read data from it, and verify that it matches the
   * data in the specified buffer.
   */
  void verifyConnection(const char* buf, size_t len) {
    // accept a connection
    std::shared_ptr<BlockingSocket> acceptedSocket = accept();
    // read the data and compare it to the specified buffer
    std::unique_ptr<uint8_t[]> readbuf(new uint8_t[len]);
    acceptedSocket->readAll(readbuf.get(), len);
    CHECK_EQ(memcmp(buf, readbuf.get(), len), 0);
    // make sure we get EOF next
    uint32_t bytesRead = acceptedSocket->read(readbuf.get(), len);
    CHECK_EQ(bytesRead, 0);
  }

 private:
  int fd_;
  folly::SocketAddress address_;
};

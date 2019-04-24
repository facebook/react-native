/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/ExceptionWrapper.h>
#include <folly/SocketAddress.h>
#include <folly/io/IOBufQueue.h>
#include <folly/io/async/AsyncServerSocket.h>
#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/EventBase.h>

namespace folly {

class ZeroCopyTestAsyncSocket {
 public:
  explicit ZeroCopyTestAsyncSocket(
      size_t* counter,
      folly::EventBase* evb,
      int numLoops,
      size_t bufferSize,
      bool zeroCopy)
      : counter_(counter),
        evb_(evb),
        numLoops_(numLoops),
        sock_(new folly::AsyncSocket(evb)),
        callback_(this),
        client_(true) {
    setBufferSize(bufferSize);
    setZeroCopy(zeroCopy);
  }

  explicit ZeroCopyTestAsyncSocket(
      size_t* counter,
      folly::EventBase* evb,
      int fd,
      int numLoops,
      size_t bufferSize,
      bool zeroCopy)
      : counter_(counter),
        evb_(evb),
        numLoops_(numLoops),
        sock_(new folly::AsyncSocket(evb, fd)),
        callback_(this),
        client_(false) {
    setBufferSize(bufferSize);
    setZeroCopy(zeroCopy);
    // enable reads
    if (sock_) {
      sock_->setReadCB(&callback_);
    }
  }

  ~ZeroCopyTestAsyncSocket() {
    clearBuffers();
  }

  void connect(const folly::SocketAddress& remote) {
    if (sock_) {
      sock_->connect(&callback_, remote);
    }
  }

  bool isZeroCopyWriteInProgress() const {
    return sock_->isZeroCopyWriteInProgress();
  }

 private:
  void setZeroCopy(bool enable) {
    zeroCopy_ = enable;
    if (sock_) {
      sock_->setZeroCopy(zeroCopy_);
    }
  }

  void setBufferSize(size_t bufferSize) {
    clearBuffers();
    bufferSize_ = bufferSize;

    readBuffer_ = new char[bufferSize_];
  }

  class Callback : public folly::AsyncSocket::ReadCallback,
                   public folly::AsyncSocket::ConnectCallback {
   public:
    explicit Callback(ZeroCopyTestAsyncSocket* parent) : parent_(parent) {}

    void connectSuccess() noexcept override {
      parent_->sock_->setReadCB(this);
      parent_->onConnected();
    }

    void connectErr(const folly::AsyncSocketException& ex) noexcept override {
      LOG(ERROR) << "Connect error: " << ex.what();
      parent_->onDataFinish(folly::exception_wrapper(ex));
    }

    void getReadBuffer(void** bufReturn, size_t* lenReturn) override {
      parent_->getReadBuffer(bufReturn, lenReturn);
    }

    void readDataAvailable(size_t len) noexcept override {
      parent_->readDataAvailable(len);
    }

    void readEOF() noexcept override {
      parent_->onDataFinish(folly::exception_wrapper());
    }

    void readErr(const folly::AsyncSocketException& ex) noexcept override {
      parent_->onDataFinish(folly::exception_wrapper(ex));
    }

   private:
    ZeroCopyTestAsyncSocket* parent_{nullptr};
  };

  void clearBuffers() {
    if (readBuffer_) {
      delete[] readBuffer_;
    }
  }

  void getReadBuffer(void** bufReturn, size_t* lenReturn) {
    *bufReturn = readBuffer_ + readOffset_;
    *lenReturn = bufferSize_ - readOffset_;
  }

  void readDataAvailable(size_t len) noexcept {
    readOffset_ += len;
    if (readOffset_ == bufferSize_) {
      readOffset_ = 0;
      onDataReady();
    }
  }

  void onConnected() {
    setZeroCopy(zeroCopy_);
    writeBuffer();
  }

  void onDataReady() {
    currLoop_++;
    if (client_ && currLoop_ >= numLoops_) {
      evb_->runInLoop(
          [this] {
            if (counter_ && (0 == --(*counter_))) {
              evb_->terminateLoopSoon();
            }
          },
          false /*thisIteration*/);
      return;
    }
    writeBuffer();
  }

  void onDataFinish(folly::exception_wrapper) {
    if (client_) {
      if (counter_ && (0 == --(*counter_))) {
        evb_->terminateLoopSoon();
      }
    }
  }

  bool writeBuffer() {
    // use calloc to make sure the memory is touched
    // if the memory is just malloc'd, running the zeroCopyOn
    // and the zeroCopyOff back to back on a system that does not support
    // zerocopy leads to the second test being much slower
    writeBuffer_ =
        folly::IOBuf::takeOwnership(::calloc(1, bufferSize_), bufferSize_);

    if (sock_ && writeBuffer_) {
      sock_->writeChain(
          nullptr,
          std::move(writeBuffer_),
          zeroCopy_ ? WriteFlags::WRITE_MSG_ZEROCOPY : WriteFlags::NONE);
    }

    return true;
  }

  size_t* counter_{nullptr};
  folly::EventBase* evb_;
  int numLoops_{0};
  int currLoop_{0};
  bool zeroCopy_{false};

  folly::AsyncSocket::UniquePtr sock_;
  Callback callback_;

  size_t bufferSize_{0};
  size_t readOffset_{0};
  char* readBuffer_{nullptr};
  std::unique_ptr<folly::IOBuf> writeBuffer_;

  bool client_;
};

class ZeroCopyTestServer : public folly::AsyncServerSocket::AcceptCallback {
 public:
  explicit ZeroCopyTestServer(
      folly::EventBase* evb,
      int numLoops,
      size_t bufferSize,
      bool zeroCopy)
      : evb_(evb),
        numLoops_(numLoops),
        bufferSize_(bufferSize),
        zeroCopy_(zeroCopy) {}

  void addCallbackToServerSocket(folly::AsyncServerSocket& sock) {
    sock.addAcceptCallback(this, evb_);
  }

  void connectionAccepted(
      int fd,
      const folly::SocketAddress& /* unused */) noexcept override {
    auto client = std::make_shared<ZeroCopyTestAsyncSocket>(
        nullptr, evb_, fd, numLoops_, bufferSize_, zeroCopy_);
    clients_[client.get()] = client;
  }

  void acceptError(const std::exception&) noexcept override {}

 private:
  folly::EventBase* evb_;
  int numLoops_;
  size_t bufferSize_;
  bool zeroCopy_;
  std::unique_ptr<ZeroCopyTestAsyncSocket> client_;
  std::unordered_map<
      ZeroCopyTestAsyncSocket*,
      std::shared_ptr<ZeroCopyTestAsyncSocket>>
      clients_;
};

class ZeroCopyTest {
 public:
  explicit ZeroCopyTest(
      size_t numClients,
      int numLoops,
      bool zeroCopy,
      size_t bufferSize);
  bool run();

 private:
  void connectAll() {
    SocketAddress addr = listenSock_->getAddress();
    for (auto& client : clients_) {
      client->connect(addr);
    }
  }

  size_t numClients_;
  size_t counter_;
  int numLoops_;
  bool zeroCopy_;
  size_t bufferSize_;

  EventBase evb_;
  std::vector<std::unique_ptr<ZeroCopyTestAsyncSocket>> clients_;
  folly::AsyncServerSocket::UniquePtr listenSock_;
  ZeroCopyTestServer server_;
};

} // namespace folly

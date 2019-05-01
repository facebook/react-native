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

#include <folly/Memory.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/portability/GMock.h>

namespace folly {
namespace test {

class MockAsyncTransport : public AsyncTransportWrapper {
 public:
  MOCK_METHOD1(setReadCB, void(ReadCallback*));
  MOCK_CONST_METHOD0(getReadCallback, ReadCallback*());
  MOCK_CONST_METHOD0(getReadCB, ReadCallback*());
  MOCK_METHOD4(write, void(WriteCallback*, const void*, size_t, WriteFlags));
  MOCK_METHOD4(writev, void(WriteCallback*, const iovec*, size_t, WriteFlags));
  MOCK_METHOD3(
      writeChain,
      void(WriteCallback*, std::shared_ptr<folly::IOBuf>, WriteFlags));

  void writeChain(
      WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& iob,
      WriteFlags flags = WriteFlags::NONE) override {
    writeChain(callback, std::shared_ptr<folly::IOBuf>(iob.release()), flags);
  }

  MOCK_METHOD0(close, void());
  MOCK_METHOD0(closeNow, void());
  MOCK_METHOD0(closeWithReset, void());
  MOCK_METHOD0(shutdownWrite, void());
  MOCK_METHOD0(shutdownWriteNow, void());
  MOCK_CONST_METHOD0(good, bool());
  MOCK_CONST_METHOD0(readable, bool());
  MOCK_CONST_METHOD0(connecting, bool());
  MOCK_CONST_METHOD0(error, bool());
  MOCK_METHOD1(attachEventBase, void(EventBase*));
  MOCK_METHOD0(detachEventBase, void());
  MOCK_CONST_METHOD0(isDetachable, bool());
  MOCK_CONST_METHOD0(getEventBase, EventBase*());
  MOCK_METHOD1(setSendTimeout, void(uint32_t));
  MOCK_CONST_METHOD0(getSendTimeout, uint32_t());
  MOCK_CONST_METHOD1(getLocalAddress, void(folly::SocketAddress*));
  MOCK_CONST_METHOD1(getPeerAddress, void(folly::SocketAddress*));
  MOCK_CONST_METHOD0(getAppBytesWritten, size_t());
  MOCK_CONST_METHOD0(getRawBytesWritten, size_t());
  MOCK_CONST_METHOD0(getAppBytesReceived, size_t());
  MOCK_CONST_METHOD0(getRawBytesReceived, size_t());
  MOCK_CONST_METHOD0(isEorTrackingEnabled, bool());
  MOCK_METHOD1(setEorTracking, void(bool));
  MOCK_CONST_METHOD0(getWrappedTransport, AsyncTransportWrapper*());
  MOCK_CONST_METHOD0(isReplaySafe, bool());
  MOCK_METHOD1(
      setReplaySafetyCallback,
      void(AsyncTransport::ReplaySafetyCallback*));
  MOCK_CONST_METHOD0(getSecurityProtocol, std::string());
};

class MockReplaySafetyCallback : public AsyncTransport::ReplaySafetyCallback {
 public:
  MOCK_METHOD0(onReplaySafe_, void());
  void onReplaySafe() noexcept override {
    onReplaySafe_();
  }
};

class MockReadCallback : public AsyncTransportWrapper::ReadCallback {
 public:
  MOCK_METHOD2(getReadBuffer, void(void**, size_t*));

  MOCK_METHOD1(readDataAvailable_, void(size_t));
  void readDataAvailable(size_t size) noexcept override {
    readDataAvailable_(size);
  }

  MOCK_METHOD0(isBufferMovable_, bool());
  bool isBufferMovable() noexcept override {
    return isBufferMovable_();
  }

  MOCK_METHOD1(readBufferAvailable_, void(std::unique_ptr<folly::IOBuf>&));
  void readBufferAvailable(
      std::unique_ptr<folly::IOBuf> readBuf) noexcept override {
    readBufferAvailable_(readBuf);
  }

  MOCK_METHOD0(readEOF_, void());
  void readEOF() noexcept override {
    readEOF_();
  }

  MOCK_METHOD1(readErr_, void(const AsyncSocketException&));
  void readErr(const AsyncSocketException& ex) noexcept override {
    readErr_(ex);
  }
};

class MockWriteCallback : public AsyncTransportWrapper::WriteCallback {
 public:
  MOCK_METHOD0(writeSuccess_, void());
  void writeSuccess() noexcept override {
    writeSuccess_();
  }

  MOCK_METHOD2(writeErr_, void(size_t, const AsyncSocketException&));
  void writeErr(size_t size, const AsyncSocketException& ex) noexcept override {
    writeErr_(size, ex);
  }
};

} // namespace test
} // namespace folly

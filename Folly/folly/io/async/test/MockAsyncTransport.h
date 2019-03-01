/*
 * Copyright 2017 Facebook, Inc.
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

namespace folly { namespace test {

class MockAsyncTransport: public AsyncTransportWrapper {
 public:
  MOCK_METHOD1(setReadCB, void(ReadCallback*));
  MOCK_CONST_METHOD0(getReadCallback, ReadCallback*());
  MOCK_CONST_METHOD0(getReadCB, ReadCallback*());
  MOCK_METHOD4(write, void(WriteCallback*, const void*, size_t, WriteFlags));
  MOCK_METHOD4(writev, void(WriteCallback*, const iovec*, size_t, WriteFlags));
  MOCK_METHOD3(writeChain,
               void(WriteCallback*, std::shared_ptr<folly::IOBuf>, WriteFlags));

  void writeChain(WriteCallback* callback,
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
  MOCK_METHOD1(setReplaySafetyCallback,
               void(AsyncTransport::ReplaySafetyCallback*));
};

class MockReplaySafetyCallback : public AsyncTransport::ReplaySafetyCallback {
 public:
  GMOCK_METHOD0_(, noexcept, , onReplaySafe, void());
};

class MockReadCallback: public AsyncTransportWrapper::ReadCallback {
 public:
  MOCK_METHOD2(getReadBuffer, void(void**, size_t*));
  GMOCK_METHOD1_(, noexcept, , readDataAvailable, void(size_t));
  GMOCK_METHOD0_(, noexcept, , isBufferMovable, bool());
  GMOCK_METHOD1_(, noexcept, ,
      readBufferAvailableInternal, void(std::shared_ptr<folly::IOBuf>));
  GMOCK_METHOD0_(, noexcept, , readEOF, void());
  GMOCK_METHOD1_(, noexcept, , readErr,
                 void(const AsyncSocketException&));

  void readBufferAvailable(std::unique_ptr<folly::IOBuf> readBuf)
    noexcept override {
    readBufferAvailableInternal(
        folly::to_shared_ptr(std::move(readBuf)));
  }
};

class MockWriteCallback: public AsyncTransportWrapper::WriteCallback {
 public:
  GMOCK_METHOD0_(, noexcept, , writeSuccess, void());
  GMOCK_METHOD2_(, noexcept, , writeErr,
                 void(size_t, const AsyncSocketException&));
};

}}

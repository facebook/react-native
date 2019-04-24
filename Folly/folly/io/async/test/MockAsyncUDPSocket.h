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

#include <folly/io/async/AsyncUDPSocket.h>
#include <folly/portability/GMock.h>

namespace folly {
namespace test {

struct MockAsyncUDPSocket : public AsyncUDPSocket {
  explicit MockAsyncUDPSocket(EventBase* evb) : AsyncUDPSocket(evb) {}
  ~MockAsyncUDPSocket() override {}

  MOCK_CONST_METHOD0(address, const SocketAddress&());
  MOCK_METHOD1(bind, void(const SocketAddress&));
  MOCK_METHOD2(setFD, void(int, AsyncUDPSocket::FDOwnership));
  MOCK_METHOD2(
      write,
      ssize_t(const SocketAddress&, const std::unique_ptr<IOBuf>&));
  MOCK_METHOD3(
      writeGSO,
      ssize_t(
          const folly::SocketAddress&,
          const std::unique_ptr<folly::IOBuf>&,
          int));
  MOCK_METHOD3(
      writev,
      ssize_t(const SocketAddress&, const struct iovec*, size_t));
  MOCK_METHOD1(resumeRead, void(ReadCallback*));
  MOCK_METHOD0(pauseRead, void());
  MOCK_METHOD0(close, void());
  MOCK_CONST_METHOD0(getFD, int());
  MOCK_METHOD1(setReusePort, void(bool));
  MOCK_METHOD1(setReuseAddr, void(bool));
  MOCK_METHOD1(dontFragment, void(bool));
  MOCK_METHOD1(setErrMessageCallback, void(ErrMessageCallback*));
  MOCK_METHOD1(connect, int(const SocketAddress&));
  MOCK_CONST_METHOD0(isBound, bool());
  MOCK_METHOD0(getGSO, int());
  MOCK_METHOD1(setGSO, bool(int));
};

} // namespace test
} // namespace folly

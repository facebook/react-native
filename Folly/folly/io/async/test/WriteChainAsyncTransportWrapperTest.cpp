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

#include <folly/io/async/WriteChainAsyncTransportWrapper.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

using namespace testing;
using testing::_;

namespace folly {
namespace test {

class TestWriteChainAsyncTransportWrapper
    : public WriteChainAsyncTransportWrapper<folly::AsyncTransportWrapper> {
 public:
  TestWriteChainAsyncTransportWrapper()
      : WriteChainAsyncTransportWrapper<folly::AsyncTransportWrapper>(nullptr) {
  }

  MOCK_METHOD3(
      writeChain,
      void(
          folly::AsyncTransportWrapper::WriteCallback*,
          std::shared_ptr<folly::IOBuf>,
          folly::WriteFlags));

  // gmock doesn't work with the IOBuf&& so we have to wrap this.
  void writeChain(
      WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& iob,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    writeChain(callback, std::shared_ptr<folly::IOBuf>(iob.release()), flags);
  }

  // Allow this to be constructed on the stack for easier testing.
  ~TestWriteChainAsyncTransportWrapper() override {}
};

MATCHER_P(BufMatches, expected, "") {
  folly::IOBufEqualTo eq;
  return eq(*arg, *expected);
}

TEST(WriteChainAsyncTransportWrapperTest, TestSimpleIov) {
  TestWriteChainAsyncTransportWrapper transport;
  auto buf = folly::IOBuf::copyBuffer("foo");

  EXPECT_CALL(transport, writeChain(_, BufMatches(buf.get()), _));

  auto iov = buf->getIov();
  transport.writev(nullptr, iov.data(), iov.size());
}

TEST(WriteChainAsyncTransportWrapperTest, TestChainedIov) {
  TestWriteChainAsyncTransportWrapper transport;
  auto buf = folly::IOBuf::copyBuffer("hello");
  buf->prependChain(folly::IOBuf::copyBuffer("world"));

  EXPECT_CALL(transport, writeChain(_, BufMatches(buf.get()), _));

  auto iov = buf->getIov();
  transport.writev(nullptr, iov.data(), iov.size());
}

TEST(WriteChainAsyncTransportWrapperTest, TestSimpleBuf) {
  TestWriteChainAsyncTransportWrapper transport;
  auto buf = folly::IOBuf::copyBuffer("foobar");

  EXPECT_CALL(transport, writeChain(_, BufMatches(buf.get()), _));

  transport.write(nullptr, buf->data(), buf->length());
}

} // namespace test
} // namespace folly

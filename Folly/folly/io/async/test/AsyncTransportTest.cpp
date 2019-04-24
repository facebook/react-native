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

#include <folly/io/async/AsyncTransport.h>

#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/test/MockAsyncTransport.h>
#include <folly/portability/GTest.h>

using namespace testing;

namespace folly {

TEST(AsyncTransportTest, getSocketFromSocket) {
  AsyncSocket::UniquePtr transport(new AsyncSocket());
  auto sock = transport->getUnderlyingTransport<AsyncSocket>();
  ASSERT_EQ(transport.get(), sock);
}

TEST(AsyncTransportTest, getSocketFromWrappedTransport) {
  AsyncSocket::UniquePtr transport(new AsyncSocket());
  auto transportAddr = transport.get();

  test::MockAsyncTransport wrapped1;
  test::MockAsyncTransport wrapped2;

  EXPECT_CALL(wrapped2, getWrappedTransport()).WillOnce(Return(&wrapped1));
  EXPECT_CALL(wrapped1, getWrappedTransport()).WillOnce(Return(transportAddr));

  auto sock = wrapped2.getUnderlyingTransport<AsyncSocket>();
  ASSERT_EQ(transportAddr, sock);
}

} // namespace folly

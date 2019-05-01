/*
 * Copyright 2016-present Facebook, Inc.
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

#include <memory>
#include <utility>

#include <folly/IPAddress.h>
#include <folly/IPAddressV6.h>
#include <folly/SocketAddress.h>

namespace folly {

class AsyncServerSocket;
class ScopedEventBaseThread;

/***
 *  ScopedBoundPort
 *
 *  Binds to an ephemeral port in the ctor but does not listen. Unbinds from the
 *  port in the dtor.
 *
 *  While an instance is in scope, we know at least one port which is guaranteed
 *  not to be listening - the port the instance binds but does not listen.
 *
 *  Useful for testing server-down cases.
 *
 *  Example:
 *
 *    TEST(MyClient, WhenTheServerIsDown_ThrowsServerDownException) {
 *      folly::ScopedBoundPort bound;
 *      MyClient client(bound.getAddress(), 100ms);
 *      EXPECT_THROW(client.getData(), ServerDownException);
 *    }
 */
class ScopedBoundPort {
 public:
  explicit ScopedBoundPort(IPAddress host = IPAddressV6("::1"));
  ~ScopedBoundPort();
  SocketAddress getAddress() const;

 private:
  std::unique_ptr<ScopedEventBaseThread> ebth_;
  std::shared_ptr<AsyncServerSocket> sock_;
};
} // namespace folly

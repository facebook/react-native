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

#include <folly/io/async/test/ScopedBoundPort.h>

#include <folly/Memory.h>
#include <folly/io/async/AsyncServerSocket.h>
#include <folly/io/async/ScopedEventBaseThread.h>

namespace folly {

ScopedBoundPort::ScopedBoundPort(IPAddress host) {
  ebth_ = std::make_unique<ScopedEventBaseThread>();
  ebth_->getEventBase()->runInEventBaseThreadAndWait([&] {
    sock_ = AsyncServerSocket::newSocket(ebth_->getEventBase());
    sock_->bind(SocketAddress(host, 0));
  });
}

ScopedBoundPort::~ScopedBoundPort() {
  ebth_->getEventBase()->runInEventBaseThread([sock = std::move(sock_)] {});
}

SocketAddress ScopedBoundPort::getAddress() const {
  return sock_->getAddress();
}
} // namespace folly

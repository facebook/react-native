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

#include <folly/io/async/test/ZeroCopy.h>

namespace folly {

// ZeroCopyTest
ZeroCopyTest::ZeroCopyTest(
    size_t numClients,
    int numLoops,
    bool zeroCopy,
    size_t bufferSize)
    : numClients_(numClients),
      counter_(numClients),
      numLoops_(numLoops),
      zeroCopy_(zeroCopy),
      bufferSize_(bufferSize),
      listenSock_(new folly::AsyncServerSocket(&evb_)),
      server_(&evb_, numLoops_, bufferSize_, zeroCopy) {
  clients_.reserve(numClients_);

  for (size_t i = 0; i < numClients_; i++) {
    clients_.emplace_back(std::make_unique<ZeroCopyTestAsyncSocket>(
        &counter_, &evb_, numLoops_, bufferSize_, zeroCopy));
  }
  if (listenSock_) {
    server_.addCallbackToServerSocket(*listenSock_);
  }
}

bool ZeroCopyTest::run() {
  evb_.runInEventBaseThread([this]() {
    if (listenSock_) {
      listenSock_->bind(0);
      listenSock_->setZeroCopy(zeroCopy_);
      listenSock_->listen(10);
      listenSock_->startAccepting();

      connectAll();
    }
  });

  evb_.loopForever();

  for (auto& client : clients_) {
    if (client->isZeroCopyWriteInProgress()) {
      return false;
    }
  }

  return true;
}

} // namespace folly

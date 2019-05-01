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
#include <folly/io/async/test/TestSSLServer.h>

namespace folly {

const char* kTestCert = "folly/io/async/test/certs/tests-cert.pem";
const char* kTestKey = "folly/io/async/test/certs/tests-key.pem";
const char* kTestCA = "folly/io/async/test/certs/ca-cert.pem";

const char* kClientTestCert = "folly/io/async/test/certs/client_cert.pem";
const char* kClientTestKey = "folly/io/async/test/certs/client_key.pem";
const char* kClientTestCA = "folly/io/async/test/certs/client_ca_cert.pem";

TestSSLServer::~TestSSLServer() {
  if (thread_.joinable()) {
    evb_.runInEventBaseThread([&]() { socket_->stopAccepting(); });
    LOG(INFO) << "Waiting for server thread to exit";
    thread_.join();
  }
}

TestSSLServer::TestSSLServer(SSLServerAcceptCallbackBase* acb, bool enableTFO)
    : acb_(acb) {
  // Set up a default SSL context
  ctx_ = std::make_shared<SSLContext>();
  ctx_->loadCertificate(kTestCert);
  ctx_->loadPrivateKey(kTestKey);
  ctx_->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  init(enableTFO);
}

void TestSSLServer::loadTestCerts() {
  ctx_->loadCertificate(kTestCert);
  ctx_->loadPrivateKey(kTestKey);
}

TestSSLServer::TestSSLServer(
    SSLServerAcceptCallbackBase* acb,
    std::shared_ptr<SSLContext> ctx,
    bool enableTFO)
    : ctx_(ctx), acb_(acb) {
  init(enableTFO);
}

void TestSSLServer::init(bool enableTFO) {
  socket_ = AsyncServerSocket::newSocket(&evb_);

  acb_->ctx_ = ctx_;
  acb_->base_ = &evb_;

  // Enable TFO
  if (enableTFO) {
    LOG(INFO) << "server TFO enabled";
    socket_->setTFOEnabled(true, 1000);
  }

  // set up the listening socket
  socket_->bind(0);
  socket_->getAddress(&address_);
  socket_->listen(100);
  socket_->addAcceptCallback(acb_, &evb_);
  socket_->startAccepting();

  thread_ = std::thread([&] {
    evb_.loop();
    acb_->detach();
    LOG(INFO) << "Server thread exited event loop";
  });
  LOG(INFO) << "Accepting connections on " << address_;
}
} // namespace folly

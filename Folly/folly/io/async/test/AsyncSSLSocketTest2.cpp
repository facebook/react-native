/*
 * Copyright 2012-present Facebook, Inc.
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
#include <folly/io/async/test/AsyncSSLSocketTest.h>

#include <folly/futures/Promise.h>
#include <folly/init/Init.h>
#include <folly/io/async/AsyncSSLSocket.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/SSLContext.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include <folly/portability/GTest.h>
#include <folly/portability/PThread.h>
#include <folly/ssl/Init.h>

using std::cerr;
using std::endl;
using std::list;
using std::min;
using std::string;
using std::vector;

namespace folly {

struct EvbAndContext {
  EvbAndContext() {
    ctx_.reset(new SSLContext());
    ctx_->setOptions(SSL_OP_NO_TICKET);
    ctx_->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  }

  std::shared_ptr<AsyncSSLSocket> createSocket() {
    return AsyncSSLSocket::newSocket(ctx_, getEventBase());
  }

  EventBase* getEventBase() {
    return evb_.getEventBase();
  }

  void attach(AsyncSSLSocket& socket) {
    socket.attachEventBase(getEventBase());
    socket.attachSSLContext(ctx_);
  }

  folly::ScopedEventBaseThread evb_;
  std::shared_ptr<SSLContext> ctx_;
};

class AttachDetachClient : public AsyncSocket::ConnectCallback,
                           public AsyncTransportWrapper::WriteCallback,
                           public AsyncTransportWrapper::ReadCallback {
 private:
  // two threads here - we'll create the socket in one, connect
  // in the other, and then read/write in the initial one
  EvbAndContext t1_;
  EvbAndContext t2_;
  std::shared_ptr<AsyncSSLSocket> sslSocket_;
  folly::SocketAddress address_;
  char buf_[128];
  char readbuf_[128];
  uint32_t bytesRead_;
  // promise to fulfill when done
  folly::Promise<bool> promise_;

  void detach() {
    sslSocket_->detachEventBase();
    sslSocket_->detachSSLContext();
  }

 public:
  explicit AttachDetachClient(const folly::SocketAddress& address)
      : address_(address), bytesRead_(0) {}

  Future<bool> getFuture() {
    return promise_.getFuture();
  }

  void connect() {
    // create in one and then move to another
    auto t1Evb = t1_.getEventBase();
    t1Evb->runInEventBaseThread([this] {
      sslSocket_ = t1_.createSocket();
      // ensure we can detach and reattach the context before connecting
      for (int i = 0; i < 1000; ++i) {
        sslSocket_->detachSSLContext();
        sslSocket_->attachSSLContext(t1_.ctx_);
      }
      // detach from t1 and connect in t2
      detach();
      auto t2Evb = t2_.getEventBase();
      t2Evb->runInEventBaseThread([this] {
        t2_.attach(*sslSocket_);
        sslSocket_->connect(this, address_);
      });
    });
  }

  void connectSuccess() noexcept override {
    auto t2Evb = t2_.getEventBase();
    EXPECT_TRUE(t2Evb->isInEventBaseThread());
    cerr << "client SSL socket connected" << endl;
    for (int i = 0; i < 1000; ++i) {
      sslSocket_->detachSSLContext();
      sslSocket_->attachSSLContext(t2_.ctx_);
    }

    // detach from t2 and then read/write in t1
    t2Evb->runInEventBaseThread([this] {
      detach();
      auto t1Evb = t1_.getEventBase();
      t1Evb->runInEventBaseThread([this] {
        t1_.attach(*sslSocket_);
        sslSocket_->write(this, buf_, sizeof(buf_));
        sslSocket_->setReadCB(this);
        memset(readbuf_, 'b', sizeof(readbuf_));
        bytesRead_ = 0;
      });
    });
  }

  void connectErr(const AsyncSocketException& ex) noexcept override {
    cerr << "AttachDetachClient::connectError: " << ex.what() << endl;
    sslSocket_.reset();
  }

  void writeSuccess() noexcept override {
    cerr << "client write success" << endl;
  }

  void writeErr(
      size_t /* bytesWritten */,
      const AsyncSocketException& ex) noexcept override {
    cerr << "client writeError: " << ex.what() << endl;
  }

  void getReadBuffer(void** bufReturn, size_t* lenReturn) override {
    *bufReturn = readbuf_ + bytesRead_;
    *lenReturn = sizeof(readbuf_) - bytesRead_;
  }
  void readEOF() noexcept override {
    cerr << "client readEOF" << endl;
  }

  void readErr(const AsyncSocketException& ex) noexcept override {
    cerr << "client readError: " << ex.what() << endl;
    promise_.setException(ex);
  }

  void readDataAvailable(size_t len) noexcept override {
    EXPECT_TRUE(t1_.getEventBase()->isInEventBaseThread());
    EXPECT_EQ(sslSocket_->getEventBase(), t1_.getEventBase());
    cerr << "client read data: " << len << endl;
    bytesRead_ += len;
    if (len == sizeof(buf_)) {
      EXPECT_EQ(memcmp(buf_, readbuf_, bytesRead_), 0);
      sslSocket_->closeNow();
      sslSocket_.reset();
      promise_.setValue(true);
    }
  }
};

/**
 * Test passing contexts between threads
 */
TEST(AsyncSSLSocketTest2, AttachDetachSSLContext) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallbackDelay acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  std::shared_ptr<AttachDetachClient> client(
      new AttachDetachClient(server.getAddress()));

  auto f = client->getFuture();
  client->connect();
  EXPECT_TRUE(std::move(f).within(std::chrono::seconds(3)).get());
}

class ConnectClient : public AsyncSocket::ConnectCallback {
 public:
  ConnectClient() = default;

  Future<bool> getFuture() {
    return promise_.getFuture();
  }

  void connect(const folly::SocketAddress& addr) {
    t1_.getEventBase()->runInEventBaseThread([&] {
      socket_ = t1_.createSocket();
      socket_->connect(this, addr);
    });
  }

  void connectSuccess() noexcept override {
    socket_.reset();
    promise_.setValue(true);
  }

  void connectErr(const AsyncSocketException& /* ex */) noexcept override {
    socket_.reset();
    promise_.setValue(false);
  }

  void setCtx(std::shared_ptr<SSLContext> ctx) {
    t1_.ctx_ = ctx;
  }

 private:
  EvbAndContext t1_;
  // promise to fulfill when done with a value of true if connect succeeded
  folly::Promise<bool> promise_;
  std::shared_ptr<AsyncSSLSocket> socket_;
};

class NoopReadCallback : public ReadCallbackBase {
 public:
  NoopReadCallback() : ReadCallbackBase(nullptr) {
    state = STATE_SUCCEEDED;
  }

  void getReadBuffer(void** buf, size_t* lenReturn) override {
    *buf = &buffer_;
    *lenReturn = 1;
  }
  void readDataAvailable(size_t) noexcept override {}

  uint8_t buffer_{0};
};

TEST(AsyncSSLSocketTest2, TestTLS12DefaultClient) {
  // Start listening on a local port
  NoopReadCallback readCallback;
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallbackDelay acceptCallback(&handshakeCallback);
  auto ctx = std::make_shared<SSLContext>(SSLContext::TLSv1_2);
  TestSSLServer server(&acceptCallback, ctx);
  server.loadTestCerts();

  // create a default client
  auto c1 = std::make_unique<ConnectClient>();
  auto f1 = c1->getFuture();
  c1->connect(server.getAddress());
  EXPECT_TRUE(std::move(f1).within(std::chrono::seconds(3)).get());
}

TEST(AsyncSSLSocketTest2, TestTLS12BadClient) {
  // Start listening on a local port
  NoopReadCallback readCallback;
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  SSLServerAcceptCallbackDelay acceptCallback(&handshakeCallback);
  auto ctx = std::make_shared<SSLContext>(SSLContext::TLSv1_2);
  TestSSLServer server(&acceptCallback, ctx);
  server.loadTestCerts();

  // create a client that doesn't speak TLS 1.2
  auto c2 = std::make_unique<ConnectClient>();
  auto clientCtx = std::make_shared<SSLContext>();
  clientCtx->setOptions(SSL_OP_NO_TLSv1_2);
  c2->setCtx(clientCtx);
  auto f2 = c2->getFuture();
  c2->connect(server.getAddress());
  EXPECT_FALSE(std::move(f2).within(std::chrono::seconds(3)).get());
}

} // namespace folly

int main(int argc, char* argv[]) {
  folly::ssl::init();
#ifdef SIGPIPE
  signal(SIGPIPE, SIG_IGN);
#endif
  testing::InitGoogleTest(&argc, argv);
  folly::init(&argc, &argv);
  return RUN_ALL_TESTS();
  OPENSSL_cleanup();
}

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

#include <folly/ssl/SSLSession.h>
#include <folly/io/async/test/AsyncSSLSocketTest.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>

#include <memory>

using namespace std;
using namespace testing;
using folly::ssl::SSLSession;

namespace folly {

void getfds(int fds[2]) {
  if (socketpair(PF_LOCAL, SOCK_STREAM, 0, fds) != 0) {
    LOG(ERROR) << "failed to create socketpair: " << errnoStr(errno);
  }
  for (int idx = 0; idx < 2; ++idx) {
    int flags = fcntl(fds[idx], F_GETFL, 0);
    if (flags == -1) {
      LOG(ERROR) << "failed to get flags for socket " << idx << ": "
                 << errnoStr(errno);
    }
    if (fcntl(fds[idx], F_SETFL, flags | O_NONBLOCK) != 0) {
      LOG(ERROR) << "failed to put socket " << idx
                 << " in non-blocking mode: " << errnoStr(errno);
    }
  }
}

void getctx(
    std::shared_ptr<folly::SSLContext> clientCtx,
    std::shared_ptr<folly::SSLContext> serverCtx) {
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadPrivateKey(kTestKey);
}

class SSLSessionTest : public testing::Test {
 public:
  void SetUp() override {
    clientCtx.reset(new folly::SSLContext());
    dfServerCtx.reset(new folly::SSLContext());
    hskServerCtx.reset(new folly::SSLContext());
    serverName = "xyz.newdev.facebook.com";
    getctx(clientCtx, dfServerCtx);
  }

  void TearDown() override {}

  folly::EventBase eventBase;
  std::shared_ptr<SSLContext> clientCtx;
  std::shared_ptr<SSLContext> dfServerCtx;
  // Use the same SSLContext to continue the handshake after
  // tlsext_hostname match.
  std::shared_ptr<SSLContext> hskServerCtx;
  std::string serverName;
};

/**
 * 1. Client sends TLSEXT_HOSTNAME in client hello.
 * 2. Server found a match SSL_CTX and use this SSL_CTX to
 *    continue the SSL handshake.
 * 3. Server sends back TLSEXT_HOSTNAME in server hello.
 */
TEST_F(SSLSessionTest, BasicTest) {
  std::unique_ptr<SSLSession> sess;

  {
    int fds[2];
    getfds(fds);
    AsyncSSLSocket::UniquePtr clientSock(
        new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
    auto clientPtr = clientSock.get();
    AsyncSSLSocket::UniquePtr serverSock(
        new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
    SSLHandshakeClient client(std::move(clientSock), false, false);
    SSLHandshakeServerParseClientHello server(
        std::move(serverSock), false, false);

    eventBase.loop();
    ASSERT_TRUE(client.handshakeSuccess_);

    sess = std::make_unique<SSLSession>(clientPtr->getSSLSession());
    ASSERT_NE(sess.get(), nullptr);
  }

  {
    int fds[2];
    getfds(fds);
    AsyncSSLSocket::UniquePtr clientSock(
        new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
    auto clientPtr = clientSock.get();
    clientSock->setSSLSession(sess->getRawSSLSessionDangerous(), true);
    AsyncSSLSocket::UniquePtr serverSock(
        new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
    SSLHandshakeClient client(std::move(clientSock), false, false);
    SSLHandshakeServerParseClientHello server(
        std::move(serverSock), false, false);

    eventBase.loop();
    ASSERT_TRUE(client.handshakeSuccess_);
    ASSERT_TRUE(clientPtr->getSSLSessionReused());
  }
}
TEST_F(SSLSessionTest, SerializeDeserializeTest) {
  std::string sessiondata;

  {
    int fds[2];
    getfds(fds);
    AsyncSSLSocket::UniquePtr clientSock(
        new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
    auto clientPtr = clientSock.get();
    AsyncSSLSocket::UniquePtr serverSock(
        new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
    SSLHandshakeClient client(std::move(clientSock), false, false);
    SSLHandshakeServerParseClientHello server(
        std::move(serverSock), false, false);

    eventBase.loop();
    ASSERT_TRUE(client.handshakeSuccess_);

    std::unique_ptr<SSLSession> sess =
        std::make_unique<SSLSession>(clientPtr->getSSLSession());
    sessiondata = sess->serialize();
    ASSERT_TRUE(!sessiondata.empty());
  }

  {
    int fds[2];
    getfds(fds);
    AsyncSSLSocket::UniquePtr clientSock(
        new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
    auto clientPtr = clientSock.get();
    std::unique_ptr<SSLSession> sess =
        std::make_unique<SSLSession>(sessiondata);
    ASSERT_NE(sess.get(), nullptr);
    clientSock->setSSLSession(sess->getRawSSLSessionDangerous(), true);
    AsyncSSLSocket::UniquePtr serverSock(
        new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
    SSLHandshakeClient client(std::move(clientSock), false, false);
    SSLHandshakeServerParseClientHello server(
        std::move(serverSock), false, false);

    eventBase.loop();
    ASSERT_TRUE(client.handshakeSuccess_);
    ASSERT_TRUE(clientPtr->getSSLSessionReused());
  }
}

TEST_F(SSLSessionTest, GetSessionID) {
  int fds[2];
  getfds(fds);
  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
  auto clientPtr = clientSock.get();
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  SSLHandshakeClient client(std::move(clientSock), false, false);
  SSLHandshakeServerParseClientHello server(
      std::move(serverSock), false, false);

  eventBase.loop();
  ASSERT_TRUE(client.handshakeSuccess_);

  std::unique_ptr<SSLSession> sess =
      std::make_unique<SSLSession>(clientPtr->getSSLSession());
  ASSERT_NE(sess, nullptr);
  auto sessID = sess->getSessionID();
  ASSERT_GE(sessID.length(), 0);
}
} // namespace folly

/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/SocketAddress.h>
#include <folly/String.h>
#include <folly/io/Cursor.h>
#include <folly/io/async/AsyncPipe.h>
#include <folly/io/async/AsyncSSLSocket.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/portability/OpenSSL.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Unistd.h>
#include <folly/ssl/Init.h>

#include <folly/io/async/test/BlockingSocket.h>

#include <dlfcn.h>
#include <fcntl.h>
#include <signal.h>
#include <sys/types.h>

#include <fstream>
#include <iostream>
#include <list>
#include <set>
#include <thread>

#if FOLLY_OPENSSL_IS_110
#include <openssl/async.h>
#endif

#ifdef FOLLY_HAVE_MSG_ERRQUEUE
#include <sys/utsname.h>
#endif

using std::cerr;
using std::endl;
using std::list;
using std::min;
using std::string;
using std::vector;

using namespace testing;

#if defined __linux__
namespace {

// to store libc's original setsockopt()
typedef int (*setsockopt_ptr)(int, int, int, const void*, socklen_t);
setsockopt_ptr real_setsockopt_ = nullptr;

// global struct to initialize before main runs. we can init within a test,
// or in main, but this method seems to be least intrsive and universal
struct GlobalStatic {
  GlobalStatic() {
    real_setsockopt_ = (setsockopt_ptr)dlsym(RTLD_NEXT, "setsockopt");
  }
  void reset() noexcept {
    ttlsDisabledSet.clear();
  }
  // for each fd, tracks whether TTLS is disabled or not
  std::set<int /* fd */> ttlsDisabledSet;
};

// the constructor will be called before main() which is all we care about
GlobalStatic globalStatic;

} // namespace

// we intercept setsoctopt to test setting NO_TRANSPARENT_TLS opt
// this name has to be global
int setsockopt(
    int sockfd,
    int level,
    int optname,
    const void* optval,
    socklen_t optlen) {
  if (optname == SO_NO_TRANSPARENT_TLS) {
    globalStatic.ttlsDisabledSet.insert(sockfd);
    return 0;
  }
  return real_setsockopt_(sockfd, level, optname, optval, optlen);
}
#endif

namespace folly {
uint32_t TestSSLAsyncCacheServer::asyncCallbacks_ = 0;
uint32_t TestSSLAsyncCacheServer::asyncLookups_ = 0;
uint32_t TestSSLAsyncCacheServer::lookupDelay_ = 0;

constexpr size_t SSLClient::kMaxReadBufferSz;
constexpr size_t SSLClient::kMaxReadsPerEvent;

void getfds(int fds[2]) {
  if (socketpair(PF_LOCAL, SOCK_STREAM, 0, fds) != 0) {
    FAIL() << "failed to create socketpair: " << errnoStr(errno);
  }
  for (int idx = 0; idx < 2; ++idx) {
    int flags = fcntl(fds[idx], F_GETFL, 0);
    if (flags == -1) {
      FAIL() << "failed to get flags for socket " << idx << ": "
             << errnoStr(errno);
    }
    if (fcntl(fds[idx], F_SETFL, flags | O_NONBLOCK) != 0) {
      FAIL() << "failed to put socket " << idx
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

void sslsocketpair(
    EventBase* eventBase,
    AsyncSSLSocket::UniquePtr* clientSock,
    AsyncSSLSocket::UniquePtr* serverSock) {
  auto clientCtx = std::make_shared<folly::SSLContext>();
  auto serverCtx = std::make_shared<folly::SSLContext>();
  int fds[2];
  getfds(fds);
  getctx(clientCtx, serverCtx);
  clientSock->reset(new AsyncSSLSocket(clientCtx, eventBase, fds[0], false));
  serverSock->reset(new AsyncSSLSocket(serverCtx, eventBase, fds[1], true));

  // (*clientSock)->setSendTimeout(100);
  // (*serverSock)->setSendTimeout(100);
}

// client protocol filters
bool clientProtoFilterPickPony(
    unsigned char** client,
    unsigned int* client_len,
    const unsigned char*,
    unsigned int) {
  // the protocol string in length prefixed byte string. the
  // length byte is not included in the length
  static unsigned char p[7] = {6, 'p', 'o', 'n', 'i', 'e', 's'};
  *client = p;
  *client_len = 7;
  return true;
}

bool clientProtoFilterPickNone(
    unsigned char**,
    unsigned int*,
    const unsigned char*,
    unsigned int) {
  return false;
}

std::string getFileAsBuf(const char* fileName) {
  std::string buffer;
  folly::readFile(fileName, buffer);
  return buffer;
}

/**
 * Test connecting to, writing to, reading from, and closing the
 * connection to the SSL server.
 */
TEST(AsyncSSLSocketTest, ConnectWriteReadClose) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  std::shared_ptr<SSLContext> sslContext(new SSLContext());
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  // sslContext->loadTrustedCertificates("./trusted-ca-certificate.pem");
  // sslContext->authenticate(true, false);

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open(std::chrono::milliseconds(10000));

  // write()
  uint8_t buf[128];
  memset(buf, 'a', sizeof(buf));
  socket->write(buf, sizeof(buf));

  // read()
  uint8_t readbuf[128];
  uint32_t bytesRead = socket->readAll(readbuf, sizeof(readbuf));
  EXPECT_EQ(bytesRead, 128);
  EXPECT_EQ(memcmp(buf, readbuf, bytesRead), 0);

  // close()
  socket->close();

  cerr << "ConnectWriteReadClose test completed" << endl;
  EXPECT_EQ(socket->getSSLSocket()->getTotalConnectTimeout().count(), 10000);
}

/**
 * Test reading after server close.
 */
TEST(AsyncSSLSocketTest, ReadAfterClose) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadEOFCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  auto server = std::make_unique<TestSSLServer>(&acceptCallback);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  auto socket =
      std::make_shared<BlockingSocket>(server->getAddress(), sslContext);
  socket->open();

  // This should trigger an EOF on the client.
  auto evb = handshakeCallback.getSocket()->getEventBase();
  evb->runInEventBaseThreadAndWait([&]() { handshakeCallback.closeSocket(); });
  std::array<uint8_t, 128> readbuf;
  auto bytesRead = socket->read(readbuf.data(), readbuf.size());
  EXPECT_EQ(0, bytesRead);
}

/**
 * Test bad renegotiation
 */
#if !defined(OPENSSL_IS_BORINGSSL)
TEST(AsyncSSLSocketTest, Renegotiate) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();
  std::array<int, 2> fds;
  getfds(fds.data());
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  SSLHandshakeClient client(std::move(clientSock), true, true);
  RenegotiatingServer server(std::move(serverSock));

  while (!client.handshakeSuccess_ && !client.handshakeError_) {
    eventBase.loopOnce();
  }

  ASSERT_TRUE(client.handshakeSuccess_);

  auto sslSock = std::move(client).moveSocket();
  sslSock->detachEventBase();
  // This is nasty, however we don't want to add support for
  // renegotiation in AsyncSSLSocket.
  SSL_renegotiate(const_cast<SSL*>(sslSock->getSSL()));

  auto socket = std::make_shared<BlockingSocket>(std::move(sslSock));

  std::thread t([&]() { eventBase.loopForever(); });

  // Trigger the renegotiation.
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  try {
    socket->write(buf.data(), buf.size());
  } catch (AsyncSocketException& e) {
    LOG(INFO) << "client got error " << e.what();
  }
  eventBase.terminateLoopSoon();
  t.join();

  eventBase.loop();
  ASSERT_TRUE(server.renegotiationError_);
}
#endif

/**
 * Negative test for handshakeError().
 */
TEST(AsyncSSLSocketTest, HandshakeError) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  WriteErrorCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  HandshakeErrorCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  std::shared_ptr<SSLContext> sslContext(new SSLContext());
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  // read()
  bool ex = false;
  try {
    socket->open();

    uint8_t readbuf[128];
    uint32_t bytesRead = socket->readAll(readbuf, sizeof(readbuf));
    LOG(ERROR) << "readAll returned " << bytesRead << " instead of throwing";
  } catch (AsyncSocketException&) {
    ex = true;
  }
  EXPECT_TRUE(ex);

  // close()
  socket->close();
  cerr << "HandshakeError test completed" << endl;
}

/**
 * Negative test for readError().
 */
TEST(AsyncSSLSocketTest, ReadError) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadErrorCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  std::shared_ptr<SSLContext> sslContext(new SSLContext());
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open();

  // write something to trigger ssl handshake
  uint8_t buf[128];
  memset(buf, 'a', sizeof(buf));
  socket->write(buf, sizeof(buf));

  socket->close();
  cerr << "ReadError test completed" << endl;
}

/**
 * Negative test for writeError().
 */
TEST(AsyncSSLSocketTest, WriteError) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  WriteErrorCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  std::shared_ptr<SSLContext> sslContext(new SSLContext());
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open();

  // write something to trigger ssl handshake
  uint8_t buf[128];
  memset(buf, 'a', sizeof(buf));
  socket->write(buf, sizeof(buf));

  socket->close();
  cerr << "WriteError test completed" << endl;
}

/**
 * Test a socket with TCP_NODELAY unset.
 */
TEST(AsyncSSLSocketTest, SocketWithDelay) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallbackDelay acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  std::shared_ptr<SSLContext> sslContext(new SSLContext());
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open();

  // write()
  uint8_t buf[128];
  memset(buf, 'a', sizeof(buf));
  socket->write(buf, sizeof(buf));

  // read()
  uint8_t readbuf[128];
  uint32_t bytesRead = socket->readAll(readbuf, sizeof(readbuf));
  EXPECT_EQ(bytesRead, 128);
  EXPECT_EQ(memcmp(buf, readbuf, bytesRead), 0);

  // close()
  socket->close();

  cerr << "SocketWithDelay test completed" << endl;
}

#if FOLLY_OPENSSL_HAS_ALPN
class NextProtocolTest : public Test {
  // For matching protos
 public:
  void SetUp() override {
    getctx(clientCtx, serverCtx);
  }

  void connect(bool unset = false) {
    getfds(fds);

    if (unset) {
      // unsetting NPN for any of [client, server] is enough to make NPN not
      // work
      clientCtx->unsetNextProtocols();
    }

    AsyncSSLSocket::UniquePtr clientSock(
        new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
    AsyncSSLSocket::UniquePtr serverSock(
        new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));
    client = std::make_unique<AlpnClient>(std::move(clientSock));
    server = std::make_unique<AlpnServer>(std::move(serverSock));

    eventBase.loop();
  }

  void expectProtocol(const std::string& proto) {
    expectHandshakeSuccess();
    EXPECT_NE(client->nextProtoLength, 0);
    EXPECT_EQ(client->nextProtoLength, server->nextProtoLength);
    EXPECT_EQ(
        memcmp(client->nextProto, server->nextProto, server->nextProtoLength),
        0);
    string selected((const char*)client->nextProto, client->nextProtoLength);
    EXPECT_EQ(proto, selected);
  }

  void expectNoProtocol() {
    expectHandshakeSuccess();
    EXPECT_EQ(client->nextProtoLength, 0);
    EXPECT_EQ(server->nextProtoLength, 0);
    EXPECT_EQ(client->nextProto, nullptr);
    EXPECT_EQ(server->nextProto, nullptr);
  }

  void expectHandshakeSuccess() {
    EXPECT_FALSE(client->except.hasValue())
        << "client handshake error: " << client->except->what();
    EXPECT_FALSE(server->except.hasValue())
        << "server handshake error: " << server->except->what();
  }

  void expectHandshakeError() {
    EXPECT_TRUE(client->except.hasValue())
        << "Expected client handshake error!";
    EXPECT_TRUE(server->except.hasValue())
        << "Expected server handshake error!";
  }

  EventBase eventBase;
  std::shared_ptr<SSLContext> clientCtx{std::make_shared<SSLContext>()};
  std::shared_ptr<SSLContext> serverCtx{std::make_shared<SSLContext>()};
  int fds[2];
  std::unique_ptr<AlpnClient> client;
  std::unique_ptr<AlpnServer> server;
};

TEST_F(NextProtocolTest, AlpnTestOverlap) {
  clientCtx->setAdvertisedNextProtocols({"blub", "baz"});
  serverCtx->setAdvertisedNextProtocols({"foo", "bar", "baz"});

  connect();

  expectProtocol("baz");
}

TEST_F(NextProtocolTest, AlpnTestUnset) {
  // Identical to above test, except that we want unset NPN before
  // looping.
  clientCtx->setAdvertisedNextProtocols({"blub", "baz"});
  serverCtx->setAdvertisedNextProtocols({"foo", "bar", "baz"});

  connect(true /* unset */);

  expectNoProtocol();
}

TEST_F(NextProtocolTest, AlpnTestNoOverlap) {
  clientCtx->setAdvertisedNextProtocols({"blub"});
  serverCtx->setAdvertisedNextProtocols({"foo", "bar", "baz"});
  connect();

  expectNoProtocol();
}

TEST_F(NextProtocolTest, RandomizedAlpnTest) {
  // Probability that this test will fail is 2^-64, which could be considered
  // as negligible.
  const int kTries = 64;

  clientCtx->setAdvertisedNextProtocols({"foo", "bar", "baz"});
  serverCtx->setRandomizedAdvertisedNextProtocols({{1, {"foo"}}, {1, {"bar"}}});

  std::set<string> selectedProtocols;
  for (int i = 0; i < kTries; ++i) {
    connect();

    EXPECT_NE(client->nextProtoLength, 0);
    EXPECT_EQ(client->nextProtoLength, server->nextProtoLength);
    EXPECT_EQ(
        memcmp(client->nextProto, server->nextProto, server->nextProtoLength),
        0);
    string selected((const char*)client->nextProto, client->nextProtoLength);
    selectedProtocols.insert(selected);
    expectHandshakeSuccess();
  }
  EXPECT_EQ(selectedProtocols.size(), 2);
}
#endif

#ifndef OPENSSL_NO_TLSEXT
/**
 * 1. Client sends TLSEXT_HOSTNAME in client hello.
 * 2. Server found a match SSL_CTX and use this SSL_CTX to
 *    continue the SSL handshake.
 * 3. Server sends back TLSEXT_HOSTNAME in server hello.
 */
TEST(AsyncSSLSocketTest, SNITestMatch) {
  EventBase eventBase;
  std::shared_ptr<SSLContext> clientCtx(new SSLContext);
  std::shared_ptr<SSLContext> dfServerCtx(new SSLContext);
  // Use the same SSLContext to continue the handshake after
  // tlsext_hostname match.
  std::shared_ptr<SSLContext> hskServerCtx(dfServerCtx);
  const std::string serverName("xyz.newdev.facebook.com");
  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  SNIClient client(std::move(clientSock));
  SNIServer server(
      std::move(serverSock), dfServerCtx, hskServerCtx, serverName);

  eventBase.loop();

  EXPECT_TRUE(client.serverNameMatch);
  EXPECT_TRUE(server.serverNameMatch);
}

/**
 * 1. Client sends TLSEXT_HOSTNAME in client hello.
 * 2. Server cannot find a matching SSL_CTX and continue to use
 *    the current SSL_CTX to do the handshake.
 * 3. Server does not send back TLSEXT_HOSTNAME in server hello.
 */
TEST(AsyncSSLSocketTest, SNITestNotMatch) {
  EventBase eventBase;
  std::shared_ptr<SSLContext> clientCtx(new SSLContext);
  std::shared_ptr<SSLContext> dfServerCtx(new SSLContext);
  // Use the same SSLContext to continue the handshake after
  // tlsext_hostname match.
  std::shared_ptr<SSLContext> hskServerCtx(dfServerCtx);
  const std::string clientRequestingServerName("foo.com");
  const std::string serverExpectedServerName("xyz.newdev.facebook.com");

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSock(new AsyncSSLSocket(
      clientCtx, &eventBase, fds[0], clientRequestingServerName));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  SNIClient client(std::move(clientSock));
  SNIServer server(
      std::move(serverSock),
      dfServerCtx,
      hskServerCtx,
      serverExpectedServerName);

  eventBase.loop();

  EXPECT_TRUE(!client.serverNameMatch);
  EXPECT_TRUE(!server.serverNameMatch);
}
/**
 * 1. Client sends TLSEXT_HOSTNAME in client hello.
 * 2. We then change the serverName.
 * 3. We expect that we get 'false' as the result for serNameMatch.
 */

TEST(AsyncSSLSocketTest, SNITestChangeServerName) {
  EventBase eventBase;
  std::shared_ptr<SSLContext> clientCtx(new SSLContext);
  std::shared_ptr<SSLContext> dfServerCtx(new SSLContext);
  // Use the same SSLContext to continue the handshake after
  // tlsext_hostname match.
  std::shared_ptr<SSLContext> hskServerCtx(dfServerCtx);
  const std::string serverName("xyz.newdev.facebook.com");
  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], serverName));
  // Change the server name
  std::string newName("new.com");
  clientSock->setServerName(newName);
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  SNIClient client(std::move(clientSock));
  SNIServer server(
      std::move(serverSock), dfServerCtx, hskServerCtx, serverName);

  eventBase.loop();

  EXPECT_TRUE(!client.serverNameMatch);
}

/**
 * 1. Client does not send TLSEXT_HOSTNAME in client hello.
 * 2. Server does not send back TLSEXT_HOSTNAME in server hello.
 */
TEST(AsyncSSLSocketTest, SNITestClientHelloNoHostname) {
  EventBase eventBase;
  std::shared_ptr<SSLContext> clientCtx(new SSLContext);
  std::shared_ptr<SSLContext> dfServerCtx(new SSLContext);
  // Use the same SSLContext to continue the handshake after
  // tlsext_hostname match.
  std::shared_ptr<SSLContext> hskServerCtx(dfServerCtx);
  const std::string serverExpectedServerName("xyz.newdev.facebook.com");

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  SNIClient client(std::move(clientSock));
  SNIServer server(
      std::move(serverSock),
      dfServerCtx,
      hskServerCtx,
      serverExpectedServerName);

  eventBase.loop();

  EXPECT_TRUE(!client.serverNameMatch);
  EXPECT_TRUE(!server.serverNameMatch);
}

#endif
/**
 * Test SSL client socket
 */
TEST(AsyncSSLSocketTest, SSLClientTest) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallbackDelay acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL client
  EventBase eventBase;
  auto client = std::make_shared<SSLClient>(&eventBase, server.getAddress(), 1);

  client->connect();
  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  EXPECT_EQ(client->getMiss(), 1);
  EXPECT_EQ(client->getHit(), 0);

  cerr << "SSLClientTest test completed" << endl;
}

/**
 * Test SSL client socket session re-use
 */
TEST(AsyncSSLSocketTest, SSLClientTestReuse) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallbackDelay acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL client
  EventBase eventBase;
  auto client =
      std::make_shared<SSLClient>(&eventBase, server.getAddress(), 10);

  client->connect();
  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  EXPECT_EQ(client->getMiss(), 1);
  EXPECT_EQ(client->getHit(), 9);

  cerr << "SSLClientTestReuse test completed" << endl;
}

/**
 * Test SSL client socket timeout
 */
TEST(AsyncSSLSocketTest, SSLClientTimeoutTest) {
  // Start listening on a local port
  EmptyReadCallback readCallback;
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  HandshakeTimeoutCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL client
  EventBase eventBase;
  auto client =
      std::make_shared<SSLClient>(&eventBase, server.getAddress(), 1, 10);
  client->connect(true /* write before connect completes */);
  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  usleep(100000);
  // This is checking that the connectError callback precedes any queued
  // writeError callbacks.  This matches AsyncSocket's behavior
  EXPECT_EQ(client->getWriteAfterConnectErrors(), 1);
  EXPECT_EQ(client->getErrors(), 1);
  EXPECT_EQ(client->getMiss(), 0);
  EXPECT_EQ(client->getHit(), 0);

  cerr << "SSLClientTimeoutTest test completed" << endl;
}

// The next 3 tests need an FB-only extension, and will fail without it
#ifdef SSL_ERROR_WANT_SESS_CACHE_LOOKUP
/**
 * Test SSL server async cache
 */
TEST(AsyncSSLSocketTest, SSLServerAsyncCacheTest) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAsyncCacheAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLAsyncCacheServer server(&acceptCallback);

  // Set up SSL client
  EventBase eventBase;
  auto client =
      std::make_shared<SSLClient>(&eventBase, server.getAddress(), 10, 500);

  client->connect();
  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  EXPECT_EQ(server.getAsyncCallbacks(), 18);
  EXPECT_EQ(server.getAsyncLookups(), 9);
  EXPECT_EQ(client->getMiss(), 10);
  EXPECT_EQ(client->getHit(), 0);

  cerr << "SSLServerAsyncCacheTest test completed" << endl;
}

/**
 * Test SSL server accept timeout with cache path
 */
TEST(AsyncSSLSocketTest, SSLServerTimeoutTest) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback, 50);
  TestSSLAsyncCacheServer server(&acceptCallback);

  // Set up SSL client
  EventBase eventBase;
  // only do a TCP connect
  std::shared_ptr<AsyncSocket> sock = AsyncSocket::newSocket(&eventBase);
  sock->connect(nullptr, server.getAddress());

  EmptyReadCallback clientReadCallback;
  clientReadCallback.tcpSocket_ = sock;
  sock->setReadCB(&clientReadCallback);

  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  EXPECT_EQ(readCallback.state, STATE_WAITING);

  cerr << "SSLServerTimeoutTest test completed" << endl;
}

/**
 * Test SSL server accept timeout with cache path
 */
TEST(AsyncSSLSocketTest, SSLServerAsyncCacheTimeoutTest) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAsyncCacheAcceptCallback acceptCallback(&handshakeCallback, 50);
  TestSSLAsyncCacheServer server(&acceptCallback);

  // Set up SSL client
  EventBase eventBase;
  auto client = std::make_shared<SSLClient>(&eventBase, server.getAddress(), 2);

  client->connect();
  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  EXPECT_EQ(server.getAsyncCallbacks(), 1);
  EXPECT_EQ(server.getAsyncLookups(), 1);
  EXPECT_EQ(client->getErrors(), 1);
  EXPECT_EQ(client->getMiss(), 1);
  EXPECT_EQ(client->getHit(), 0);

  cerr << "SSLServerAsyncCacheTimeoutTest test completed" << endl;
}

/**
 * Test SSL server accept timeout with cache path
 */
TEST(AsyncSSLSocketTest, SSLServerCacheCloseTest) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  SSLServerAsyncCacheAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLAsyncCacheServer server(&acceptCallback, 500);

  // Set up SSL client
  EventBase eventBase;
  auto client =
      std::make_shared<SSLClient>(&eventBase, server.getAddress(), 2, 100);

  client->connect();
  EventBaseAborter eba(&eventBase, 3000);
  eventBase.loop();

  server.getEventBase().runInEventBaseThread(
      [&handshakeCallback] { handshakeCallback.closeSocket(); });
  // give time for the cache lookup to come back and find it closed
  handshakeCallback.waitForHandshake();

  EXPECT_EQ(server.getAsyncCallbacks(), 1);
  EXPECT_EQ(server.getAsyncLookups(), 1);
  EXPECT_EQ(client->getErrors(), 1);
  EXPECT_EQ(client->getMiss(), 1);
  EXPECT_EQ(client->getHit(), 0);

  cerr << "SSLServerCacheCloseTest test completed" << endl;
}
#endif // !SSL_ERROR_WANT_SESS_CACHE_LOOKUP

/**
 * Verify Client Ciphers obtained using SSL MSG Callback.
 */
TEST(AsyncSSLSocketTest, SSLParseClientHelloSuccess) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  serverCtx->ciphers("ECDHE-RSA-AES128-SHA:AES128-SHA:AES256-SHA");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("AES256-SHA:AES128-SHA");
  clientCtx->loadPrivateKey(kTestKey);
  clientCtx->loadCertificate(kTestCert);
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServerParseClientHello server(std::move(serverSock), true, true);

  eventBase.loop();

#if defined(OPENSSL_IS_BORINGSSL)
  EXPECT_EQ(server.clientCiphers_, "AES256-SHA:AES128-SHA");
#else
  EXPECT_EQ(server.clientCiphers_, "AES256-SHA:AES128-SHA:00ff");
#endif
  EXPECT_EQ(server.chosenCipher_, "AES256-SHA");
  EXPECT_TRUE(client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(!client.handshakeError_);
  EXPECT_TRUE(server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_TRUE(!server.handshakeError_);
}

/**
 * Verify that server is able to get client cert by getPeerCert() API.
 */
TEST(AsyncSSLSocketTest, GetClientCertificate) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  serverCtx->ciphers("ECDHE-RSA-AES128-SHA:AES128-SHA:AES256-SHA");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kClientTestCA);
  serverCtx->loadClientCAList(kClientTestCA);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("AES256-SHA:AES128-SHA");
  clientCtx->loadPrivateKey(kClientTestKey);
  clientCtx->loadCertificate(kClientTestCert);
  clientCtx->loadTrustedCertificates(kTestCA);

  std::array<int, 2> fds;
  getfds(fds.data());

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServerParseClientHello server(std::move(serverSock), true, true);

  eventBase.loop();

  // Handshake should succeed.
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeSuccess_);

  // Reclaim the sockets from SSLHandshakeBase.
  auto cliSocket = std::move(client).moveSocket();
  auto srvSocket = std::move(server).moveSocket();

  // Client cert retrieved from server side.
  folly::ssl::X509UniquePtr serverPeerCert = srvSocket->getPeerCert();
  CHECK(serverPeerCert);

  // Client cert retrieved from client side.
  const X509* clientSelfCert = cliSocket->getSelfCert();
  CHECK(clientSelfCert);

  // The two certs should be the same.
  EXPECT_EQ(0, X509_cmp(clientSelfCert, serverPeerCert.get()));
}

TEST(AsyncSSLSocketTest, SSLParseClientHelloOnePacket) {
  EventBase eventBase;
  auto ctx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);

  int bufLen = 42;
  uint8_t majorVersion = 18;
  uint8_t minorVersion = 25;

  // Create callback buf
  auto buf = IOBuf::create(bufLen);
  buf->append(bufLen);
  folly::io::RWPrivateCursor cursor(buf.get());
  cursor.write<uint8_t>(SSL3_MT_CLIENT_HELLO);
  cursor.write<uint16_t>(0);
  cursor.write<uint8_t>(38);
  cursor.write<uint8_t>(majorVersion);
  cursor.write<uint8_t>(minorVersion);
  cursor.skip(32);
  cursor.write<uint32_t>(0);

  SSL* ssl = ctx->createSSL();
  SCOPE_EXIT {
    SSL_free(ssl);
  };
  AsyncSSLSocket::UniquePtr sock(
      new AsyncSSLSocket(ctx, &eventBase, fds[0], true));
  sock->enableClientHelloParsing();

  // Test client hello parsing in one packet
  AsyncSSLSocket::clientHelloParsingCallback(
      0, 0, SSL3_RT_HANDSHAKE, buf->data(), buf->length(), ssl, sock.get());
  buf.reset();

  auto parsedClientHello = sock->getClientHelloInfo();
  EXPECT_TRUE(parsedClientHello != nullptr);
  EXPECT_EQ(parsedClientHello->clientHelloMajorVersion_, majorVersion);
  EXPECT_EQ(parsedClientHello->clientHelloMinorVersion_, minorVersion);
}

TEST(AsyncSSLSocketTest, SSLParseClientHelloTwoPackets) {
  EventBase eventBase;
  auto ctx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);

  int bufLen = 42;
  uint8_t majorVersion = 18;
  uint8_t minorVersion = 25;

  // Create callback buf
  auto buf = IOBuf::create(bufLen);
  buf->append(bufLen);
  folly::io::RWPrivateCursor cursor(buf.get());
  cursor.write<uint8_t>(SSL3_MT_CLIENT_HELLO);
  cursor.write<uint16_t>(0);
  cursor.write<uint8_t>(38);
  cursor.write<uint8_t>(majorVersion);
  cursor.write<uint8_t>(minorVersion);
  cursor.skip(32);
  cursor.write<uint32_t>(0);

  SSL* ssl = ctx->createSSL();
  SCOPE_EXIT {
    SSL_free(ssl);
  };
  AsyncSSLSocket::UniquePtr sock(
      new AsyncSSLSocket(ctx, &eventBase, fds[0], true));
  sock->enableClientHelloParsing();

  // Test parsing with two packets with first packet size < 3
  auto bufCopy = folly::IOBuf::copyBuffer(buf->data(), 2);
  AsyncSSLSocket::clientHelloParsingCallback(
      0,
      0,
      SSL3_RT_HANDSHAKE,
      bufCopy->data(),
      bufCopy->length(),
      ssl,
      sock.get());
  bufCopy.reset();
  bufCopy = folly::IOBuf::copyBuffer(buf->data() + 2, buf->length() - 2);
  AsyncSSLSocket::clientHelloParsingCallback(
      0,
      0,
      SSL3_RT_HANDSHAKE,
      bufCopy->data(),
      bufCopy->length(),
      ssl,
      sock.get());
  bufCopy.reset();

  auto parsedClientHello = sock->getClientHelloInfo();
  EXPECT_TRUE(parsedClientHello != nullptr);
  EXPECT_EQ(parsedClientHello->clientHelloMajorVersion_, majorVersion);
  EXPECT_EQ(parsedClientHello->clientHelloMinorVersion_, minorVersion);
}

TEST(AsyncSSLSocketTest, SSLParseClientHelloMultiplePackets) {
  EventBase eventBase;
  auto ctx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);

  int bufLen = 42;
  uint8_t majorVersion = 18;
  uint8_t minorVersion = 25;

  // Create callback buf
  auto buf = IOBuf::create(bufLen);
  buf->append(bufLen);
  folly::io::RWPrivateCursor cursor(buf.get());
  cursor.write<uint8_t>(SSL3_MT_CLIENT_HELLO);
  cursor.write<uint16_t>(0);
  cursor.write<uint8_t>(38);
  cursor.write<uint8_t>(majorVersion);
  cursor.write<uint8_t>(minorVersion);
  cursor.skip(32);
  cursor.write<uint32_t>(0);

  SSL* ssl = ctx->createSSL();
  SCOPE_EXIT {
    SSL_free(ssl);
  };
  AsyncSSLSocket::UniquePtr sock(
      new AsyncSSLSocket(ctx, &eventBase, fds[0], true));
  sock->enableClientHelloParsing();

  // Test parsing with multiple small packets
  for (std::size_t i = 0; i < buf->length(); i += 3) {
    auto bufCopy = folly::IOBuf::copyBuffer(
        buf->data() + i, std::min((std::size_t)3, buf->length() - i));
    AsyncSSLSocket::clientHelloParsingCallback(
        0,
        0,
        SSL3_RT_HANDSHAKE,
        bufCopy->data(),
        bufCopy->length(),
        ssl,
        sock.get());
    bufCopy.reset();
  }

  auto parsedClientHello = sock->getClientHelloInfo();
  EXPECT_TRUE(parsedClientHello != nullptr);
  EXPECT_EQ(parsedClientHello->clientHelloMajorVersion_, majorVersion);
  EXPECT_EQ(parsedClientHello->clientHelloMinorVersion_, minorVersion);
}

/**
 * Verify sucessful behavior of SSL certificate validation.
 */
TEST(AsyncSSLSocketTest, SSLHandshakeValidationSuccess) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  dfServerCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  clientCtx->loadTrustedCertificates(kTestCA);

  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_TRUE(client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(!client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(!server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_TRUE(!server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Verify that the client's verification callback is able to fail SSL
 * connection establishment.
 */
TEST(AsyncSSLSocketTest, SSLHandshakeValidationFailure) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  dfServerCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), true, false);
  clientCtx->loadTrustedCertificates(kTestCA);

  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_TRUE(client.handshakeVerify_);
  EXPECT_TRUE(!client.handshakeSuccess_);
  EXPECT_TRUE(client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(!server.handshakeVerify_);
  EXPECT_TRUE(!server.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Verify that the options in SSLContext can be overridden in
 * sslConnect/Accept.i.e specifying that no validation should be performed
 * allows an otherwise-invalid certificate to be accepted and doesn't fire
 * the validation callback.
 */
TEST(AsyncSSLSocketTest, OverrideSSLCtxDisableVerify) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  dfServerCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));

  SSLHandshakeClientNoVerify client(std::move(clientSock), false, false);
  clientCtx->loadTrustedCertificates(kTestCA);

  SSLHandshakeServerNoVerify server(std::move(serverSock), false, false);

  eventBase.loop();

  EXPECT_TRUE(!client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(!client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(!server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_TRUE(!server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Verify that the options in SSLContext can be overridden in
 * sslConnect/Accept. Enable verification even if context says otherwise.
 * Test requireClientCert with client cert
 */
TEST(AsyncSSLSocketTest, OverrideSSLCtxEnableVerify) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  clientCtx->loadPrivateKey(kTestKey);
  clientCtx->loadCertificate(kTestCert);
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClientDoVerify client(std::move(clientSock), true, true);
  SSLHandshakeServerDoVerify server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_TRUE(client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_FALSE(client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_FALSE(server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Verify that the client's verification callback is able to override
 * the preverification failure and allow a successful connection.
 */
TEST(AsyncSSLSocketTest, SSLHandshakeValidationOverride) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  dfServerCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), false, true);
  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_TRUE(client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(!client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(!server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_TRUE(!server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Verify that specifying that no validation should be performed allows an
 * otherwise-invalid certificate to be accepted and doesn't fire the validation
 * callback.
 */
TEST(AsyncSSLSocketTest, SSLHandshakeValidationSkip) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();

  int fds[2];
  getfds(fds);
  getctx(clientCtx, dfServerCtx);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  dfServerCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), false, false);
  SSLHandshakeServer server(std::move(serverSock), false, false);

  eventBase.loop();

  EXPECT_TRUE(!client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(!client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(!server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_TRUE(!server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Test requireClientCert with client cert
 */
TEST(AsyncSSLSocketTest, ClientCertHandshakeSuccess) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->setVerificationOption(
      SSLContext::SSLVerifyPeerEnum::VERIFY_REQ_CLIENT_CERT);
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  clientCtx->loadPrivateKey(kTestKey);
  clientCtx->loadCertificate(kTestCert);
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_TRUE(client.handshakeVerify_);
  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_FALSE(client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(server.handshakeVerify_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_FALSE(server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());

  // check certificates
  auto clientSsl = std::move(client).moveSocket();
  auto serverSsl = std::move(server).moveSocket();

  auto clientPeer = clientSsl->getPeerCertificate();
  auto clientSelf = clientSsl->getSelfCertificate();
  auto serverPeer = serverSsl->getPeerCertificate();
  auto serverSelf = serverSsl->getSelfCertificate();

  EXPECT_NE(clientPeer, nullptr);
  EXPECT_NE(clientSelf, nullptr);
  EXPECT_NE(serverPeer, nullptr);
  EXPECT_NE(serverSelf, nullptr);

  EXPECT_EQ(clientPeer->getIdentity(), serverSelf->getIdentity());
  EXPECT_EQ(clientSelf->getIdentity(), serverPeer->getIdentity());
}

/**
 * Test requireClientCert with no client cert
 */
TEST(AsyncSSLSocketTest, NoClientCertHandshakeError) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->setVerificationOption(
      SSLContext::SSLVerifyPeerEnum::VERIFY_REQ_CLIENT_CERT);
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);
  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), false, false);
  SSLHandshakeServer server(std::move(serverSock), false, false);

  eventBase.loop();

  EXPECT_FALSE(server.handshakeVerify_);
  EXPECT_FALSE(server.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_LE(0, server.handshakeTime.count());
}

/**
 * Test OpenSSL 1.1.0's async functionality
 */
#if FOLLY_OPENSSL_IS_110

static void makeNonBlockingPipe(int pipefds[2]) {
  if (pipe(pipefds) != 0) {
    throw std::runtime_error("Cannot create pipe");
  }
  if (::fcntl(pipefds[0], F_SETFL, O_NONBLOCK) != 0) {
    throw std::runtime_error("Cannot set pipe to nonblocking");
  }
  if (::fcntl(pipefds[1], F_SETFL, O_NONBLOCK) != 0) {
    throw std::runtime_error("Cannot set pipe to nonblocking");
  }
}

// Custom RSA private key encryption method
static int kRSAExIndex = -1;
static int kRSAEvbExIndex = -1;
static int kRSASocketExIndex = -1;
static constexpr StringPiece kEngineId = "AsyncSSLSocketTest";

static int customRsaPrivEnc(
    int flen,
    const unsigned char* from,
    unsigned char* to,
    RSA* rsa,
    int padding) {
  LOG(INFO) << "rsa_priv_enc";
  EventBase* asyncJobEvb =
      reinterpret_cast<EventBase*>(RSA_get_ex_data(rsa, kRSAEvbExIndex));
  CHECK(asyncJobEvb);

  RSA* actualRSA = reinterpret_cast<RSA*>(RSA_get_ex_data(rsa, kRSAExIndex));
  CHECK(actualRSA);

  AsyncSSLSocket* socket = reinterpret_cast<AsyncSSLSocket*>(
      RSA_get_ex_data(rsa, kRSASocketExIndex));

  ASYNC_JOB* job = ASYNC_get_current_job();
  if (job == nullptr) {
    throw std::runtime_error("Expected call in job context");
  }
  ASYNC_WAIT_CTX* waitctx = ASYNC_get_wait_ctx(job);
  OSSL_ASYNC_FD pipefds[2] = {0, 0};
  makeNonBlockingPipe(pipefds);
  if (!ASYNC_WAIT_CTX_set_wait_fd(
          waitctx, kEngineId.data(), pipefds[0], nullptr, nullptr)) {
    throw std::runtime_error("Cannot set wait fd");
  }
  int ret = 0;
  int* retptr = &ret;

  auto asyncPipeWriter =
      folly::AsyncPipeWriter::newWriter(asyncJobEvb, pipefds[1]);

  asyncJobEvb->runInEventBaseThread([retptr = retptr,
                                     flen = flen,
                                     from = from,
                                     to = to,
                                     padding = padding,
                                     actualRSA = actualRSA,
                                     writer = std::move(asyncPipeWriter),
                                     socket = socket]() {
    LOG(INFO) << "Running job";
    if (socket) {
      LOG(INFO) << "Got a socket passed in, closing it...";
      socket->closeNow();
    }
    *retptr = RSA_meth_get_priv_enc(RSA_PKCS1_OpenSSL())(
        flen, from, to, actualRSA, padding);
    LOG(INFO) << "Finished job, writing to pipe";
    uint8_t byte = *retptr > 0 ? 1 : 0;
    writer->write(nullptr, &byte, 1);
  });

  LOG(INFO) << "About to pause job";

  ASYNC_pause_job();
  LOG(INFO) << "Resumed job with ret: " << ret;
  return ret;
}

void rsaFree(void*, void* ptr, CRYPTO_EX_DATA*, int, long, void*) {
  LOG(INFO) << "RSA_free is called with ptr " << std::hex << ptr;
  if (ptr == nullptr) {
    LOG(INFO) << "Returning early from rsaFree because ptr is null";
    return;
  }
  RSA* rsa = (RSA*)ptr;
  auto meth = RSA_get_method(rsa);
  if (meth != RSA_get_default_method()) {
    auto nonconst = const_cast<RSA_METHOD*>(meth);
    RSA_meth_free(nonconst);
    RSA_set_method(rsa, RSA_get_default_method());
  }
  RSA_free(rsa);
}

struct RSAPointers {
  RSA* actualrsa{nullptr};
  RSA* dummyrsa{nullptr};
  RSA_METHOD* meth{nullptr};
};

inline void RSAPointersFree(RSAPointers* p) {
  if (p->meth && p->dummyrsa && RSA_get_method(p->dummyrsa) == p->meth) {
    RSA_set_method(p->dummyrsa, RSA_get_default_method());
  }

  if (p->meth) {
    LOG(INFO) << "Freeing meth";
    RSA_meth_free(p->meth);
  }

  if (p->actualrsa) {
    LOG(INFO) << "Freeing actualrsa";
    RSA_free(p->actualrsa);
  }

  if (p->dummyrsa) {
    LOG(INFO) << "Freeing dummyrsa";
    RSA_free(p->dummyrsa);
  }

  delete p;
}

using RSAPointersDeleter =
    folly::static_function_deleter<RSAPointers, RSAPointersFree>;

std::unique_ptr<RSAPointers, RSAPointersDeleter>
setupCustomRSA(const char* certPath, const char* keyPath, EventBase* jobEvb) {
  auto certPEM = getFileAsBuf(certPath);
  auto keyPEM = getFileAsBuf(keyPath);

  ssl::BioUniquePtr certBio(
      BIO_new_mem_buf((void*)certPEM.data(), certPEM.size()));
  ssl::BioUniquePtr keyBio(
      BIO_new_mem_buf((void*)keyPEM.data(), keyPEM.size()));

  ssl::X509UniquePtr cert(
      PEM_read_bio_X509(certBio.get(), nullptr, nullptr, nullptr));
  ssl::EvpPkeyUniquePtr evpPkey(
      PEM_read_bio_PrivateKey(keyBio.get(), nullptr, nullptr, nullptr));
  ssl::EvpPkeyUniquePtr publicEvpPkey(X509_get_pubkey(cert.get()));

  std::unique_ptr<RSAPointers, RSAPointersDeleter> ret(new RSAPointers());

  RSA* actualrsa = EVP_PKEY_get1_RSA(evpPkey.get());
  LOG(INFO) << "actualrsa ptr " << std::hex << (void*)actualrsa;
  RSA* dummyrsa = EVP_PKEY_get1_RSA(publicEvpPkey.get());
  if (dummyrsa == nullptr) {
    throw std::runtime_error("Couldn't get RSA cert public factors");
  }
  RSA_METHOD* meth = RSA_meth_dup(RSA_get_default_method());
  if (meth == nullptr || RSA_meth_set1_name(meth, "Async RSA method") == 0 ||
      RSA_meth_set_priv_enc(meth, customRsaPrivEnc) == 0 ||
      RSA_meth_set_flags(meth, RSA_METHOD_FLAG_NO_CHECK) == 0) {
    throw std::runtime_error("Cannot create async RSA_METHOD");
  }
  RSA_set_method(dummyrsa, meth);
  RSA_set_flags(dummyrsa, RSA_FLAG_EXT_PKEY);

  kRSAExIndex = RSA_get_ex_new_index(0, nullptr, nullptr, nullptr, nullptr);
  kRSAEvbExIndex = RSA_get_ex_new_index(0, nullptr, nullptr, nullptr, nullptr);
  kRSASocketExIndex =
      RSA_get_ex_new_index(0, nullptr, nullptr, nullptr, nullptr);
  CHECK_NE(kRSAExIndex, -1);
  CHECK_NE(kRSAEvbExIndex, -1);
  CHECK_NE(kRSASocketExIndex, -1);
  RSA_set_ex_data(dummyrsa, kRSAExIndex, actualrsa);
  RSA_set_ex_data(dummyrsa, kRSAEvbExIndex, jobEvb);

  ret->actualrsa = actualrsa;
  ret->dummyrsa = dummyrsa;
  ret->meth = meth;

  return ret;
}

// TODO: disabled with ASAN doesn't play nice with ASYNC for some reason
#ifndef FOLLY_SANITIZE_ADDRESS
TEST(AsyncSSLSocketTest, OpenSSL110AsyncTest) {
  ASYNC_init_thread(1, 1);
  EventBase eventBase;
  ScopedEventBaseThread jobEvbThread;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);

  auto rsaPointers =
      setupCustomRSA(kTestCert, kTestKey, jobEvbThread.getEventBase());
  CHECK(rsaPointers->dummyrsa);
  // up-refs dummyrsa
  SSL_CTX_use_RSAPrivateKey(serverCtx->getSSLCtx(), rsaPointers->dummyrsa);
  SSL_CTX_set_mode(serverCtx->getSSLCtx(), SSL_MODE_ASYNC);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), false, false);
  SSLHandshakeServer server(std::move(serverSock), false, false);

  eventBase.loop();

  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_TRUE(client.handshakeSuccess_);
  ASYNC_cleanup_thread();
}

TEST(AsyncSSLSocketTest, OpenSSL110AsyncTestFailure) {
  ASYNC_init_thread(1, 1);
  EventBase eventBase;
  ScopedEventBaseThread jobEvbThread;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);
  // Set the wrong key for the cert
  auto rsaPointers =
      setupCustomRSA(kTestCert, kClientTestKey, jobEvbThread.getEventBase());
  CHECK(rsaPointers->dummyrsa);
  SSL_CTX_use_RSAPrivateKey(serverCtx->getSSLCtx(), rsaPointers->dummyrsa);
  SSL_CTX_set_mode(serverCtx->getSSLCtx(), SSL_MODE_ASYNC);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), false, false);
  SSLHandshakeServer server(std::move(serverSock), false, false);

  eventBase.loop();

  EXPECT_TRUE(server.handshakeError_);
  EXPECT_TRUE(client.handshakeError_);
  ASYNC_cleanup_thread();
}

TEST(AsyncSSLSocketTest, OpenSSL110AsyncTestClosedWithCallbackPending) {
  ASYNC_init_thread(1, 1);
  EventBase eventBase;
  ScopedEventBaseThread jobEvbThread;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadCertificate(kTestCert);
  serverCtx->loadTrustedCertificates(kTestCA);
  serverCtx->loadClientCAList(kTestCA);

  auto rsaPointers =
      setupCustomRSA(kTestCert, kTestKey, jobEvbThread.getEventBase());
  CHECK(rsaPointers->dummyrsa);
  // up-refs dummyrsa
  SSL_CTX_use_RSAPrivateKey(serverCtx->getSSLCtx(), rsaPointers->dummyrsa);
  SSL_CTX_set_mode(serverCtx->getSSLCtx(), SSL_MODE_ASYNC);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::NO_VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  RSA_set_ex_data(rsaPointers->dummyrsa, kRSASocketExIndex, serverSock.get());

  SSLHandshakeClient client(std::move(clientSock), false, false);
  SSLHandshakeServer server(std::move(serverSock), false, false);

  eventBase.loop();

  EXPECT_TRUE(server.handshakeError_);
  EXPECT_TRUE(client.handshakeError_);
  ASYNC_cleanup_thread();
}
#endif // FOLLY_SANITIZE_ADDRESS

#endif // FOLLY_OPENSSL_IS_110

TEST(AsyncSSLSocketTest, LoadCertFromMemory) {
  using folly::ssl::OpenSSLUtils;
  auto cert = getFileAsBuf(kTestCert);
  auto key = getFileAsBuf(kTestKey);

  ssl::BioUniquePtr certBio(BIO_new(BIO_s_mem()));
  BIO_write(certBio.get(), cert.data(), cert.size());
  ssl::BioUniquePtr keyBio(BIO_new(BIO_s_mem()));
  BIO_write(keyBio.get(), key.data(), key.size());

  // Create SSL structs from buffers to get properties
  ssl::X509UniquePtr certStruct(
      PEM_read_bio_X509(certBio.get(), nullptr, nullptr, nullptr));
  ssl::EvpPkeyUniquePtr keyStruct(
      PEM_read_bio_PrivateKey(keyBio.get(), nullptr, nullptr, nullptr));
  certBio = nullptr;
  keyBio = nullptr;

  auto origCommonName = OpenSSLUtils::getCommonName(certStruct.get());
  auto origKeySize = EVP_PKEY_bits(keyStruct.get());
  certStruct = nullptr;
  keyStruct = nullptr;

  auto ctx = std::make_shared<SSLContext>();
  ctx->loadPrivateKeyFromBufferPEM(key);
  ctx->loadCertificateFromBufferPEM(cert);
  ctx->loadTrustedCertificates(kTestCA);

  ssl::SSLUniquePtr ssl(ctx->createSSL());

  auto newCert = SSL_get_certificate(ssl.get());
  auto newKey = SSL_get_privatekey(ssl.get());

  // Get properties from SSL struct
  auto newCommonName = OpenSSLUtils::getCommonName(newCert);
  auto newKeySize = EVP_PKEY_bits(newKey);

  // Check that the key and cert have the expected properties
  EXPECT_EQ(origCommonName, newCommonName);
  EXPECT_EQ(origKeySize, newKeySize);
}

TEST(AsyncSSLSocketTest, MinWriteSizeTest) {
  EventBase eb;

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // create SSL socket
  AsyncSSLSocket::UniquePtr socket(new AsyncSSLSocket(sslContext, &eb));

  EXPECT_EQ(1500, socket->getMinWriteSize());

  socket->setMinWriteSize(0);
  EXPECT_EQ(0, socket->getMinWriteSize());
  socket->setMinWriteSize(50000);
  EXPECT_EQ(50000, socket->getMinWriteSize());
}

class ReadCallbackTerminator : public ReadCallback {
 public:
  ReadCallbackTerminator(EventBase* base, WriteCallbackBase* wcb)
      : ReadCallback(wcb), base_(base) {}

  // Do not write data back, terminate the loop.
  void readDataAvailable(size_t len) noexcept override {
    std::cerr << "readDataAvailable, len " << len << std::endl;

    currentBuffer.length = len;

    buffers.push_back(currentBuffer);
    currentBuffer.reset();
    state = STATE_SUCCEEDED;

    socket_->setReadCB(nullptr);
    base_->terminateLoopSoon();
  }

 private:
  EventBase* base_;
};

/**
 * Test a full unencrypted codepath
 */
TEST(AsyncSSLSocketTest, UnencryptedTest) {
  EventBase base;

  auto clientCtx = std::make_shared<folly::SSLContext>();
  auto serverCtx = std::make_shared<folly::SSLContext>();
  int fds[2];
  getfds(fds);
  getctx(clientCtx, serverCtx);
  auto client =
      AsyncSSLSocket::newSocket(clientCtx, &base, fds[0], false, true);
  auto server = AsyncSSLSocket::newSocket(serverCtx, &base, fds[1], true, true);

  ReadCallbackTerminator readCallback(&base, nullptr);
  server->setReadCB(&readCallback);
  readCallback.setSocket(server);

  uint8_t buf[128];
  memset(buf, 'a', sizeof(buf));
  client->write(nullptr, buf, sizeof(buf));

  // Check that bytes are unencrypted
  char c;
  EXPECT_EQ(1, recv(fds[1], &c, 1, MSG_PEEK));
  EXPECT_EQ('a', c);

  EventBaseAborter eba(&base, 3000);
  base.loop();

  EXPECT_EQ(1, readCallback.buffers.size());
  EXPECT_EQ(AsyncSSLSocket::STATE_UNENCRYPTED, client->getSSLState());

  server->setReadCB(&readCallback);

  // Unencrypted
  server->sslAccept(nullptr);
  client->sslConn(nullptr);

  // Do NOT wait for handshake, writing should be queued and happen after

  client->write(nullptr, buf, sizeof(buf));

  // Check that bytes are *not* unencrypted
  char c2;
  EXPECT_EQ(1, recv(fds[1], &c2, 1, MSG_PEEK));
  EXPECT_NE('a', c2);

  base.loop();

  EXPECT_EQ(2, readCallback.buffers.size());
  EXPECT_EQ(AsyncSSLSocket::STATE_ESTABLISHED, client->getSSLState());
}

TEST(AsyncSSLSocketTest, ConnectUnencryptedTest) {
  auto clientCtx = std::make_shared<folly::SSLContext>();
  auto serverCtx = std::make_shared<folly::SSLContext>();
  getctx(clientCtx, serverCtx);

  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  EventBase evb;
  std::shared_ptr<AsyncSSLSocket> socket =
      AsyncSSLSocket::newSocket(clientCtx, &evb, true);
  socket->connect(nullptr, server.getAddress(), 0);

  evb.loop();

  EXPECT_EQ(AsyncSSLSocket::STATE_UNENCRYPTED, socket->getSSLState());
  socket->sslConn(nullptr);
  evb.loop();
  EXPECT_EQ(AsyncSSLSocket::STATE_ESTABLISHED, socket->getSSLState());

  // write()
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  socket->write(nullptr, buf.data(), buf.size());

  socket->close();
}

/**
 * Test acceptrunner in various situations
 */
TEST(AsyncSSLSocketTest, SSLAcceptRunnerBasic) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  serverCtx->sslAcceptRunner(std::make_unique<SSLAcceptEvbRunner>(&eventBase));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_FALSE(client.handshakeError_);
  EXPECT_LE(0, client.handshakeTime.count());
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_FALSE(server.handshakeError_);
  EXPECT_LE(0, server.handshakeTime.count());
}

TEST(AsyncSSLSocketTest, SSLAcceptRunnerAcceptError) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  serverCtx->sslAcceptRunner(
      std::make_unique<SSLAcceptErrorRunner>(&eventBase));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_FALSE(client.handshakeSuccess_);
  EXPECT_TRUE(client.handshakeError_);
  EXPECT_FALSE(server.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeError_);
}

TEST(AsyncSSLSocketTest, SSLAcceptRunnerAcceptClose) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  serverCtx->sslAcceptRunner(
      std::make_unique<SSLAcceptCloseRunner>(&eventBase, serverSock.get()));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServer server(std::move(serverSock), true, true);

  eventBase.loop();

  EXPECT_FALSE(client.handshakeSuccess_);
  EXPECT_TRUE(client.handshakeError_);
  EXPECT_FALSE(server.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeError_);
}

TEST(AsyncSSLSocketTest, SSLAcceptRunnerAcceptDestroy) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto serverCtx = std::make_shared<SSLContext>();
  serverCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  serverCtx->loadPrivateKey(kTestKey);
  serverCtx->loadCertificate(kTestCert);

  clientCtx->setVerificationOption(SSLContext::SSLVerifyPeerEnum::VERIFY);
  clientCtx->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
  clientCtx->loadTrustedCertificates(kTestCA);

  int fds[2];
  getfds(fds);

  AsyncSSLSocket::UniquePtr clientSock(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSock(
      new AsyncSSLSocket(serverCtx, &eventBase, fds[1], true));

  SSLHandshakeClient client(std::move(clientSock), true, true);
  SSLHandshakeServer server(std::move(serverSock), true, true);

  serverCtx->sslAcceptRunner(
      std::make_unique<SSLAcceptDestroyRunner>(&eventBase, &server));

  eventBase.loop();

  EXPECT_FALSE(client.handshakeSuccess_);
  EXPECT_TRUE(client.handshakeError_);
  EXPECT_FALSE(server.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeError_);
}

TEST(AsyncSSLSocketTest, ConnResetErrorString) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  WriteErrorCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  auto socket = std::make_shared<BlockingSocket>(server.getAddress(), nullptr);
  socket->open();
  uint8_t buf[3] = {0x16, 0x03, 0x01};
  socket->write(buf, sizeof(buf));
  socket->closeWithReset();

  handshakeCallback.waitForHandshake();
  EXPECT_NE(
      handshakeCallback.errorString_.find("Network error"), std::string::npos);
  EXPECT_NE(handshakeCallback.errorString_.find("104"), std::string::npos);
}

TEST(AsyncSSLSocketTest, ConnEOFErrorString) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  WriteErrorCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  auto socket = std::make_shared<BlockingSocket>(server.getAddress(), nullptr);
  socket->open();
  uint8_t buf[3] = {0x16, 0x03, 0x01};
  socket->write(buf, sizeof(buf));
  socket->close();

  handshakeCallback.waitForHandshake();
#if FOLLY_OPENSSL_IS_110
  EXPECT_NE(
      handshakeCallback.errorString_.find("Network error"), std::string::npos);
#else
  EXPECT_NE(
      handshakeCallback.errorString_.find("Connection EOF"), std::string::npos);
#endif
}

TEST(AsyncSSLSocketTest, ConnOpenSSLErrorString) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  WriteErrorCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  auto socket = std::make_shared<BlockingSocket>(server.getAddress(), nullptr);
  socket->open();
  uint8_t buf[256] = {0x16, 0x03};
  memset(buf + 2, 'a', sizeof(buf) - 2);
  socket->write(buf, sizeof(buf));
  socket->close();

  handshakeCallback.waitForHandshake();
  EXPECT_NE(
      handshakeCallback.errorString_.find("SSL routines"), std::string::npos);
#if defined(OPENSSL_IS_BORINGSSL)
  EXPECT_NE(
      handshakeCallback.errorString_.find("ENCRYPTED_LENGTH_TOO_LONG"),
      std::string::npos);
#elif FOLLY_OPENSSL_IS_110
  EXPECT_NE(
      handshakeCallback.errorString_.find("packet length too long"),
      std::string::npos);
#else
  EXPECT_NE(
      handshakeCallback.errorString_.find("unknown protocol"),
      std::string::npos);
#endif
}

TEST(AsyncSSLSocketTest, TestSSLCipherCodeToNameMap) {
  using folly::ssl::OpenSSLUtils;
  EXPECT_EQ(
      OpenSSLUtils::getCipherName(0xc02c), "ECDHE-ECDSA-AES256-GCM-SHA384");
  // TLS_DHE_RSA_WITH_DES_CBC_SHA - We shouldn't be building with this
  EXPECT_EQ(OpenSSLUtils::getCipherName(0x0015), "");
  // This indicates TLS_EMPTY_RENEGOTIATION_INFO_SCSV, no name expected
  EXPECT_EQ(OpenSSLUtils::getCipherName(0x00ff), "");
}

#if defined __linux__
/**
 * Ensure TransparentTLS flag is disabled with AsyncSSLSocket
 */
TEST(AsyncSSLSocketTest, TTLSDisabled) {
  // clear all setsockopt tracking history
  globalStatic.reset();

  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback, false);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open();

  EXPECT_EQ(1, globalStatic.ttlsDisabledSet.count(socket->getSocketFD()));

  // write()
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  socket->write(buf.data(), buf.size());

  // close()
  socket->close();
}
#endif

#if FOLLY_ALLOW_TFO

class MockAsyncTFOSSLSocket : public AsyncSSLSocket {
 public:
  using UniquePtr = std::unique_ptr<MockAsyncTFOSSLSocket, Destructor>;

  explicit MockAsyncTFOSSLSocket(
      std::shared_ptr<folly::SSLContext> sslCtx,
      EventBase* evb)
      : AsyncSocket(evb), AsyncSSLSocket(sslCtx, evb) {}

  MOCK_METHOD3(tfoSendMsg, ssize_t(int fd, struct msghdr* msg, int msg_flags));
};

#if defined __linux__
/**
 * Ensure TransparentTLS flag is disabled with AsyncSSLSocket + TFO
 */
TEST(AsyncSSLSocketTest, TTLSDisabledWithTFO) {
  // clear all setsockopt tracking history
  globalStatic.reset();

  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback, true);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->enableTFO();
  socket->open();

  EXPECT_EQ(1, globalStatic.ttlsDisabledSet.count(socket->getSocketFD()));

  // write()
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  socket->write(buf.data(), buf.size());

  // close()
  socket->close();
}
#endif

/**
 * Test connecting to, writing to, reading from, and closing the
 * connection to the SSL server with TFO.
 */
TEST(AsyncSSLSocketTest, ConnectWriteReadCloseTFO) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback, true);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->enableTFO();
  socket->open();

  // write()
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  socket->write(buf.data(), buf.size());

  // read()
  std::array<uint8_t, 128> readbuf;
  uint32_t bytesRead = socket->readAll(readbuf.data(), readbuf.size());
  EXPECT_EQ(bytesRead, 128);
  EXPECT_EQ(memcmp(buf.data(), readbuf.data(), bytesRead), 0);

  // close()
  socket->close();
}

/**
 * Test connecting to, writing to, reading from, and closing the
 * connection to the SSL server with TFO.
 */
TEST(AsyncSSLSocketTest, ConnectWriteReadCloseTFOWithTFOServerDisabled) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback, false);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->enableTFO();
  socket->open();

  // write()
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  socket->write(buf.data(), buf.size());

  // read()
  std::array<uint8_t, 128> readbuf;
  uint32_t bytesRead = socket->readAll(readbuf.data(), readbuf.size());
  EXPECT_EQ(bytesRead, 128);
  EXPECT_EQ(memcmp(buf.data(), readbuf.data(), bytesRead), 0);

  // close()
  socket->close();
}

class ConnCallback : public AsyncSocket::ConnectCallback {
 public:
  void connectSuccess() noexcept override {
    state = State::SUCCESS;
  }

  void connectErr(const AsyncSocketException& ex) noexcept override {
    state = State::ERROR;
    error = ex.what();
  }

  enum class State { WAITING, SUCCESS, ERROR };

  State state{State::WAITING};
  std::string error;
};

template <class Cardinality>
MockAsyncTFOSSLSocket::UniquePtr setupSocketWithFallback(
    EventBase* evb,
    const SocketAddress& address,
    Cardinality cardinality) {
  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();

  // connect
  auto socket = MockAsyncTFOSSLSocket::UniquePtr(
      new MockAsyncTFOSSLSocket(sslContext, evb));
  socket->enableTFO();

  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .Times(cardinality)
      .WillOnce(Invoke([&](int fd, struct msghdr*, int) {
        sockaddr_storage addr;
        auto len = address.getAddress(&addr);
        return connect(fd, (const struct sockaddr*)&addr, len);
      }));
  return socket;
}

TEST(AsyncSSLSocketTest, ConnectWriteReadCloseTFOFallback) {
  // Start listening on a local port
  WriteCallbackBase writeCallback;
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback, true);

  EventBase evb;

  auto socket = setupSocketWithFallback(&evb, server.getAddress(), 1);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  evb.loop();
  EXPECT_EQ(ConnCallback::State::SUCCESS, ccb.state);

  evb.runInEventBaseThread([&] { socket->detachEventBase(); });
  evb.loop();

  BlockingSocket sock(std::move(socket));
  // write()
  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());
  sock.write(buf.data(), buf.size());

  // read()
  std::array<uint8_t, 128> readbuf;
  uint32_t bytesRead = sock.readAll(readbuf.data(), readbuf.size());
  EXPECT_EQ(bytesRead, 128);
  EXPECT_EQ(memcmp(buf.data(), readbuf.data(), bytesRead), 0);

  // close()
  sock.close();
}

#if !defined(OPENSSL_IS_BORINGSSL)
TEST(AsyncSSLSocketTest, ConnectTFOTimeout) {
  // Start listening on a local port
  ConnectTimeoutCallback acceptCallback;
  TestSSLServer server(&acceptCallback, true);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->enableTFO();
  EXPECT_THROW(
      socket->open(std::chrono::milliseconds(20)), AsyncSocketException);
}
#endif

#if !defined(OPENSSL_IS_BORINGSSL)
TEST(AsyncSSLSocketTest, ConnectTFOFallbackTimeout) {
  // Start listening on a local port
  ConnectTimeoutCallback acceptCallback;
  TestSSLServer server(&acceptCallback, true);

  EventBase evb;

  auto socket = setupSocketWithFallback(&evb, server.getAddress(), AtMost(1));
  ConnCallback ccb;
  // Set a short timeout
  socket->connect(&ccb, server.getAddress(), 1);

  evb.loop();
  EXPECT_EQ(ConnCallback::State::ERROR, ccb.state);
}
#endif

TEST(AsyncSSLSocketTest, HandshakeTFOFallbackTimeout) {
  // Start listening on a local port
  EmptyReadCallback readCallback;
  HandshakeCallback handshakeCallback(
      &readCallback, HandshakeCallback::EXPECT_ERROR);
  HandshakeTimeoutCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback, true);

  EventBase evb;

  auto socket = setupSocketWithFallback(&evb, server.getAddress(), AtMost(1));
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 100);

  evb.loop();
  EXPECT_EQ(ConnCallback::State::ERROR, ccb.state);
  EXPECT_THAT(ccb.error, testing::HasSubstr("SSL connect timed out"));
}

TEST(AsyncSSLSocketTest, HandshakeTFORefused) {
  // Start listening on a local port
  EventBase evb;

  // Hopefully nothing is listening on this address
  SocketAddress addr("127.0.0.1", 65535);
  auto socket = setupSocketWithFallback(&evb, addr, AtMost(1));
  ConnCallback ccb;
  socket->connect(&ccb, addr, 100);

  evb.loop();
  EXPECT_EQ(ConnCallback::State::ERROR, ccb.state);
  EXPECT_THAT(ccb.error, testing::HasSubstr("refused"));
}

TEST(AsyncSSLSocketTest, TestPreReceivedData) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();
  std::array<int, 2> fds;
  getfds(fds.data());
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSockPtr(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSSLSocket::UniquePtr serverSockPtr(
      new AsyncSSLSocket(dfServerCtx, &eventBase, fds[1], true));
  auto clientSock = clientSockPtr.get();
  auto serverSock = serverSockPtr.get();
  SSLHandshakeClient client(std::move(clientSockPtr), true, true);

  // Steal some data from the server.
  std::array<uint8_t, 10> buf;
  auto bytesReceived = recv(fds[1], buf.data(), buf.size(), 0);
  checkUnixError(bytesReceived, "recv failed");

  serverSock->setPreReceivedData(
      IOBuf::wrapBuffer(ByteRange(buf.data(), bytesReceived)));
  SSLHandshakeServer server(std::move(serverSockPtr), true, true);
  while (!client.handshakeSuccess_ && !client.handshakeError_) {
    eventBase.loopOnce();
  }

  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_EQ(
      serverSock->getRawBytesReceived(), clientSock->getRawBytesWritten());
}

TEST(AsyncSSLSocketTest, TestMoveFromAsyncSocket) {
  EventBase eventBase;
  auto clientCtx = std::make_shared<SSLContext>();
  auto dfServerCtx = std::make_shared<SSLContext>();
  std::array<int, 2> fds;
  getfds(fds.data());
  getctx(clientCtx, dfServerCtx);

  AsyncSSLSocket::UniquePtr clientSockPtr(
      new AsyncSSLSocket(clientCtx, &eventBase, fds[0], false));
  AsyncSocket::UniquePtr serverSockPtr(new AsyncSocket(&eventBase, fds[1]));
  auto clientSock = clientSockPtr.get();
  auto serverSock = serverSockPtr.get();
  SSLHandshakeClient client(std::move(clientSockPtr), true, true);

  // Steal some data from the server.
  std::array<uint8_t, 10> buf;
  auto bytesReceived = recv(fds[1], buf.data(), buf.size(), 0);
  checkUnixError(bytesReceived, "recv failed");

  serverSock->setPreReceivedData(
      IOBuf::wrapBuffer(ByteRange(buf.data(), bytesReceived)));
  AsyncSSLSocket::UniquePtr serverSSLSockPtr(
      new AsyncSSLSocket(dfServerCtx, std::move(serverSockPtr), true));
  auto serverSSLSock = serverSSLSockPtr.get();
  SSLHandshakeServer server(std::move(serverSSLSockPtr), true, true);
  while (!client.handshakeSuccess_ && !client.handshakeError_) {
    eventBase.loopOnce();
  }

  EXPECT_TRUE(client.handshakeSuccess_);
  EXPECT_TRUE(server.handshakeSuccess_);
  EXPECT_EQ(
      serverSSLSock->getRawBytesReceived(), clientSock->getRawBytesWritten());
}

/**
 * Test overriding the flags passed to "sendmsg()" system call,
 * and verifying that write requests fail properly.
 */
TEST(AsyncSSLSocketTest, SendMsgParamsCallback) {
  // Start listening on a local port
  SendMsgFlagsCallback msgCallback;
  ExpectWriteErrorCallback writeCallback(&msgCallback);
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open();

  // Setting flags to "-1" to trigger "Invalid argument" error
  // on attempt to use this flags in sendmsg() system call.
  msgCallback.resetFlags(-1);

  // write()
  std::vector<uint8_t> buf(128, 'a');
  ASSERT_EQ(socket->write(buf.data(), buf.size()), buf.size());

  // close()
  socket->close();

  cerr << "SendMsgParamsCallback test completed" << endl;
}

#ifdef FOLLY_HAVE_MSG_ERRQUEUE
/**
 * Test connecting to, writing to, reading from, and closing the
 * connection to the SSL server.
 */
TEST(AsyncSSLSocketTest, SendMsgDataCallback) {
  // This test requires Linux kernel v4.6 or later
  struct utsname s_uname;
  memset(&s_uname, 0, sizeof(s_uname));
  ASSERT_EQ(uname(&s_uname), 0);
  int major, minor;
  folly::StringPiece extra;
  if (folly::split<false>(
          '.', std::string(s_uname.release) + ".", major, minor, extra)) {
    if (major < 4 || (major == 4 && minor < 6)) {
      LOG(INFO) << "Kernel version: 4.6 and newer required for this test ("
                << "kernel ver. " << s_uname.release << " detected).";
      return;
    }
  }

  // Start listening on a local port
  SendMsgDataCallback msgCallback;
  WriteCheckTimestampCallback writeCallback(&msgCallback);
  ReadCallback readCallback(&writeCallback);
  HandshakeCallback handshakeCallback(&readCallback);
  SSLServerAcceptCallback acceptCallback(&handshakeCallback);
  TestSSLServer server(&acceptCallback);

  // Set up SSL context.
  auto sslContext = std::make_shared<SSLContext>();
  sslContext->ciphers("ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");

  // connect
  auto socket =
      std::make_shared<BlockingSocket>(server.getAddress(), sslContext);
  socket->open();

  // Adding MSG_EOR flag to the message flags - it'll trigger
  // timestamp generation for the last byte of the message.
  msgCallback.resetFlags(MSG_DONTWAIT | MSG_NOSIGNAL | MSG_EOR);

  // Init ancillary data buffer to trigger timestamp notification
  union {
    uint8_t ctrl_data[CMSG_LEN(sizeof(uint32_t))];
    struct cmsghdr cmsg;
  } u;
  u.cmsg.cmsg_level = SOL_SOCKET;
  u.cmsg.cmsg_type = SO_TIMESTAMPING;
  u.cmsg.cmsg_len = CMSG_LEN(sizeof(uint32_t));
  uint32_t flags = SOF_TIMESTAMPING_TX_SCHED | SOF_TIMESTAMPING_TX_SOFTWARE |
      SOF_TIMESTAMPING_TX_ACK;
  memcpy(CMSG_DATA(&u.cmsg), &flags, sizeof(uint32_t));
  std::vector<char> ctrl(CMSG_LEN(sizeof(uint32_t)));
  memcpy(ctrl.data(), u.ctrl_data, CMSG_LEN(sizeof(uint32_t)));
  msgCallback.resetData(std::move(ctrl));

  // write()
  std::vector<uint8_t> buf(128, 'a');
  socket->write(buf.data(), buf.size());

  // read()
  std::vector<uint8_t> readbuf(buf.size());
  uint32_t bytesRead = socket->readAll(readbuf.data(), readbuf.size());
  EXPECT_EQ(bytesRead, buf.size());
  EXPECT_TRUE(std::equal(buf.begin(), buf.end(), readbuf.begin()));

  writeCallback.checkForTimestampNotifications();

  // close()
  socket->close();

  cerr << "SendMsgDataCallback test completed" << endl;
}
#endif // FOLLY_HAVE_MSG_ERRQUEUE

#endif

} // namespace folly

#ifdef SIGPIPE
///////////////////////////////////////////////////////////////////////////
// init_unit_test_suite
///////////////////////////////////////////////////////////////////////////
namespace {
struct Initializer {
  Initializer() {
    signal(SIGPIPE, SIG_IGN);
  }
};
Initializer initializer;
} // namespace
#endif

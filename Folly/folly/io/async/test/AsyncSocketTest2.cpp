/*
 * Copyright 2010-present Facebook, Inc.
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

#include <folly/io/async/test/AsyncSocketTest2.h>

#include <folly/ExceptionWrapper.h>
#include <folly/Random.h>
#include <folly/SocketAddress.h>
#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/ScopedEventBaseThread.h>

#include <folly/experimental/TestUtil.h>
#include <folly/io/IOBuf.h>
#include <folly/io/async/test/AsyncSocketTest.h>
#include <folly/io/async/test/Util.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Unistd.h>
#include <folly/synchronization/Baton.h>
#include <folly/test/SocketAddressTestHelper.h>

#include <fcntl.h>
#include <sys/types.h>
#include <iostream>
#include <memory>
#include <thread>

using std::cerr;
using std::endl;
using std::min;
using std::string;
using std::unique_ptr;
using std::vector;
using std::chrono::milliseconds;

using namespace folly;
using namespace folly::test;
using namespace testing;

namespace fsp = folly::portability::sockets;

class DelayedWrite : public AsyncTimeout {
 public:
  DelayedWrite(
      const std::shared_ptr<AsyncSocket>& socket,
      unique_ptr<IOBuf>&& bufs,
      AsyncTransportWrapper::WriteCallback* wcb,
      bool cork,
      bool lastWrite = false)
      : AsyncTimeout(socket->getEventBase()),
        socket_(socket),
        bufs_(std::move(bufs)),
        wcb_(wcb),
        cork_(cork),
        lastWrite_(lastWrite) {}

 private:
  void timeoutExpired() noexcept override {
    WriteFlags flags = cork_ ? WriteFlags::CORK : WriteFlags::NONE;
    socket_->writeChain(wcb_, std::move(bufs_), flags);
    if (lastWrite_) {
      socket_->shutdownWrite();
    }
  }

  std::shared_ptr<AsyncSocket> socket_;
  unique_ptr<IOBuf> bufs_;
  AsyncTransportWrapper::WriteCallback* wcb_;
  bool cork_;
  bool lastWrite_;
};

///////////////////////////////////////////////////////////////////////////
// connect() tests
///////////////////////////////////////////////////////////////////////////

/**
 * Test connecting to a server
 */
TEST(AsyncSocketTest, Connect) {
  // Start listening on a local port
  TestServer server;

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback cb;
  const auto startedAt = std::chrono::steady_clock::now();
  socket->connect(&cb, server.getAddress(), 30);

  evb.loop();
  const auto finishedAt = std::chrono::steady_clock::now();

  ASSERT_EQ(cb.state, STATE_SUCCEEDED);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_GE(socket->getConnectStartTime(), startedAt);
  EXPECT_LE(socket->getConnectStartTime(), socket->getConnectEndTime());
  EXPECT_LE(socket->getConnectEndTime(), finishedAt);
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(30));
}

enum class TFOState {
  DISABLED,
  ENABLED,
};

class AsyncSocketConnectTest : public ::testing::TestWithParam<TFOState> {};

std::vector<TFOState> getTestingValues() {
  std::vector<TFOState> vals;
  vals.emplace_back(TFOState::DISABLED);

#if FOLLY_ALLOW_TFO
  vals.emplace_back(TFOState::ENABLED);
#endif
  return vals;
}

INSTANTIATE_TEST_CASE_P(
    ConnectTests,
    AsyncSocketConnectTest,
    ::testing::ValuesIn(getTestingValues()));

/**
 * Test connecting to a server that isn't listening
 */
TEST(AsyncSocketTest, ConnectRefused) {
  EventBase evb;

  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  // Hopefully nothing is actually listening on this address
  folly::SocketAddress addr("127.0.0.1", 65535);
  ConnCallback cb;
  socket->connect(&cb, addr, 30);

  evb.loop();

  EXPECT_EQ(STATE_FAILED, cb.state);
  EXPECT_EQ(AsyncSocketException::NOT_OPEN, cb.exception.getType());
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(std::chrono::milliseconds(30), socket->getConnectTimeout());
}

/**
 * Test connection timeout
 */
TEST(AsyncSocketTest, ConnectTimeout) {
  EventBase evb;

  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  // Try connecting to server that won't respond.
  //
  // This depends somewhat on the network where this test is run.
  // Hopefully this IP will be routable but unresponsive.
  // (Alternatively, we could try listening on a local raw socket, but that
  // normally requires root privileges.)
  auto host = SocketAddressTestHelper::isIPv6Enabled()
      ? SocketAddressTestHelper::kGooglePublicDnsAAddrIPv6
      : SocketAddressTestHelper::isIPv4Enabled()
          ? SocketAddressTestHelper::kGooglePublicDnsAAddrIPv4
          : nullptr;
  SocketAddress addr(host, 65535);
  ConnCallback cb;
  socket->connect(&cb, addr, 1); // also set a ridiculously small timeout

  evb.loop();

  ASSERT_EQ(cb.state, STATE_FAILED);
  if (cb.exception.getType() == AsyncSocketException::NOT_OPEN) {
    // This can happen if we could not route to the IP address picked above.
    // In this case the connect will fail immediately rather than timing out.
    // Just skip the test in this case.
    SKIP() << "do not have a routable but unreachable IP address";
  }
  ASSERT_EQ(cb.exception.getType(), AsyncSocketException::TIMED_OUT);

  // Verify that we can still get the peer address after a timeout.
  // Use case is if the client was created from a client pool, and we want
  // to log which peer failed.
  folly::SocketAddress peer;
  socket->getPeerAddress(&peer);
  ASSERT_EQ(peer, addr);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(1));
}

/**
 * Test writing immediately after connecting, without waiting for connect
 * to finish.
 */
TEST_P(AsyncSocketConnectTest, ConnectAndWrite) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  if (GetParam() == TFOState::ENABLED) {
    socket->enableTFO();
  }

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // write()
  char buf[128];
  memset(buf, 'a', sizeof(buf));
  WriteCallback wcb;
  socket->write(&wcb, buf, sizeof(buf));

  // Loop.  We don't bother accepting on the server socket yet.
  // The kernel should be able to buffer the write request so it can succeed.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Make sure the server got a connection and received the data
  socket->close();
  server.verifyConnection(buf, sizeof(buf));

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(30));
}

/**
 * Test connecting using a nullptr connect callback.
 */
TEST_P(AsyncSocketConnectTest, ConnectNullCallback) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  if (GetParam() == TFOState::ENABLED) {
    socket->enableTFO();
  }

  socket->connect(nullptr, server.getAddress(), 30);

  // write some data, just so we have some way of verifing
  // that the socket works correctly after connecting
  char buf[128];
  memset(buf, 'a', sizeof(buf));
  WriteCallback wcb;
  socket->write(&wcb, buf, sizeof(buf));

  evb.loop();

  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Make sure the server got a connection and received the data
  socket->close();
  server.verifyConnection(buf, sizeof(buf));

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test calling both write() and close() immediately after connecting, without
 * waiting for connect to finish.
 *
 * This exercises the STATE_CONNECTING_CLOSING code.
 */
TEST_P(AsyncSocketConnectTest, ConnectWriteAndClose) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  if (GetParam() == TFOState::ENABLED) {
    socket->enableTFO();
  }
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // write()
  char buf[128];
  memset(buf, 'a', sizeof(buf));
  WriteCallback wcb;
  socket->write(&wcb, buf, sizeof(buf));

  // close()
  socket->close();

  // Loop.  We don't bother accepting on the server socket yet.
  // The kernel should be able to buffer the write request so it can succeed.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Make sure the server got a connection and received the data
  server.verifyConnection(buf, sizeof(buf));

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test calling close() immediately after connect()
 */
TEST(AsyncSocketTest, ConnectAndClose) {
  TestServer server;

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the close-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; aborting test "
                 "of close-during-connect behavior";
    return;
  }

  socket->close();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  // Make sure the connection was aborted
  ASSERT_EQ(ccb.state, STATE_FAILED);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test calling closeNow() immediately after connect()
 *
 * This should be identical to the normal close behavior.
 */
TEST(AsyncSocketTest, ConnectAndCloseNow) {
  TestServer server;

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the close-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; aborting test "
                 "of closeNow()-during-connect behavior";
    return;
  }

  socket->closeNow();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  // Make sure the connection was aborted
  ASSERT_EQ(ccb.state, STATE_FAILED);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test calling both write() and closeNow() immediately after connecting,
 * without waiting for connect to finish.
 *
 * This should abort the pending write.
 */
TEST(AsyncSocketTest, ConnectWriteAndCloseNow) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the close-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; aborting test "
                 "of write-during-connect behavior";
    return;
  }

  // write()
  char buf[128];
  memset(buf, 'a', sizeof(buf));
  WriteCallback wcb;
  socket->write(&wcb, buf, sizeof(buf));

  // close()
  socket->closeNow();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_FAILED);
  ASSERT_EQ(wcb.state, STATE_FAILED);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test installing a read callback immediately, before connect() finishes.
 */
TEST_P(AsyncSocketConnectTest, ConnectAndRead) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  if (GetParam() == TFOState::ENABLED) {
    socket->enableTFO();
  }

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  ReadCallback rcb;
  socket->setReadCB(&rcb);

  if (GetParam() == TFOState::ENABLED) {
    // Trigger a connection
    socket->writeChain(nullptr, IOBuf::copyBuffer("hey"));
  }

  // Even though we haven't looped yet, we should be able to accept
  // the connection and send data to it.
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();
  uint8_t buf[128];
  memset(buf, 'a', sizeof(buf));
  acceptedSocket->write(buf, sizeof(buf));
  acceptedSocket->flush();
  acceptedSocket->close();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 1);
  ASSERT_EQ(rcb.buffers[0].length, sizeof(buf));
  ASSERT_EQ(memcmp(rcb.buffers[0].buffer, buf, sizeof(buf)), 0);

  ASSERT_FALSE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test installing a read callback and then closing immediately before the
 * connect attempt finishes.
 */
TEST(AsyncSocketTest, ConnectReadAndClose) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the close-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; aborting test "
                 "of read-during-connect behavior";
    return;
  }

  ReadCallback rcb;
  socket->setReadCB(&rcb);

  // close()
  socket->close();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_FAILED); // we aborted the close attempt
  ASSERT_EQ(rcb.buffers.size(), 0);
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED); // this indicates EOF

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test both writing and installing a read callback immediately,
 * before connect() finishes.
 */
TEST_P(AsyncSocketConnectTest, ConnectWriteAndRead) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  if (GetParam() == TFOState::ENABLED) {
    socket->enableTFO();
  }
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // write()
  char buf1[128];
  memset(buf1, 'a', sizeof(buf1));
  WriteCallback wcb;
  socket->write(&wcb, buf1, sizeof(buf1));

  // set a read callback
  ReadCallback rcb;
  socket->setReadCB(&rcb);

  // Even though we haven't looped yet, we should be able to accept
  // the connection and send data to it.
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();
  uint8_t buf2[128];
  memset(buf2, 'b', sizeof(buf2));
  acceptedSocket->write(buf2, sizeof(buf2));
  acceptedSocket->flush();

  // shut down the write half of acceptedSocket, so that the AsyncSocket
  // will stop reading and we can break out of the event loop.
  shutdown(acceptedSocket->getSocketFD(), SHUT_WR);

  // Loop
  evb.loop();

  // Make sure the connect succeeded
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  // Make sure the AsyncSocket read the data written by the accepted socket
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 1);
  ASSERT_EQ(rcb.buffers[0].length, sizeof(buf2));
  ASSERT_EQ(memcmp(rcb.buffers[0].buffer, buf2, sizeof(buf2)), 0);

  // Close the AsyncSocket so we'll see EOF on acceptedSocket
  socket->close();

  // Make sure the accepted socket saw the data written by the AsyncSocket
  uint8_t readbuf[sizeof(buf1)];
  acceptedSocket->readAll(readbuf, sizeof(readbuf));
  ASSERT_EQ(memcmp(buf1, readbuf, sizeof(buf1)), 0);
  uint32_t bytesRead = acceptedSocket->read(readbuf, sizeof(readbuf));
  ASSERT_EQ(bytesRead, 0);

  ASSERT_FALSE(socket->isClosedBySelf());
  ASSERT_TRUE(socket->isClosedByPeer());
}

/**
 * Test writing to the socket then shutting down writes before the connect
 * attempt finishes.
 */
TEST(AsyncSocketTest, ConnectWriteAndShutdownWrite) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the write-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; skipping test";
    return;
  }

  // Ask to write some data
  char wbuf[128];
  memset(wbuf, 'a', sizeof(wbuf));
  WriteCallback wcb;
  socket->write(&wcb, wbuf, sizeof(wbuf));
  socket->shutdownWrite();

  // Shutdown writes
  socket->shutdownWrite();

  // Even though we haven't looped yet, we should be able to accept
  // the connection.
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();

  // Since the connection is still in progress, there should be no data to
  // read yet.  Verify that the accepted socket is not readable.
  struct pollfd fds[1];
  fds[0].fd = acceptedSocket->getSocketFD();
  fds[0].events = POLLIN;
  fds[0].revents = 0;
  int rc = poll(fds, 1, 0);
  ASSERT_EQ(rc, 0);

  // Write data to the accepted socket
  uint8_t acceptedWbuf[192];
  memset(acceptedWbuf, 'b', sizeof(acceptedWbuf));
  acceptedSocket->write(acceptedWbuf, sizeof(acceptedWbuf));
  acceptedSocket->flush();

  // Loop
  evb.loop();

  // The loop should have completed the connection, written the queued data,
  // and shutdown writes on the socket.
  //
  // Check that the connection was completed successfully and that the write
  // callback succeeded.
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Check that we can read the data that was written to the socket, and that
  // we see an EOF, since its socket was half-shutdown.
  uint8_t readbuf[sizeof(wbuf)];
  acceptedSocket->readAll(readbuf, sizeof(readbuf));
  ASSERT_EQ(memcmp(wbuf, readbuf, sizeof(wbuf)), 0);
  uint32_t bytesRead = acceptedSocket->read(readbuf, sizeof(readbuf));
  ASSERT_EQ(bytesRead, 0);

  // Close the accepted socket.  This will cause it to see EOF
  // and uninstall the read callback when we loop next.
  acceptedSocket->close();

  // Install a read callback, then loop again.
  ReadCallback rcb;
  socket->setReadCB(&rcb);
  evb.loop();

  // This loop should have read the data and seen the EOF
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 1);
  ASSERT_EQ(rcb.buffers[0].length, sizeof(acceptedWbuf));
  ASSERT_EQ(
      memcmp(rcb.buffers[0].buffer, acceptedWbuf, sizeof(acceptedWbuf)), 0);

  ASSERT_FALSE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test reading, writing, and shutting down writes before the connect attempt
 * finishes.
 */
TEST(AsyncSocketTest, ConnectReadWriteAndShutdownWrite) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the write-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; skipping test";
    return;
  }

  // Install a read callback
  ReadCallback rcb;
  socket->setReadCB(&rcb);

  // Ask to write some data
  char wbuf[128];
  memset(wbuf, 'a', sizeof(wbuf));
  WriteCallback wcb;
  socket->write(&wcb, wbuf, sizeof(wbuf));

  // Shutdown writes
  socket->shutdownWrite();

  // Even though we haven't looped yet, we should be able to accept
  // the connection.
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();

  // Since the connection is still in progress, there should be no data to
  // read yet.  Verify that the accepted socket is not readable.
  struct pollfd fds[1];
  fds[0].fd = acceptedSocket->getSocketFD();
  fds[0].events = POLLIN;
  fds[0].revents = 0;
  int rc = poll(fds, 1, 0);
  ASSERT_EQ(rc, 0);

  // Write data to the accepted socket
  uint8_t acceptedWbuf[192];
  memset(acceptedWbuf, 'b', sizeof(acceptedWbuf));
  acceptedSocket->write(acceptedWbuf, sizeof(acceptedWbuf));
  acceptedSocket->flush();
  // Shutdown writes to the accepted socket.  This will cause it to see EOF
  // and uninstall the read callback.
  shutdown(acceptedSocket->getSocketFD(), SHUT_WR);

  // Loop
  evb.loop();

  // The loop should have completed the connection, written the queued data,
  // shutdown writes on the socket, read the data we wrote to it, and see the
  // EOF.
  //
  // Check that the connection was completed successfully and that the read
  // and write callbacks were invoked as expected.
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 1);
  ASSERT_EQ(rcb.buffers[0].length, sizeof(acceptedWbuf));
  ASSERT_EQ(
      memcmp(rcb.buffers[0].buffer, acceptedWbuf, sizeof(acceptedWbuf)), 0);
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Check that we can read the data that was written to the socket, and that
  // we see an EOF, since its socket was half-shutdown.
  uint8_t readbuf[sizeof(wbuf)];
  acceptedSocket->readAll(readbuf, sizeof(readbuf));
  ASSERT_EQ(memcmp(wbuf, readbuf, sizeof(wbuf)), 0);
  uint32_t bytesRead = acceptedSocket->read(readbuf, sizeof(readbuf));
  ASSERT_EQ(bytesRead, 0);

  // Fully close both sockets
  acceptedSocket->close();
  socket->close();

  ASSERT_FALSE(socket->isClosedBySelf());
  ASSERT_TRUE(socket->isClosedByPeer());
}

/**
 * Test reading, writing, and calling shutdownWriteNow() before the
 * connect attempt finishes.
 */
TEST(AsyncSocketTest, ConnectReadWriteAndShutdownWriteNow) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the write-while-connecting code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; skipping test";
    return;
  }

  // Install a read callback
  ReadCallback rcb;
  socket->setReadCB(&rcb);

  // Ask to write some data
  char wbuf[128];
  memset(wbuf, 'a', sizeof(wbuf));
  WriteCallback wcb;
  socket->write(&wcb, wbuf, sizeof(wbuf));

  // Shutdown writes immediately.
  // This should immediately discard the data that we just tried to write.
  socket->shutdownWriteNow();

  // Verify that writeError() was invoked on the write callback.
  ASSERT_EQ(wcb.state, STATE_FAILED);
  ASSERT_EQ(wcb.bytesWritten, 0);

  // Even though we haven't looped yet, we should be able to accept
  // the connection.
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();

  // Since the connection is still in progress, there should be no data to
  // read yet.  Verify that the accepted socket is not readable.
  struct pollfd fds[1];
  fds[0].fd = acceptedSocket->getSocketFD();
  fds[0].events = POLLIN;
  fds[0].revents = 0;
  int rc = poll(fds, 1, 0);
  ASSERT_EQ(rc, 0);

  // Write data to the accepted socket
  uint8_t acceptedWbuf[192];
  memset(acceptedWbuf, 'b', sizeof(acceptedWbuf));
  acceptedSocket->write(acceptedWbuf, sizeof(acceptedWbuf));
  acceptedSocket->flush();
  // Shutdown writes to the accepted socket.  This will cause it to see EOF
  // and uninstall the read callback.
  shutdown(acceptedSocket->getSocketFD(), SHUT_WR);

  // Loop
  evb.loop();

  // The loop should have completed the connection, written the queued data,
  // shutdown writes on the socket, read the data we wrote to it, and see the
  // EOF.
  //
  // Check that the connection was completed successfully and that the read
  // callback was invoked as expected.
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 1);
  ASSERT_EQ(rcb.buffers[0].length, sizeof(acceptedWbuf));
  ASSERT_EQ(
      memcmp(rcb.buffers[0].buffer, acceptedWbuf, sizeof(acceptedWbuf)), 0);

  // Since we used shutdownWriteNow(), it should have discarded all pending
  // write data.  Verify we see an immediate EOF when reading from the accepted
  // socket.
  uint8_t readbuf[sizeof(wbuf)];
  uint32_t bytesRead = acceptedSocket->read(readbuf, sizeof(readbuf));
  ASSERT_EQ(bytesRead, 0);

  // Fully close both sockets
  acceptedSocket->close();
  socket->close();

  ASSERT_FALSE(socket->isClosedBySelf());
  ASSERT_TRUE(socket->isClosedByPeer());
}

// Helper function for use in testConnectOptWrite()
// Temporarily disable the read callback
void tmpDisableReads(AsyncSocket* socket, ReadCallback* rcb) {
  // Uninstall the read callback
  socket->setReadCB(nullptr);
  // Schedule the read callback to be reinstalled after 1ms
  socket->getEventBase()->runInLoop(
      std::bind(&AsyncSocket::setReadCB, socket, rcb));
}

/**
 * Test connect+write, then have the connect callback perform another write.
 *
 * This tests interaction of the optimistic writing after connect with
 * additional write attempts that occur in the connect callback.
 */
void testConnectOptWrite(size_t size1, size_t size2, bool close = false) {
  TestServer server;
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  // connect()
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Hopefully the connect didn't succeed immediately.
  // If it did, we can't exercise the optimistic write code path.
  if (ccb.state == STATE_SUCCEEDED) {
    LOG(INFO) << "connect() succeeded immediately; aborting test "
                 "of optimistic write behavior";
    return;
  }

  // Tell the connect callback to perform a write when the connect succeeds
  WriteCallback wcb2;
  std::unique_ptr<char[]> buf2(new char[size2]);
  memset(buf2.get(), 'b', size2);
  if (size2 > 0) {
    ccb.successCallback = [&] { socket->write(&wcb2, buf2.get(), size2); };
    // Tell the second write callback to close the connection when it is done
    wcb2.successCallback = [&] { socket->closeNow(); };
  }

  // Schedule one write() immediately, before the connect finishes
  std::unique_ptr<char[]> buf1(new char[size1]);
  memset(buf1.get(), 'a', size1);
  WriteCallback wcb1;
  if (size1 > 0) {
    socket->write(&wcb1, buf1.get(), size1);
  }

  if (close) {
    // immediately perform a close, before connect() completes
    socket->close();
  }

  // Start reading from the other endpoint after 10ms.
  // If we're using large buffers, we have to read so that the writes don't
  // block forever.
  std::shared_ptr<AsyncSocket> acceptedSocket = server.acceptAsync(&evb);
  ReadCallback rcb;
  rcb.dataAvailableCallback =
      std::bind(tmpDisableReads, acceptedSocket.get(), &rcb);
  socket->getEventBase()->tryRunAfterDelay(
      std::bind(&AsyncSocket::setReadCB, acceptedSocket.get(), &rcb), 10);

  // Loop.  We don't bother accepting on the server socket yet.
  // The kernel should be able to buffer the write request so it can succeed.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  if (size1 > 0) {
    ASSERT_EQ(wcb1.state, STATE_SUCCEEDED);
  }
  if (size2 > 0) {
    ASSERT_EQ(wcb2.state, STATE_SUCCEEDED);
  }

  socket->close();

  // Make sure the read callback received all of the data
  size_t bytesRead = 0;
  for (vector<ReadCallback::Buffer>::const_iterator it = rcb.buffers.begin();
       it != rcb.buffers.end();
       ++it) {
    size_t start = bytesRead;
    bytesRead += it->length;
    size_t end = bytesRead;
    if (start < size1) {
      size_t cmpLen = min(size1, end) - start;
      ASSERT_EQ(memcmp(it->buffer, buf1.get() + start, cmpLen), 0);
    }
    if (end > size1 && end <= size1 + size2) {
      size_t itOffset;
      size_t buf2Offset;
      size_t cmpLen;
      if (start >= size1) {
        itOffset = 0;
        buf2Offset = start - size1;
        cmpLen = end - start;
      } else {
        itOffset = size1 - start;
        buf2Offset = 0;
        cmpLen = end - size1;
      }
      ASSERT_EQ(
          memcmp(it->buffer + itOffset, buf2.get() + buf2Offset, cmpLen), 0);
    }
  }
  ASSERT_EQ(bytesRead, size1 + size2);
}

TEST(AsyncSocketTest, ConnectCallbackWrite) {
  // Test using small writes that should both succeed immediately
  testConnectOptWrite(100, 200);

  // Test using a large buffer in the connect callback, that should block
  const size_t largeSize = 32 * 1024 * 1024;
  testConnectOptWrite(100, largeSize);

  // Test using a large initial write
  testConnectOptWrite(largeSize, 100);

  // Test using two large buffers
  testConnectOptWrite(largeSize, largeSize);

  // Test a small write in the connect callback,
  // but no immediate write before connect completes
  testConnectOptWrite(0, 64);

  // Test a large write in the connect callback,
  // but no immediate write before connect completes
  testConnectOptWrite(0, largeSize);

  // Test connect, a small write, then immediately call close() before connect
  // completes
  testConnectOptWrite(211, 0, true);

  // Test connect, a large immediate write (that will block), then immediately
  // call close() before connect completes
  testConnectOptWrite(largeSize, 0, true);
}

///////////////////////////////////////////////////////////////////////////
// write() related tests
///////////////////////////////////////////////////////////////////////////

/**
 * Test writing using a nullptr callback
 */
TEST(AsyncSocketTest, WriteNullCallback) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket =
      AsyncSocket::newSocket(&evb, server.getAddress(), 30);
  evb.loop(); // loop until the socket is connected

  // write() with a nullptr callback
  char buf[128];
  memset(buf, 'a', sizeof(buf));
  socket->write(nullptr, buf, sizeof(buf));

  evb.loop(); // loop until the data is sent

  // Make sure the server got a connection and received the data
  socket->close();
  server.verifyConnection(buf, sizeof(buf));

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test writing with a send timeout
 */
TEST(AsyncSocketTest, WriteTimeout) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket =
      AsyncSocket::newSocket(&evb, server.getAddress(), 30);
  evb.loop(); // loop until the socket is connected

  // write() a large chunk of data, with no-one on the other end reading.
  // Tricky: the kernel caches the connection metrics for recently-used
  // routes (see tcp_no_metrics_save) so a freshly opened connection can
  // have a send buffer size bigger than wmem_default.  This makes the test
  // flaky on contbuild if writeLength is < wmem_max (20M on our systems).
  size_t writeLength = 32 * 1024 * 1024;
  uint32_t timeout = 200;
  socket->setSendTimeout(timeout);
  std::unique_ptr<char[]> buf(new char[writeLength]);
  memset(buf.get(), 'a', writeLength);
  WriteCallback wcb;
  socket->write(&wcb, buf.get(), writeLength);

  TimePoint start;
  evb.loop();
  TimePoint end;

  // Make sure the write attempt timed out as requested
  ASSERT_EQ(wcb.state, STATE_FAILED);
  ASSERT_EQ(wcb.exception.getType(), AsyncSocketException::TIMED_OUT);

  // Check that the write timed out within a reasonable period of time.
  // We don't check for exactly the specified timeout, since AsyncSocket only
  // times out when it hasn't made progress for that period of time.
  //
  // On linux, the first write sends a few hundred kb of data, then blocks for
  // writability, and then unblocks again after 40ms and is able to write
  // another smaller of data before blocking permanently.  Therefore it doesn't
  // time out until 40ms + timeout.
  //
  // I haven't fully verified the cause of this, but I believe it probably
  // occurs because the receiving end delays sending an ack for up to 40ms.
  // (This is the default value for TCP_DELACK_MIN.)  Once the sender receives
  // the ack, it can send some more data.  However, after that point the
  // receiver's kernel buffer is full.  This 40ms delay happens even with
  // TCP_NODELAY and TCP_QUICKACK enabled on both endpoints.  However, the
  // kernel may be automatically disabling TCP_QUICKACK after receiving some
  // data.
  //
  // For now, we simply check that the timeout occurred within 160ms of
  // the requested value.
  T_CHECK_TIMEOUT(start, end, milliseconds(timeout), milliseconds(160));
}

/**
 * Test writing to a socket that the remote endpoint has closed
 */
TEST(AsyncSocketTest, WritePipeError) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket =
      AsyncSocket::newSocket(&evb, server.getAddress(), 30);
  socket->setSendTimeout(1000);
  evb.loop(); // loop until the socket is connected

  // accept and immediately close the socket
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();
  acceptedSocket->close();

  // write() a large chunk of data
  size_t writeLength = 32 * 1024 * 1024;
  std::unique_ptr<char[]> buf(new char[writeLength]);
  memset(buf.get(), 'a', writeLength);
  WriteCallback wcb;
  socket->write(&wcb, buf.get(), writeLength);

  evb.loop();

  // Make sure the write failed.
  // It would be nice if AsyncSocketException could convey the errno value,
  // so that we could check for EPIPE
  ASSERT_EQ(wcb.state, STATE_FAILED);
  ASSERT_EQ(wcb.exception.getType(), AsyncSocketException::INTERNAL_ERROR);

  ASSERT_FALSE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test writing to a socket that has its read side closed
 */
TEST(AsyncSocketTest, WriteAfterReadEOF) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket =
      AsyncSocket::newSocket(&evb, server.getAddress(), 30);
  evb.loop(); // loop until the socket is connected

  // Accept the connection
  std::shared_ptr<AsyncSocket> acceptedSocket = server.acceptAsync(&evb);
  ReadCallback rcb;
  acceptedSocket->setReadCB(&rcb);

  // Shutdown the write side of client socket (read side of server socket)
  socket->shutdownWrite();
  evb.loop();

  // Check that accepted socket is still writable
  ASSERT_FALSE(acceptedSocket->good());
  ASSERT_TRUE(acceptedSocket->writable());

  // Write data to accepted socket
  constexpr size_t simpleBufLength = 5;
  char simpleBuf[simpleBufLength];
  memset(simpleBuf, 'a', simpleBufLength);
  WriteCallback wcb;
  acceptedSocket->write(&wcb, simpleBuf, simpleBufLength);
  evb.loop();

  // Make sure we were able to write even after getting a read EOF
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED); // this indicates EOF
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);
}

/**
 * Test that bytes written is correctly computed in case of write failure
 */
TEST(AsyncSocketTest, WriteErrorCallbackBytesWritten) {
  // Send and receive buffer sizes for the sockets.
  // Note that Linux will double this value to allow space for bookkeeping
  // overhead.
  constexpr size_t kSockBufSize = 8 * 1024;
  constexpr size_t kEffectiveSockBufSize = 2 * kSockBufSize;

  TestServer server(false, kSockBufSize);

  AsyncSocket::OptionMap options{
      {{SOL_SOCKET, SO_SNDBUF}, kSockBufSize},
      {{SOL_SOCKET, SO_RCVBUF}, kSockBufSize},
      {{IPPROTO_TCP, TCP_NODELAY}, 1},
  };

  // The current thread will be used by the receiver - use a separate thread
  // for the sender.
  EventBase senderEvb;
  std::thread senderThread([&]() { senderEvb.loopForever(); });

  ConnCallback ccb;
  std::shared_ptr<AsyncSocket> socket;

  senderEvb.runInEventBaseThreadAndWait([&]() {
    socket = AsyncSocket::newSocket(&senderEvb);
    socket->connect(&ccb, server.getAddress(), 30, options);
  });

  // accept the socket on the server side
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();

  // Send a big (100KB) write so that it is partially written.
  constexpr size_t kSendSize = 100 * 1024;
  auto const sendBuf = std::vector<char>(kSendSize, 'a');

  WriteCallback wcb;

  senderEvb.runInEventBaseThreadAndWait(
      [&]() { socket->write(&wcb, sendBuf.data(), kSendSize); });

  // Read 20KB of data from the socket to allow the sender to send a bit more
  // data after it initially blocks.
  constexpr size_t kRecvSize = 20 * 1024;
  uint8_t recvBuf[kRecvSize];
  auto bytesRead = acceptedSocket->readAll(recvBuf, sizeof(recvBuf));
  ASSERT_EQ(kRecvSize, bytesRead);
  EXPECT_EQ(0, memcmp(recvBuf, sendBuf.data(), bytesRead));

  // We should be able to send at least the amount of data received plus the
  // send buffer size.  In practice we should probably be able to send
  constexpr size_t kMinExpectedBytesWritten = kRecvSize + kSockBufSize;

  // We shouldn't be able to send more than the amount of data received plus
  // the send buffer size of the sending socket (kEffectiveSockBufSize) plus
  // the receive buffer size on the receiving socket (kEffectiveSockBufSize)
  constexpr size_t kMaxExpectedBytesWritten =
      kRecvSize + kEffectiveSockBufSize + kEffectiveSockBufSize;
  static_assert(
      kMaxExpectedBytesWritten < kSendSize, "kSendSize set too small");

  // Need to delay after receiving 20KB and before closing the receive side so
  // that the send side has a chance to fill the send buffer past.
  using clock = std::chrono::steady_clock;
  auto const deadline = clock::now() + std::chrono::seconds(2);
  while (wcb.bytesWritten < kMinExpectedBytesWritten &&
         clock::now() < deadline) {
    std::this_thread::yield();
  }
  acceptedSocket->closeWithReset();

  senderEvb.terminateLoopSoon();
  senderThread.join();

  ASSERT_EQ(STATE_FAILED, wcb.state);
  ASSERT_LE(kMinExpectedBytesWritten, wcb.bytesWritten);
  ASSERT_GE(kMaxExpectedBytesWritten, wcb.bytesWritten);
}

/**
 * Test writing a mix of simple buffers and IOBufs
 */
TEST(AsyncSocketTest, WriteIOBuf) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Accept the connection
  std::shared_ptr<AsyncSocket> acceptedSocket = server.acceptAsync(&evb);
  ReadCallback rcb;
  acceptedSocket->setReadCB(&rcb);

  // Check if EOR tracking flag can be set and reset.
  EXPECT_FALSE(socket->isEorTrackingEnabled());
  socket->setEorTracking(true);
  EXPECT_TRUE(socket->isEorTrackingEnabled());
  socket->setEorTracking(false);
  EXPECT_FALSE(socket->isEorTrackingEnabled());

  // Write a simple buffer to the socket
  constexpr size_t simpleBufLength = 5;
  char simpleBuf[simpleBufLength];
  memset(simpleBuf, 'a', simpleBufLength);
  WriteCallback wcb;
  socket->write(&wcb, simpleBuf, simpleBufLength);

  // Write a single-element IOBuf chain
  size_t buf1Length = 7;
  unique_ptr<IOBuf> buf1(IOBuf::create(buf1Length));
  memset(buf1->writableData(), 'b', buf1Length);
  buf1->append(buf1Length);
  unique_ptr<IOBuf> buf1Copy(buf1->clone());
  WriteCallback wcb2;
  socket->writeChain(&wcb2, std::move(buf1));

  // Write a multiple-element IOBuf chain
  size_t buf2Length = 11;
  unique_ptr<IOBuf> buf2(IOBuf::create(buf2Length));
  memset(buf2->writableData(), 'c', buf2Length);
  buf2->append(buf2Length);
  size_t buf3Length = 13;
  unique_ptr<IOBuf> buf3(IOBuf::create(buf3Length));
  memset(buf3->writableData(), 'd', buf3Length);
  buf3->append(buf3Length);
  buf2->appendChain(std::move(buf3));
  unique_ptr<IOBuf> buf2Copy(buf2->clone());
  buf2Copy->coalesce();
  WriteCallback wcb3;
  socket->writeChain(&wcb3, std::move(buf2));
  socket->shutdownWrite();

  // Let the reads and writes run to completion
  evb.loop();

  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb2.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb3.state, STATE_SUCCEEDED);

  // Make sure the reader got the right data in the right order
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 1);
  ASSERT_EQ(
      rcb.buffers[0].length,
      simpleBufLength + buf1Length + buf2Length + buf3Length);
  ASSERT_EQ(memcmp(rcb.buffers[0].buffer, simpleBuf, simpleBufLength), 0);
  ASSERT_EQ(
      memcmp(
          rcb.buffers[0].buffer + simpleBufLength,
          buf1Copy->data(),
          buf1Copy->length()),
      0);
  ASSERT_EQ(
      memcmp(
          rcb.buffers[0].buffer + simpleBufLength + buf1Length,
          buf2Copy->data(),
          buf2Copy->length()),
      0);

  acceptedSocket->close();
  socket->close();

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

TEST(AsyncSocketTest, WriteIOBufCorked) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Accept the connection
  std::shared_ptr<AsyncSocket> acceptedSocket = server.acceptAsync(&evb);
  ReadCallback rcb;
  acceptedSocket->setReadCB(&rcb);

  // Do three writes, 100ms apart, with the "cork" flag set
  // on the second write.  The reader should see the first write
  // arrive by itself, followed by the second and third writes
  // arriving together.
  size_t buf1Length = 5;
  unique_ptr<IOBuf> buf1(IOBuf::create(buf1Length));
  memset(buf1->writableData(), 'a', buf1Length);
  buf1->append(buf1Length);
  size_t buf2Length = 7;
  unique_ptr<IOBuf> buf2(IOBuf::create(buf2Length));
  memset(buf2->writableData(), 'b', buf2Length);
  buf2->append(buf2Length);
  size_t buf3Length = 11;
  unique_ptr<IOBuf> buf3(IOBuf::create(buf3Length));
  memset(buf3->writableData(), 'c', buf3Length);
  buf3->append(buf3Length);
  WriteCallback wcb1;
  socket->writeChain(&wcb1, std::move(buf1));
  WriteCallback wcb2;
  DelayedWrite write2(socket, std::move(buf2), &wcb2, true);
  write2.scheduleTimeout(100);
  WriteCallback wcb3;
  DelayedWrite write3(socket, std::move(buf3), &wcb3, false, true);
  write3.scheduleTimeout(140);

  evb.loop();
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb1.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb2.state, STATE_SUCCEEDED);
  if (wcb3.state != STATE_SUCCEEDED) {
    throw(wcb3.exception);
  }
  ASSERT_EQ(wcb3.state, STATE_SUCCEEDED);

  // Make sure the reader got the data with the right grouping
  ASSERT_EQ(rcb.state, STATE_SUCCEEDED);
  ASSERT_EQ(rcb.buffers.size(), 2);
  ASSERT_EQ(rcb.buffers[0].length, buf1Length);
  ASSERT_EQ(rcb.buffers[1].length, buf2Length + buf3Length);

  acceptedSocket->close();
  socket->close();

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test performing a zero-length write
 */
TEST(AsyncSocketTest, ZeroLengthWrite) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket =
      AsyncSocket::newSocket(&evb, server.getAddress(), 30);
  evb.loop(); // loop until the socket is connected

  auto acceptedSocket = server.acceptAsync(&evb);
  ReadCallback rcb;
  acceptedSocket->setReadCB(&rcb);

  size_t len1 = 1024 * 1024;
  size_t len2 = 1024 * 1024;
  std::unique_ptr<char[]> buf(new char[len1 + len2]);
  memset(buf.get(), 'a', len1);
  memset(buf.get(), 'b', len2);

  WriteCallback wcb1;
  WriteCallback wcb2;
  WriteCallback wcb3;
  WriteCallback wcb4;
  socket->write(&wcb1, buf.get(), 0);
  socket->write(&wcb2, buf.get(), len1);
  socket->write(&wcb3, buf.get() + len1, 0);
  socket->write(&wcb4, buf.get() + len1, len2);
  socket->close();

  evb.loop(); // loop until the data is sent

  ASSERT_EQ(wcb1.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb2.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb3.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb4.state, STATE_SUCCEEDED);
  rcb.verifyData(buf.get(), len1 + len2);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

TEST(AsyncSocketTest, ZeroLengthWritev) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket =
      AsyncSocket::newSocket(&evb, server.getAddress(), 30);
  evb.loop(); // loop until the socket is connected

  auto acceptedSocket = server.acceptAsync(&evb);
  ReadCallback rcb;
  acceptedSocket->setReadCB(&rcb);

  size_t len1 = 1024 * 1024;
  size_t len2 = 1024 * 1024;
  std::unique_ptr<char[]> buf(new char[len1 + len2]);
  memset(buf.get(), 'a', len1);
  memset(buf.get(), 'b', len2);

  WriteCallback wcb;
  constexpr size_t iovCount = 4;
  struct iovec iov[iovCount];
  iov[0].iov_base = buf.get();
  iov[0].iov_len = len1;
  iov[1].iov_base = buf.get() + len1;
  iov[1].iov_len = 0;
  iov[2].iov_base = buf.get() + len1;
  iov[2].iov_len = len2;
  iov[3].iov_base = buf.get() + len1 + len2;
  iov[3].iov_len = 0;

  socket->writev(&wcb, iov, iovCount);
  socket->close();
  evb.loop(); // loop until the data is sent

  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);
  rcb.verifyData(buf.get(), len1 + len2);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

///////////////////////////////////////////////////////////////////////////
// close() related tests
///////////////////////////////////////////////////////////////////////////

/**
 * Test calling close() with pending writes when the socket is already closing.
 */
TEST(AsyncSocketTest, ClosePendingWritesWhileClosing) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // accept the socket on the server side
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();

  // Loop to ensure the connect has completed
  evb.loop();

  // Make sure we are connected
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  // Schedule pending writes, until several write attempts have blocked
  char buf[128];
  memset(buf, 'a', sizeof(buf));
  typedef vector<std::shared_ptr<WriteCallback>> WriteCallbackVector;
  WriteCallbackVector writeCallbacks;

  writeCallbacks.reserve(5);
  while (writeCallbacks.size() < 5) {
    std::shared_ptr<WriteCallback> wcb(new WriteCallback);

    socket->write(wcb.get(), buf, sizeof(buf));
    if (wcb->state == STATE_SUCCEEDED) {
      // Succeeded immediately.  Keep performing more writes
      continue;
    }

    // This write is blocked.
    // Have the write callback call close() when writeError() is invoked
    wcb->errorCallback = std::bind(&AsyncSocket::close, socket.get());
    writeCallbacks.push_back(wcb);
  }

  // Call closeNow() to immediately fail the pending writes
  socket->closeNow();

  // Make sure writeError() was invoked on all of the pending write callbacks
  for (WriteCallbackVector::const_iterator it = writeCallbacks.begin();
       it != writeCallbacks.end();
       ++it) {
    ASSERT_EQ((*it)->state, STATE_FAILED);
  }

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

///////////////////////////////////////////////////////////////////////////
// ImmediateRead related tests
///////////////////////////////////////////////////////////////////////////

/* AsyncSocket use to verify immediate read works */
class AsyncSocketImmediateRead : public folly::AsyncSocket {
 public:
  bool immediateReadCalled = false;
  explicit AsyncSocketImmediateRead(folly::EventBase* evb) : AsyncSocket(evb) {}

 protected:
  void checkForImmediateRead() noexcept override {
    immediateReadCalled = true;
    AsyncSocket::handleRead();
  }
};

TEST(AsyncSocket, ConnectReadImmediateRead) {
  TestServer server;

  const size_t maxBufferSz = 100;
  const size_t maxReadsPerEvent = 1;
  const size_t expectedDataSz = maxBufferSz * 3;
  char expectedData[expectedDataSz];
  memset(expectedData, 'j', expectedDataSz);

  EventBase evb;
  ReadCallback rcb(maxBufferSz);
  AsyncSocketImmediateRead socket(&evb);
  socket.connect(nullptr, server.getAddress(), 30);

  evb.loop(); // loop until the socket is connected

  socket.setReadCB(&rcb);
  socket.setMaxReadsPerEvent(maxReadsPerEvent);
  socket.immediateReadCalled = false;

  auto acceptedSocket = server.acceptAsync(&evb);

  ReadCallback rcbServer;
  WriteCallback wcbServer;
  rcbServer.dataAvailableCallback = [&]() {
    if (rcbServer.dataRead() == expectedDataSz) {
      // write back all data read
      rcbServer.verifyData(expectedData, expectedDataSz);
      acceptedSocket->write(&wcbServer, expectedData, expectedDataSz);
      acceptedSocket->close();
    }
  };
  acceptedSocket->setReadCB(&rcbServer);

  // write data
  WriteCallback wcb1;
  socket.write(&wcb1, expectedData, expectedDataSz);
  evb.loop();
  ASSERT_EQ(wcb1.state, STATE_SUCCEEDED);
  rcb.verifyData(expectedData, expectedDataSz);
  ASSERT_EQ(socket.immediateReadCalled, true);

  ASSERT_FALSE(socket.isClosedBySelf());
  ASSERT_FALSE(socket.isClosedByPeer());
}

TEST(AsyncSocket, ConnectReadUninstallRead) {
  TestServer server;

  const size_t maxBufferSz = 100;
  const size_t maxReadsPerEvent = 1;
  const size_t expectedDataSz = maxBufferSz * 3;
  char expectedData[expectedDataSz];
  memset(expectedData, 'k', expectedDataSz);

  EventBase evb;
  ReadCallback rcb(maxBufferSz);
  AsyncSocketImmediateRead socket(&evb);
  socket.connect(nullptr, server.getAddress(), 30);

  evb.loop(); // loop until the socket is connected

  socket.setReadCB(&rcb);
  socket.setMaxReadsPerEvent(maxReadsPerEvent);
  socket.immediateReadCalled = false;

  auto acceptedSocket = server.acceptAsync(&evb);

  ReadCallback rcbServer;
  WriteCallback wcbServer;
  rcbServer.dataAvailableCallback = [&]() {
    if (rcbServer.dataRead() == expectedDataSz) {
      // write back all data read
      rcbServer.verifyData(expectedData, expectedDataSz);
      acceptedSocket->write(&wcbServer, expectedData, expectedDataSz);
      acceptedSocket->close();
    }
  };
  acceptedSocket->setReadCB(&rcbServer);

  rcb.dataAvailableCallback = [&]() {
    // we read data and reset readCB
    socket.setReadCB(nullptr);
  };

  // write data
  WriteCallback wcb;
  socket.write(&wcb, expectedData, expectedDataSz);
  evb.loop();
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  /* we shoud've only read maxBufferSz data since readCallback_
   * was reset in dataAvailableCallback */
  ASSERT_EQ(rcb.dataRead(), maxBufferSz);
  ASSERT_EQ(socket.immediateReadCalled, false);

  ASSERT_FALSE(socket.isClosedBySelf());
  ASSERT_FALSE(socket.isClosedByPeer());
}

// TODO:
// - Test connect() and have the connect callback set the read callback
// - Test connect() and have the connect callback unset the read callback
// - Test reading/writing/closing/destroying the socket in the connect callback
// - Test reading/writing/closing/destroying the socket in the read callback
// - Test reading/writing/closing/destroying the socket in the write callback
// - Test one-way shutdown behavior
// - Test changing the EventBase
//
// - TODO: test multiple threads sharing a AsyncSocket, and detaching from it
//   in connectSuccess(), readDataAvailable(), writeSuccess()

///////////////////////////////////////////////////////////////////////////
// AsyncServerSocket tests
///////////////////////////////////////////////////////////////////////////

/**
 * Make sure accepted sockets have O_NONBLOCK and TCP_NODELAY set
 */
TEST(AsyncSocketTest, ServerAcceptOptions) {
  EventBase eventBase;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  serverSocket->bind(0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
  });
  serverSocket->addAcceptCallback(&acceptCallback, &eventBase);
  serverSocket->startAccepting();

  // Connect to the server socket
  std::shared_ptr<AsyncSocket> socket(
      AsyncSocket::newSocket(&eventBase, serverAddress));

  eventBase.loop();

  // Verify that the server accepted a connection
  ASSERT_EQ(acceptCallback.getEvents()->size(), 3);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(2).type, TestAcceptCallback::TYPE_STOP);
  int fd = acceptCallback.getEvents()->at(1).fd;

  // The accepted connection should already be in non-blocking mode
  int flags = fcntl(fd, F_GETFL, 0);
  ASSERT_EQ(flags & O_NONBLOCK, O_NONBLOCK);

#ifndef TCP_NOPUSH
  // The accepted connection should already have TCP_NODELAY set
  int value;
  socklen_t valueLength = sizeof(value);
  int rc = getsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &value, &valueLength);
  ASSERT_EQ(rc, 0);
  ASSERT_EQ(value, 1);
#endif
}

/**
 * Test AsyncServerSocket::removeAcceptCallback()
 */
TEST(AsyncSocketTest, RemoveAcceptCallback) {
  // Create a new AsyncServerSocket
  EventBase eventBase;
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  serverSocket->bind(0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add several accept callbacks
  TestAcceptCallback cb1;
  TestAcceptCallback cb2;
  TestAcceptCallback cb3;
  TestAcceptCallback cb4;
  TestAcceptCallback cb5;
  TestAcceptCallback cb6;
  TestAcceptCallback cb7;

  // Test having callbacks remove other callbacks before them on the list,
  // after them on the list, or removing themselves.
  //
  // Have callback 2 remove callback 3 and callback 5 the first time it is
  // called.
  int cb2Count = 0;
  cb1.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        std::shared_ptr<AsyncSocket> sock2(AsyncSocket::newSocket(
            &eventBase, serverAddress)); // cb2: -cb3 -cb5
      });
  cb3.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {});
  cb4.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        std::shared_ptr<AsyncSocket> sock3(
            AsyncSocket::newSocket(&eventBase, serverAddress)); // cb4
      });
  cb5.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        std::shared_ptr<AsyncSocket> sock5(
            AsyncSocket::newSocket(&eventBase, serverAddress)); // cb7: -cb7
      });
  cb2.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        if (cb2Count == 0) {
          serverSocket->removeAcceptCallback(&cb3, nullptr);
          serverSocket->removeAcceptCallback(&cb5, nullptr);
        }
        ++cb2Count;
      });
  // Have callback 6 remove callback 4 the first time it is called,
  // and destroy the server socket the second time it is called
  int cb6Count = 0;
  cb6.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        if (cb6Count == 0) {
          serverSocket->removeAcceptCallback(&cb4, nullptr);
          std::shared_ptr<AsyncSocket> sock6(
              AsyncSocket::newSocket(&eventBase, serverAddress)); // cb1
          std::shared_ptr<AsyncSocket> sock7(
              AsyncSocket::newSocket(&eventBase, serverAddress)); // cb2
          std::shared_ptr<AsyncSocket> sock8(
              AsyncSocket::newSocket(&eventBase, serverAddress)); // cb6: stop

        } else {
          serverSocket.reset();
        }
        ++cb6Count;
      });
  // Have callback 7 remove itself
  cb7.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&cb7, nullptr);
      });

  serverSocket->addAcceptCallback(&cb1, &eventBase);
  serverSocket->addAcceptCallback(&cb2, &eventBase);
  serverSocket->addAcceptCallback(&cb3, &eventBase);
  serverSocket->addAcceptCallback(&cb4, &eventBase);
  serverSocket->addAcceptCallback(&cb5, &eventBase);
  serverSocket->addAcceptCallback(&cb6, &eventBase);
  serverSocket->addAcceptCallback(&cb7, &eventBase);
  serverSocket->startAccepting();

  // Make several connections to the socket
  std::shared_ptr<AsyncSocket> sock1(
      AsyncSocket::newSocket(&eventBase, serverAddress)); // cb1
  std::shared_ptr<AsyncSocket> sock4(
      AsyncSocket::newSocket(&eventBase, serverAddress)); // cb6: -cb4

  // Loop until we are stopped
  eventBase.loop();

  // Check to make sure that the expected callbacks were invoked.
  //
  // NOTE: This code depends on the AsyncServerSocket operating calling all of
  // the AcceptCallbacks in round-robin fashion, in the order that they were
  // added.  The code is implemented this way right now, but the API doesn't
  // explicitly require it be done this way.  If we change the code not to be
  // exactly round robin in the future, we can simplify the test checks here.
  // (We'll also need to update the termination code, since we expect cb6 to
  // get called twice to terminate the loop.)
  ASSERT_EQ(cb1.getEvents()->size(), 4);
  ASSERT_EQ(cb1.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb1.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb1.getEvents()->at(2).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb1.getEvents()->at(3).type, TestAcceptCallback::TYPE_STOP);

  ASSERT_EQ(cb2.getEvents()->size(), 4);
  ASSERT_EQ(cb2.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb2.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb2.getEvents()->at(2).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb2.getEvents()->at(3).type, TestAcceptCallback::TYPE_STOP);

  ASSERT_EQ(cb3.getEvents()->size(), 2);
  ASSERT_EQ(cb3.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb3.getEvents()->at(1).type, TestAcceptCallback::TYPE_STOP);

  ASSERT_EQ(cb4.getEvents()->size(), 3);
  ASSERT_EQ(cb4.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb4.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb4.getEvents()->at(2).type, TestAcceptCallback::TYPE_STOP);

  ASSERT_EQ(cb5.getEvents()->size(), 2);
  ASSERT_EQ(cb5.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb5.getEvents()->at(1).type, TestAcceptCallback::TYPE_STOP);

  ASSERT_EQ(cb6.getEvents()->size(), 4);
  ASSERT_EQ(cb6.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb6.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb6.getEvents()->at(2).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb6.getEvents()->at(3).type, TestAcceptCallback::TYPE_STOP);

  ASSERT_EQ(cb7.getEvents()->size(), 3);
  ASSERT_EQ(cb7.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb7.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb7.getEvents()->at(2).type, TestAcceptCallback::TYPE_STOP);
}

/**
 * Test AsyncServerSocket::removeAcceptCallback()
 */
TEST(AsyncSocketTest, OtherThreadAcceptCallback) {
  // Create a new AsyncServerSocket
  EventBase eventBase;
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  serverSocket->bind(0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add several accept callbacks
  TestAcceptCallback cb1;
  auto thread_id = std::this_thread::get_id();
  cb1.setAcceptStartedFn([&]() {
    CHECK_NE(thread_id, std::this_thread::get_id());
    thread_id = std::this_thread::get_id();
  });
  cb1.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        ASSERT_EQ(thread_id, std::this_thread::get_id());
        serverSocket->removeAcceptCallback(&cb1, &eventBase);
      });
  cb1.setAcceptStoppedFn(
      [&]() { ASSERT_EQ(thread_id, std::this_thread::get_id()); });

  // Test having callbacks remove other callbacks before them on the list,
  serverSocket->addAcceptCallback(&cb1, &eventBase);
  serverSocket->startAccepting();

  // Make several connections to the socket
  std::shared_ptr<AsyncSocket> sock1(
      AsyncSocket::newSocket(&eventBase, serverAddress)); // cb1

  // Loop in another thread
  auto other = std::thread([&]() { eventBase.loop(); });
  other.join();

  // Check to make sure that the expected callbacks were invoked.
  //
  // NOTE: This code depends on the AsyncServerSocket operating calling all of
  // the AcceptCallbacks in round-robin fashion, in the order that they were
  // added.  The code is implemented this way right now, but the API doesn't
  // explicitly require it be done this way.  If we change the code not to be
  // exactly round robin in the future, we can simplify the test checks here.
  // (We'll also need to update the termination code, since we expect cb6 to
  // get called twice to terminate the loop.)
  ASSERT_EQ(cb1.getEvents()->size(), 3);
  ASSERT_EQ(cb1.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(cb1.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(cb1.getEvents()->at(2).type, TestAcceptCallback::TYPE_STOP);
}

void serverSocketSanityTest(AsyncServerSocket* serverSocket) {
  EventBase* eventBase = serverSocket->getEventBase();
  CHECK(eventBase);

  // Add a callback to accept one connection then stop accepting
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, eventBase);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, eventBase);
  });
  serverSocket->addAcceptCallback(&acceptCallback, eventBase);
  serverSocket->startAccepting();

  // Connect to the server socket
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);
  AsyncSocket::UniquePtr socket(new AsyncSocket(eventBase, serverAddress));

  // Loop to process all events
  eventBase->loop();

  // Verify that the server accepted a connection
  ASSERT_EQ(acceptCallback.getEvents()->size(), 3);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(2).type, TestAcceptCallback::TYPE_STOP);
}

/* Verify that we don't leak sockets if we are destroyed()
 * and there are still writes pending
 *
 * If destroy() only calls close() instead of closeNow(),
 * it would shutdown(writes) on the socket, but it would
 * never be close()'d, and the socket would leak
 */
TEST(AsyncSocketTest, DestroyCloseTest) {
  TestServer server;

  // connect()
  EventBase clientEB;
  EventBase serverEB;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&clientEB);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // Accept the connection
  std::shared_ptr<AsyncSocket> acceptedSocket = server.acceptAsync(&serverEB);
  ReadCallback rcb;
  acceptedSocket->setReadCB(&rcb);

  // Write a large buffer to the socket that is larger than kernel buffer
  size_t simpleBufLength = 5000000;
  char* simpleBuf = new char[simpleBufLength];
  memset(simpleBuf, 'a', simpleBufLength);
  WriteCallback wcb;

  // Let the reads and writes run to completion
  int fd = acceptedSocket->getFd();

  acceptedSocket->write(&wcb, simpleBuf, simpleBufLength);
  socket.reset();
  acceptedSocket.reset();

  // Test that server socket was closed
  folly::test::msvcSuppressAbortOnInvalidParams([&] {
    ssize_t sz = read(fd, simpleBuf, simpleBufLength);
    ASSERT_EQ(sz, -1);
    ASSERT_EQ(errno, EBADF);
  });
  delete[] simpleBuf;
}

/**
 * Test AsyncServerSocket::useExistingSocket()
 */
TEST(AsyncSocketTest, ServerExistingSocket) {
  EventBase eventBase;

  // Test creating a socket, and letting AsyncServerSocket bind and listen
  {
    // Manually create a socket
    int fd = fsp::socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    ASSERT_GE(fd, 0);

    // Create a server socket
    AsyncServerSocket::UniquePtr serverSocket(
        new AsyncServerSocket(&eventBase));
    serverSocket->useExistingSocket(fd);
    folly::SocketAddress address;
    serverSocket->getAddress(&address);
    address.setPort(0);
    serverSocket->bind(address);
    serverSocket->listen(16);

    // Make sure the socket works
    serverSocketSanityTest(serverSocket.get());
  }

  // Test creating a socket and binding manually,
  // then letting AsyncServerSocket listen
  {
    // Manually create a socket
    int fd = fsp::socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    ASSERT_GE(fd, 0);
    // bind
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = 0;
    addr.sin_addr.s_addr = INADDR_ANY;
    ASSERT_EQ(
        bind(fd, reinterpret_cast<struct sockaddr*>(&addr), sizeof(addr)), 0);
    // Look up the address that we bound to
    folly::SocketAddress boundAddress;
    boundAddress.setFromLocalAddress(fd);

    // Create a server socket
    AsyncServerSocket::UniquePtr serverSocket(
        new AsyncServerSocket(&eventBase));
    serverSocket->useExistingSocket(fd);
    serverSocket->listen(16);

    // Make sure AsyncServerSocket reports the same address that we bound to
    folly::SocketAddress serverSocketAddress;
    serverSocket->getAddress(&serverSocketAddress);
    ASSERT_EQ(boundAddress, serverSocketAddress);

    // Make sure the socket works
    serverSocketSanityTest(serverSocket.get());
  }

  // Test creating a socket, binding and listening manually,
  // then giving it to AsyncServerSocket
  {
    // Manually create a socket
    int fd = fsp::socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    ASSERT_GE(fd, 0);
    // bind
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = 0;
    addr.sin_addr.s_addr = INADDR_ANY;
    ASSERT_EQ(
        bind(fd, reinterpret_cast<struct sockaddr*>(&addr), sizeof(addr)), 0);
    // Look up the address that we bound to
    folly::SocketAddress boundAddress;
    boundAddress.setFromLocalAddress(fd);
    // listen
    ASSERT_EQ(listen(fd, 16), 0);

    // Create a server socket
    AsyncServerSocket::UniquePtr serverSocket(
        new AsyncServerSocket(&eventBase));
    serverSocket->useExistingSocket(fd);

    // Make sure AsyncServerSocket reports the same address that we bound to
    folly::SocketAddress serverSocketAddress;
    serverSocket->getAddress(&serverSocketAddress);
    ASSERT_EQ(boundAddress, serverSocketAddress);

    // Make sure the socket works
    serverSocketSanityTest(serverSocket.get());
  }
}

TEST(AsyncSocketTest, UnixDomainSocketTest) {
  EventBase eventBase;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  string path(1, 0);
  path.append(folly::to<string>("/anonymous", folly::Random::rand64()));
  folly::SocketAddress serverAddress;
  serverAddress.setFromPath(path);
  serverSocket->bind(serverAddress);
  serverSocket->listen(16);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
  });
  serverSocket->addAcceptCallback(&acceptCallback, &eventBase);
  serverSocket->startAccepting();

  // Connect to the server socket
  std::shared_ptr<AsyncSocket> socket(
      AsyncSocket::newSocket(&eventBase, serverAddress));

  eventBase.loop();

  // Verify that the server accepted a connection
  ASSERT_EQ(acceptCallback.getEvents()->size(), 3);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(0).type, TestAcceptCallback::TYPE_START);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(1).type, TestAcceptCallback::TYPE_ACCEPT);
  ASSERT_EQ(
      acceptCallback.getEvents()->at(2).type, TestAcceptCallback::TYPE_STOP);
  int fd = acceptCallback.getEvents()->at(1).fd;

  // The accepted connection should already be in non-blocking mode
  int flags = fcntl(fd, F_GETFL, 0);
  ASSERT_EQ(flags & O_NONBLOCK, O_NONBLOCK);
}

TEST(AsyncSocketTest, ConnectionEventCallbackDefault) {
  EventBase eventBase;
  TestConnectionEventCallback connectionEventCallback;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  serverSocket->setConnectionEventCallback(&connectionEventCallback);
  serverSocket->bind(0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
  });
  serverSocket->addAcceptCallback(&acceptCallback, &eventBase);
  serverSocket->startAccepting();

  // Connect to the server socket
  std::shared_ptr<AsyncSocket> socket(
      AsyncSocket::newSocket(&eventBase, serverAddress));

  eventBase.loop();

  // Validate the connection event counters
  ASSERT_EQ(connectionEventCallback.getConnectionAccepted(), 1);
  ASSERT_EQ(connectionEventCallback.getConnectionAcceptedError(), 0);
  ASSERT_EQ(connectionEventCallback.getConnectionDropped(), 0);
  ASSERT_EQ(
      connectionEventCallback.getConnectionEnqueuedForAcceptCallback(), 0);
  ASSERT_EQ(connectionEventCallback.getConnectionDequeuedByAcceptCallback(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffStarted(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffEnded(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffError(), 0);
}

TEST(AsyncSocketTest, CallbackInPrimaryEventBase) {
  EventBase eventBase;
  TestConnectionEventCallback connectionEventCallback;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  serverSocket->setConnectionEventCallback(&connectionEventCallback);
  serverSocket->bind(0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
  });
  bool acceptStartedFlag{false};
  acceptCallback.setAcceptStartedFn(
      [&acceptStartedFlag]() { acceptStartedFlag = true; });
  bool acceptStoppedFlag{false};
  acceptCallback.setAcceptStoppedFn(
      [&acceptStoppedFlag]() { acceptStoppedFlag = true; });
  serverSocket->addAcceptCallback(&acceptCallback, nullptr);
  serverSocket->startAccepting();

  // Connect to the server socket
  std::shared_ptr<AsyncSocket> socket(
      AsyncSocket::newSocket(&eventBase, serverAddress));

  eventBase.loop();

  ASSERT_TRUE(acceptStartedFlag);
  ASSERT_TRUE(acceptStoppedFlag);
  // Validate the connection event counters
  ASSERT_EQ(connectionEventCallback.getConnectionAccepted(), 1);
  ASSERT_EQ(connectionEventCallback.getConnectionAcceptedError(), 0);
  ASSERT_EQ(connectionEventCallback.getConnectionDropped(), 0);
  ASSERT_EQ(
      connectionEventCallback.getConnectionEnqueuedForAcceptCallback(), 0);
  ASSERT_EQ(connectionEventCallback.getConnectionDequeuedByAcceptCallback(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffStarted(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffEnded(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffError(), 0);
}

TEST(AsyncSocketTest, CallbackInSecondaryEventBase) {
  EventBase eventBase;
  TestConnectionEventCallback connectionEventCallback;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  serverSocket->setConnectionEventCallback(&connectionEventCallback);
  serverSocket->bind(0);
  serverSocket->listen(16);
  SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  ScopedEventBaseThread cobThread("ioworker_test");
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const SocketAddress& /* addr */) {
        eventBase.runInEventBaseThread([&] {
          serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
        });
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    eventBase.runInEventBaseThread(
        [&] { serverSocket->removeAcceptCallback(&acceptCallback, nullptr); });
  });
  std::atomic<bool> acceptStartedFlag{false};
  acceptCallback.setAcceptStartedFn([&]() { acceptStartedFlag = true; });
  Baton<> acceptStoppedFlag;
  acceptCallback.setAcceptStoppedFn([&]() { acceptStoppedFlag.post(); });
  serverSocket->addAcceptCallback(&acceptCallback, cobThread.getEventBase());
  serverSocket->startAccepting();

  // Connect to the server socket
  std::shared_ptr<AsyncSocket> socket(
      AsyncSocket::newSocket(&eventBase, serverAddress));

  eventBase.loop();

  ASSERT_TRUE(acceptStoppedFlag.try_wait_for(std::chrono::seconds(1)));
  ASSERT_TRUE(acceptStartedFlag);
  // Validate the connection event counters
  ASSERT_EQ(connectionEventCallback.getConnectionAccepted(), 1);
  ASSERT_EQ(connectionEventCallback.getConnectionAcceptedError(), 0);
  ASSERT_EQ(connectionEventCallback.getConnectionDropped(), 0);
  ASSERT_EQ(
      connectionEventCallback.getConnectionEnqueuedForAcceptCallback(), 1);
  ASSERT_EQ(connectionEventCallback.getConnectionDequeuedByAcceptCallback(), 1);
  ASSERT_EQ(connectionEventCallback.getBackoffStarted(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffEnded(), 0);
  ASSERT_EQ(connectionEventCallback.getBackoffError(), 0);
}

/**
 * Test AsyncServerSocket::getNumPendingMessagesInQueue()
 */
TEST(AsyncSocketTest, NumPendingMessagesInQueue) {
  EventBase eventBase;

  // Counter of how many connections have been accepted
  int count = 0;

  // Create a server socket
  auto serverSocket(AsyncServerSocket::newSocket(&eventBase));
  serverSocket->bind(0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Add a callback to accept connections
  folly::ScopedEventBaseThread cobThread("ioworker_test");
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        count++;
        eventBase.runInEventBaseThreadAndWait([&] {
          ASSERT_EQ(4 - count, serverSocket->getNumPendingMessagesInQueue());
        });
        if (count == 4) {
          eventBase.runInEventBaseThread([&] {
            serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
          });
        }
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    eventBase.runInEventBaseThread(
        [&] { serverSocket->removeAcceptCallback(&acceptCallback, nullptr); });
  });
  serverSocket->addAcceptCallback(&acceptCallback, cobThread.getEventBase());
  serverSocket->startAccepting();

  // Connect to the server socket, 4 clients, there are 4 connections
  auto socket1(AsyncSocket::newSocket(&eventBase, serverAddress));
  auto socket2(AsyncSocket::newSocket(&eventBase, serverAddress));
  auto socket3(AsyncSocket::newSocket(&eventBase, serverAddress));
  auto socket4(AsyncSocket::newSocket(&eventBase, serverAddress));

  eventBase.loop();
  ASSERT_EQ(4, count);
}

TEST(AsyncSocketTest, ConnectionsStorm) {
  enum class AcceptCobLocation {
    Default,
    Primary,
    Secondary,
  };

  auto testFunc = [](AcceptCobLocation mode) {
    EventBase eventBase;

    // Counter of how many connections have been accepted
    std::atomic<size_t> count{0};

    // Create a server socket
    auto serverSocket(AsyncServerSocket::newSocket(&eventBase));
    serverSocket->bind(0);
    serverSocket->listen(100);
    folly::SocketAddress serverAddress;
    serverSocket->getAddress(&serverAddress);

    TestConnectionEventCallback connectionEventCallback;
    serverSocket->setConnectionEventCallback(&connectionEventCallback);

    // Add a callback to accept connections
    std::shared_ptr<ScopedEventBaseThread> thread;
    TestAcceptCallback acceptCallback;
    bool stopAccepting = false;
    const size_t maxSockets = 2000;
    acceptCallback.setConnectionAcceptedFn(
        [&](int /* fd */, const folly::SocketAddress& /* addr */) {
          count++;
          if (!stopAccepting &&
              (count == maxSockets ||
               connectionEventCallback.getConnectionDropped() > 0)) {
            stopAccepting = true;
            eventBase.runInEventBaseThread([&] {
              serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
            });
          }
        });
    acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
      eventBase.runInEventBaseThread([&] {
        stopAccepting = true;
        serverSocket->removeAcceptCallback(&acceptCallback, nullptr);
      });
    });
    if (mode == AcceptCobLocation::Default) {
      serverSocket->addAcceptCallback(&acceptCallback, nullptr);
    } else if (mode == AcceptCobLocation::Primary) {
      serverSocket->addAcceptCallback(&acceptCallback, &eventBase);
    } else if (mode == AcceptCobLocation::Secondary) {
      thread = std::make_shared<ScopedEventBaseThread>();
      serverSocket->addAcceptCallback(&acceptCallback, thread->getEventBase());
    }
    serverSocket->startAccepting();

    // Create connection storm to create connections fast but
    // also pace it to not overflow servers' listening queue.
    vector<std::shared_ptr<AsyncSocket>> sockets;
    folly::Function<void()> fnOpenSockets = [&]() {
      // Counter of connections pending the invocation of accept callback.
      auto pending = serverSocket->getNumPendingMessagesInQueue();
      while (sockets.size() < std::min(maxSockets, pending + count + 30)) {
        auto socket = folly::AsyncSocket::newSocket(&eventBase);
        socket->connect(nullptr, serverAddress, 5000);
        sockets.push_back(socket);
      }
      if (sockets.size() < maxSockets && !stopAccepting) {
        eventBase.runInEventBaseThread([&] { fnOpenSockets(); });
      }
    };

    eventBase.runInEventBaseThread([&] { fnOpenSockets(); });

    eventBase.loop();
    ASSERT_EQ(maxSockets, count);
  };

  testFunc(AcceptCobLocation::Default);
  testFunc(AcceptCobLocation::Primary);
  testFunc(AcceptCobLocation::Secondary);
}

/**
 * Test AsyncTransport::BufferCallback
 */
TEST(AsyncSocketTest, BufferTest) {
  TestServer server;

  EventBase evb;
  AsyncSocket::OptionMap option{{{SOL_SOCKET, SO_SNDBUF}, 128}};
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30, option);

  char buf[100 * 1024];
  memset(buf, 'c', sizeof(buf));
  WriteCallback wcb;
  BufferCallback bcb;
  socket->setBufferCallback(&bcb);
  socket->write(&wcb, buf, sizeof(buf), WriteFlags::NONE);

  evb.loop();
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  ASSERT_TRUE(bcb.hasBuffered());
  ASSERT_TRUE(bcb.hasBufferCleared());

  socket->close();
  server.verifyConnection(buf, sizeof(buf));

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

TEST(AsyncSocketTest, BufferCallbackKill) {
  TestServer server;
  EventBase evb;
  AsyncSocket::OptionMap option{{{SOL_SOCKET, SO_SNDBUF}, 128}};
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30, option);
  evb.loopOnce();

  char buf[100 * 1024];
  memset(buf, 'c', sizeof(buf));
  BufferCallback bcb;
  socket->setBufferCallback(&bcb);
  WriteCallback wcb;
  wcb.successCallback = [&] {
    ASSERT_TRUE(socket.unique());
    socket.reset();
  };

  // This will trigger AsyncSocket::handleWrite,
  // which calls WriteCallback::writeSuccess,
  // which calls wcb.successCallback above,
  // which tries to delete socket
  // Then, the socket will also try to use this BufferCallback
  // And that should crash us, if there is no DestructorGuard on the stack
  socket->write(&wcb, buf, sizeof(buf), WriteFlags::NONE);

  evb.loop();
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);
}

#if FOLLY_ALLOW_TFO
TEST(AsyncSocketTest, ConnectTFO) {
  // Start listening on a local port
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->enableTFO();
  ConnCallback cb;
  socket->connect(&cb, server.getAddress(), 30);

  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());

  std::array<uint8_t, 3> readBuf;
  auto sendBuf = IOBuf::copyBuffer("hey");

  std::thread t([&] {
    auto acceptedSocket = server.accept();
    acceptedSocket->write(buf.data(), buf.size());
    acceptedSocket->flush();
    acceptedSocket->readAll(readBuf.data(), readBuf.size());
    acceptedSocket->close();
  });

  evb.loop();

  ASSERT_EQ(cb.state, STATE_SUCCEEDED);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(30));
  EXPECT_TRUE(socket->getTFOAttempted());

  // Should trigger the connect
  WriteCallback write;
  ReadCallback rcb;
  socket->writeChain(&write, sendBuf->clone());
  socket->setReadCB(&rcb);
  evb.loop();

  t.join();

  EXPECT_EQ(STATE_SUCCEEDED, write.state);
  EXPECT_EQ(0, memcmp(readBuf.data(), sendBuf->data(), readBuf.size()));
  EXPECT_EQ(STATE_SUCCEEDED, rcb.state);
  ASSERT_EQ(1, rcb.buffers.size());
  ASSERT_EQ(sizeof(buf), rcb.buffers[0].length);
  EXPECT_EQ(0, memcmp(rcb.buffers[0].buffer, buf.data(), buf.size()));
  EXPECT_EQ(socket->getTFOFinished(), socket->getTFOSucceded());
}

TEST(AsyncSocketTest, ConnectTFOSupplyEarlyReadCB) {
  // Start listening on a local port
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->enableTFO();
  ConnCallback cb;
  socket->connect(&cb, server.getAddress(), 30);
  ReadCallback rcb;
  socket->setReadCB(&rcb);

  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());

  std::array<uint8_t, 3> readBuf;
  auto sendBuf = IOBuf::copyBuffer("hey");

  std::thread t([&] {
    auto acceptedSocket = server.accept();
    acceptedSocket->write(buf.data(), buf.size());
    acceptedSocket->flush();
    acceptedSocket->readAll(readBuf.data(), readBuf.size());
    acceptedSocket->close();
  });

  evb.loop();

  ASSERT_EQ(cb.state, STATE_SUCCEEDED);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(30));
  EXPECT_TRUE(socket->getTFOAttempted());

  // Should trigger the connect
  WriteCallback write;
  socket->writeChain(&write, sendBuf->clone());
  evb.loop();

  t.join();

  EXPECT_EQ(STATE_SUCCEEDED, write.state);
  EXPECT_EQ(0, memcmp(readBuf.data(), sendBuf->data(), readBuf.size()));
  EXPECT_EQ(STATE_SUCCEEDED, rcb.state);
  ASSERT_EQ(1, rcb.buffers.size());
  ASSERT_EQ(sizeof(buf), rcb.buffers[0].length);
  EXPECT_EQ(0, memcmp(rcb.buffers[0].buffer, buf.data(), buf.size()));
  EXPECT_EQ(socket->getTFOFinished(), socket->getTFOSucceded());
}

/**
 * Test connecting to a server that isn't listening
 */
TEST(AsyncSocketTest, ConnectRefusedImmediatelyTFO) {
  EventBase evb;

  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  socket->enableTFO();

  // Hopefully nothing is actually listening on this address
  folly::SocketAddress addr("::1", 65535);
  ConnCallback cb;
  socket->connect(&cb, addr, 30);

  evb.loop();

  WriteCallback write1;
  // Trigger the connect if TFO attempt is supported.
  socket->writeChain(&write1, IOBuf::copyBuffer("hey"));
  WriteCallback write2;
  socket->writeChain(&write2, IOBuf::copyBuffer("hey"));
  evb.loop();

  if (!socket->getTFOFinished()) {
    EXPECT_EQ(STATE_FAILED, write1.state);
  } else {
    EXPECT_EQ(STATE_SUCCEEDED, write1.state);
    EXPECT_FALSE(socket->getTFOSucceded());
  }

  EXPECT_EQ(STATE_FAILED, write2.state);

  EXPECT_EQ(STATE_SUCCEEDED, cb.state);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(std::chrono::milliseconds(30), socket->getConnectTimeout());
  EXPECT_TRUE(socket->getTFOAttempted());
}

/**
 * Test calling closeNow() immediately after connecting.
 */
TEST(AsyncSocketTest, ConnectWriteAndCloseNowTFO) {
  TestServer server(true);

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->enableTFO();

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  // write()
  std::array<char, 128> buf;
  memset(buf.data(), 'a', buf.size());

  // close()
  socket->closeNow();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

/**
 * Test calling close() immediately after connect()
 */
TEST(AsyncSocketTest, ConnectAndCloseTFO) {
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->enableTFO();

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  socket->close();

  // Loop, although there shouldn't be anything to do.
  evb.loop();

  // Make sure the connection was aborted
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

class MockAsyncTFOSocket : public AsyncSocket {
 public:
  using UniquePtr = std::unique_ptr<MockAsyncTFOSocket, Destructor>;

  explicit MockAsyncTFOSocket(EventBase* evb) : AsyncSocket(evb) {}

  MOCK_METHOD3(tfoSendMsg, ssize_t(int fd, struct msghdr* msg, int msg_flags));
};

TEST(AsyncSocketTest, TestTFOUnsupported) {
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  auto socket = MockAsyncTFOSocket::UniquePtr(new MockAsyncTFOSocket(&evb));
  socket->enableTFO();

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  ReadCallback rcb;
  socket->setReadCB(&rcb);

  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .WillOnce(SetErrnoAndReturn(EOPNOTSUPP, -1));
  WriteCallback write;
  auto sendBuf = IOBuf::copyBuffer("hey");
  socket->writeChain(&write, sendBuf->clone());
  EXPECT_EQ(STATE_WAITING, write.state);

  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());

  std::array<uint8_t, 3> readBuf;

  std::thread t([&] {
    std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();
    acceptedSocket->write(buf.data(), buf.size());
    acceptedSocket->flush();
    acceptedSocket->readAll(readBuf.data(), readBuf.size());
    acceptedSocket->close();
  });

  evb.loop();

  t.join();
  EXPECT_EQ(STATE_SUCCEEDED, ccb.state);
  EXPECT_EQ(STATE_SUCCEEDED, write.state);

  EXPECT_EQ(0, memcmp(readBuf.data(), sendBuf->data(), readBuf.size()));
  EXPECT_EQ(STATE_SUCCEEDED, rcb.state);
  ASSERT_EQ(1, rcb.buffers.size());
  ASSERT_EQ(sizeof(buf), rcb.buffers[0].length);
  EXPECT_EQ(0, memcmp(rcb.buffers[0].buffer, buf.data(), buf.size()));
  EXPECT_EQ(socket->getTFOFinished(), socket->getTFOSucceded());
}

TEST(AsyncSocketTest, ConnectRefusedDelayedTFO) {
  EventBase evb;

  auto socket = MockAsyncTFOSocket::UniquePtr(new MockAsyncTFOSocket(&evb));
  socket->enableTFO();

  // Hopefully this fails
  folly::SocketAddress fakeAddr("127.0.0.1", 65535);
  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .WillOnce(Invoke([&](int fd, struct msghdr*, int) {
        sockaddr_storage addr;
        auto len = fakeAddr.getAddress(&addr);
        int ret = connect(fd, (const struct sockaddr*)&addr, len);
        LOG(INFO) << "connecting the socket " << fd << " : " << ret << " : "
                  << errno;
        return ret;
      }));

  // Hopefully nothing is actually listening on this address
  ConnCallback cb;
  socket->connect(&cb, fakeAddr, 30);

  WriteCallback write1;
  // Trigger the connect if TFO attempt is supported.
  socket->writeChain(&write1, IOBuf::copyBuffer("hey"));

  if (socket->getTFOFinished()) {
    // This test is useless now.
    return;
  }
  WriteCallback write2;
  // Trigger the connect if TFO attempt is supported.
  socket->writeChain(&write2, IOBuf::copyBuffer("hey"));
  evb.loop();

  EXPECT_EQ(STATE_FAILED, write1.state);
  EXPECT_EQ(STATE_FAILED, write2.state);
  EXPECT_FALSE(socket->getTFOSucceded());

  EXPECT_EQ(STATE_SUCCEEDED, cb.state);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(std::chrono::milliseconds(30), socket->getConnectTimeout());
  EXPECT_TRUE(socket->getTFOAttempted());
}

TEST(AsyncSocketTest, TestTFOUnsupportedTimeout) {
  // Try connecting to server that won't respond.
  //
  // This depends somewhat on the network where this test is run.
  // Hopefully this IP will be routable but unresponsive.
  // (Alternatively, we could try listening on a local raw socket, but that
  // normally requires root privileges.)
  auto host = SocketAddressTestHelper::isIPv6Enabled()
      ? SocketAddressTestHelper::kGooglePublicDnsAAddrIPv6
      : SocketAddressTestHelper::isIPv4Enabled()
          ? SocketAddressTestHelper::kGooglePublicDnsAAddrIPv4
          : nullptr;
  SocketAddress addr(host, 65535);

  // Connect using a AsyncSocket
  EventBase evb;
  auto socket = MockAsyncTFOSocket::UniquePtr(new MockAsyncTFOSocket(&evb));
  socket->enableTFO();

  ConnCallback ccb;
  // Set a very small timeout
  socket->connect(&ccb, addr, 1);
  EXPECT_EQ(STATE_SUCCEEDED, ccb.state);

  ReadCallback rcb;
  socket->setReadCB(&rcb);

  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .WillOnce(SetErrnoAndReturn(EOPNOTSUPP, -1));
  WriteCallback write;
  socket->writeChain(&write, IOBuf::copyBuffer("hey"));

  evb.loop();

  EXPECT_EQ(STATE_FAILED, write.state);
}

TEST(AsyncSocketTest, TestTFOFallbackToConnect) {
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  auto socket = MockAsyncTFOSocket::UniquePtr(new MockAsyncTFOSocket(&evb));
  socket->enableTFO();

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  ReadCallback rcb;
  socket->setReadCB(&rcb);

  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .WillOnce(Invoke([&](int fd, struct msghdr*, int) {
        sockaddr_storage addr;
        auto len = server.getAddress().getAddress(&addr);
        return connect(fd, (const struct sockaddr*)&addr, len);
      }));
  WriteCallback write;
  auto sendBuf = IOBuf::copyBuffer("hey");
  socket->writeChain(&write, sendBuf->clone());
  EXPECT_EQ(STATE_WAITING, write.state);

  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());

  std::array<uint8_t, 3> readBuf;

  std::thread t([&] {
    std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();
    acceptedSocket->write(buf.data(), buf.size());
    acceptedSocket->flush();
    acceptedSocket->readAll(readBuf.data(), readBuf.size());
    acceptedSocket->close();
  });

  evb.loop();

  t.join();
  EXPECT_EQ(0, memcmp(readBuf.data(), sendBuf->data(), readBuf.size()));

  EXPECT_EQ(STATE_SUCCEEDED, ccb.state);
  EXPECT_EQ(STATE_SUCCEEDED, write.state);

  EXPECT_EQ(STATE_SUCCEEDED, rcb.state);
  ASSERT_EQ(1, rcb.buffers.size());
  ASSERT_EQ(buf.size(), rcb.buffers[0].length);
  EXPECT_EQ(0, memcmp(rcb.buffers[0].buffer, buf.data(), buf.size()));
}

TEST(AsyncSocketTest, TestTFOFallbackTimeout) {
  // Try connecting to server that won't respond.
  //
  // This depends somewhat on the network where this test is run.
  // Hopefully this IP will be routable but unresponsive.
  // (Alternatively, we could try listening on a local raw socket, but that
  // normally requires root privileges.)
  auto host = SocketAddressTestHelper::isIPv6Enabled()
      ? SocketAddressTestHelper::kGooglePublicDnsAAddrIPv6
      : SocketAddressTestHelper::isIPv4Enabled()
          ? SocketAddressTestHelper::kGooglePublicDnsAAddrIPv4
          : nullptr;
  SocketAddress addr(host, 65535);

  // Connect using a AsyncSocket
  EventBase evb;
  auto socket = MockAsyncTFOSocket::UniquePtr(new MockAsyncTFOSocket(&evb));
  socket->enableTFO();

  ConnCallback ccb;
  // Set a very small timeout
  socket->connect(&ccb, addr, 1);
  EXPECT_EQ(STATE_SUCCEEDED, ccb.state);

  ReadCallback rcb;
  socket->setReadCB(&rcb);

  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .WillOnce(Invoke([&](int fd, struct msghdr*, int) {
        sockaddr_storage addr2;
        auto len = addr.getAddress(&addr2);
        return connect(fd, (const struct sockaddr*)&addr2, len);
      }));
  WriteCallback write;
  socket->writeChain(&write, IOBuf::copyBuffer("hey"));

  evb.loop();

  EXPECT_EQ(STATE_FAILED, write.state);
}

TEST(AsyncSocketTest, TestTFOEagain) {
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  auto socket = MockAsyncTFOSocket::UniquePtr(new MockAsyncTFOSocket(&evb));
  socket->enableTFO();

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);

  EXPECT_CALL(*socket, tfoSendMsg(_, _, _))
      .WillOnce(SetErrnoAndReturn(EAGAIN, -1));
  WriteCallback write;
  socket->writeChain(&write, IOBuf::copyBuffer("hey"));

  evb.loop();

  EXPECT_EQ(STATE_SUCCEEDED, ccb.state);
  EXPECT_EQ(STATE_FAILED, write.state);
}

// Sending a large amount of data in the first write which will
// definitely not fit into MSS.
TEST(AsyncSocketTest, ConnectTFOWithBigData) {
  // Start listening on a local port
  TestServer server(true);

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->enableTFO();
  ConnCallback cb;
  socket->connect(&cb, server.getAddress(), 30);

  std::array<uint8_t, 128> buf;
  memset(buf.data(), 'a', buf.size());

  constexpr size_t len = 10 * 1024;
  auto sendBuf = IOBuf::create(len);
  sendBuf->append(len);
  std::array<uint8_t, len> readBuf;

  std::thread t([&] {
    auto acceptedSocket = server.accept();
    acceptedSocket->write(buf.data(), buf.size());
    acceptedSocket->flush();
    acceptedSocket->readAll(readBuf.data(), readBuf.size());
    acceptedSocket->close();
  });

  evb.loop();

  ASSERT_EQ(cb.state, STATE_SUCCEEDED);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(30));
  EXPECT_TRUE(socket->getTFOAttempted());

  // Should trigger the connect
  WriteCallback write;
  ReadCallback rcb;
  socket->writeChain(&write, sendBuf->clone());
  socket->setReadCB(&rcb);
  evb.loop();

  t.join();

  EXPECT_EQ(STATE_SUCCEEDED, write.state);
  EXPECT_EQ(0, memcmp(readBuf.data(), sendBuf->data(), readBuf.size()));
  EXPECT_EQ(STATE_SUCCEEDED, rcb.state);
  ASSERT_EQ(1, rcb.buffers.size());
  ASSERT_EQ(sizeof(buf), rcb.buffers[0].length);
  EXPECT_EQ(0, memcmp(rcb.buffers[0].buffer, buf.data(), buf.size()));
  EXPECT_EQ(socket->getTFOFinished(), socket->getTFOSucceded());
}

#endif // FOLLY_ALLOW_TFO

class MockEvbChangeCallback : public AsyncSocket::EvbChangeCallback {
 public:
  MOCK_METHOD1(evbAttached, void(AsyncSocket*));
  MOCK_METHOD1(evbDetached, void(AsyncSocket*));
};

TEST(AsyncSocketTest, EvbCallbacks) {
  auto cb = std::make_unique<MockEvbChangeCallback>();
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  InSequence seq;
  EXPECT_CALL(*cb, evbDetached(socket.get())).Times(1);
  EXPECT_CALL(*cb, evbAttached(socket.get())).Times(1);

  socket->setEvbChangedCallback(std::move(cb));
  socket->detachEventBase();
  socket->attachEventBase(&evb);
}

TEST(AsyncSocketTest, TestEvbDetachWtRegisteredIOHandlers) {
  // Start listening on a local port
  TestServer server;

  // Connect using a AsyncSocket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  ConnCallback cb;
  socket->connect(&cb, server.getAddress(), 30);

  evb.loop();

  ASSERT_EQ(cb.state, STATE_SUCCEEDED);
  EXPECT_LE(0, socket->getConnectTime().count());
  EXPECT_EQ(socket->getConnectTimeout(), std::chrono::milliseconds(30));

  // After the ioHandlers are registered, still should be able to detach/attach
  ReadCallback rcb;
  socket->setReadCB(&rcb);

  auto cbEvbChg = std::make_unique<MockEvbChangeCallback>();
  InSequence seq;
  EXPECT_CALL(*cbEvbChg, evbDetached(socket.get())).Times(1);
  EXPECT_CALL(*cbEvbChg, evbAttached(socket.get())).Times(1);

  socket->setEvbChangedCallback(std::move(cbEvbChg));
  EXPECT_TRUE(socket->isDetachable());
  socket->detachEventBase();
  socket->attachEventBase(&evb);

  socket->close();
}

#ifdef FOLLY_HAVE_MSG_ERRQUEUE
/* copied from include/uapi/linux/net_tstamp.h */
/* SO_TIMESTAMPING gets an integer bit field comprised of these values */
enum SOF_TIMESTAMPING {
  SOF_TIMESTAMPING_SOFTWARE = (1 << 4),
  SOF_TIMESTAMPING_OPT_ID = (1 << 7),
  SOF_TIMESTAMPING_TX_SCHED = (1 << 8),
  SOF_TIMESTAMPING_OPT_CMSG = (1 << 10),
  SOF_TIMESTAMPING_OPT_TSONLY = (1 << 11),
};

class TestErrMessageCallback : public folly::AsyncSocket::ErrMessageCallback {
 public:
  TestErrMessageCallback()
      : exception_(folly::AsyncSocketException::UNKNOWN, "none") {}

  void errMessage(const cmsghdr& cmsg) noexcept override {
    if (cmsg.cmsg_level == SOL_SOCKET && cmsg.cmsg_type == SCM_TIMESTAMPING) {
      gotTimestamp_++;
      checkResetCallback();
    } else if (
        (cmsg.cmsg_level == SOL_IP && cmsg.cmsg_type == IP_RECVERR) ||
        (cmsg.cmsg_level == SOL_IPV6 && cmsg.cmsg_type == IPV6_RECVERR)) {
      gotByteSeq_++;
      checkResetCallback();
    }
  }

  void errMessageError(
      const folly::AsyncSocketException& ex) noexcept override {
    exception_ = ex;
  }

  void checkResetCallback() noexcept {
    if (socket_ != nullptr && resetAfter_ != -1 &&
        gotTimestamp_ + gotByteSeq_ == resetAfter_) {
      socket_->setErrMessageCB(nullptr);
    }
  }

  folly::AsyncSocket* socket_{nullptr};
  folly::AsyncSocketException exception_;
  int gotTimestamp_{0};
  int gotByteSeq_{0};
  int resetAfter_{-1};
};

TEST(AsyncSocketTest, ErrMessageCallback) {
  TestServer server;

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);
  LOG(INFO) << "Client socket fd=" << socket->getFd();

  // Let the socket
  evb.loop();

  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  // Set read callback to keep the socket subscribed for event
  // notifications. Though we're no planning to read anything from
  // this side of the connection.
  ReadCallback rcb(1);
  socket->setReadCB(&rcb);

  // Set up timestamp callbacks
  TestErrMessageCallback errMsgCB;
  socket->setErrMessageCB(&errMsgCB);
  ASSERT_EQ(
      socket->getErrMessageCallback(),
      static_cast<folly::AsyncSocket::ErrMessageCallback*>(&errMsgCB));

  errMsgCB.socket_ = socket.get();
  errMsgCB.resetAfter_ = 3;

  // Enable timestamp notifications
  ASSERT_GT(socket->getFd(), 0);
  int flags = SOF_TIMESTAMPING_OPT_ID | SOF_TIMESTAMPING_OPT_TSONLY |
      SOF_TIMESTAMPING_SOFTWARE | SOF_TIMESTAMPING_OPT_CMSG |
      SOF_TIMESTAMPING_TX_SCHED;
  AsyncSocket::OptionKey tstampingOpt = {SOL_SOCKET, SO_TIMESTAMPING};
  EXPECT_EQ(tstampingOpt.apply(socket->getFd(), flags), 0);

  // write()
  std::vector<uint8_t> wbuf(128, 'a');
  WriteCallback wcb;
  // Send two packets to get two EOM notifications
  socket->write(&wcb, wbuf.data(), wbuf.size() / 2);
  socket->write(&wcb, wbuf.data() + wbuf.size() / 2, wbuf.size() / 2);

  // Accept the connection.
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();
  LOG(INFO) << "Server socket fd=" << acceptedSocket->getSocketFD();

  // Loop
  evb.loopOnce();
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Check that we can read the data that was written to the socket
  std::vector<uint8_t> rbuf(1 + wbuf.size(), 0);
  uint32_t bytesRead = acceptedSocket->read(rbuf.data(), rbuf.size());
  ASSERT_TRUE(std::equal(wbuf.begin(), wbuf.end(), rbuf.begin()));
  ASSERT_EQ(bytesRead, wbuf.size());

  // Close both sockets
  acceptedSocket->close();
  socket->close();

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());

  // Check for the timestamp notifications.
  ASSERT_EQ(
      errMsgCB.exception_.getType(), folly::AsyncSocketException::UNKNOWN);
  ASSERT_GT(errMsgCB.gotByteSeq_, 0);
  ASSERT_GT(errMsgCB.gotTimestamp_, 0);
  ASSERT_EQ(
      errMsgCB.gotByteSeq_ + errMsgCB.gotTimestamp_, errMsgCB.resetAfter_);
}
#endif // FOLLY_HAVE_MSG_ERRQUEUE

TEST(AsyncSocket, PreReceivedData) {
  TestServer server;

  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->connect(nullptr, server.getAddress(), 30);
  evb.loop();

  socket->writeChain(nullptr, IOBuf::copyBuffer("hello"));

  auto acceptedSocket = server.acceptAsync(&evb);

  ReadCallback peekCallback(2);
  ReadCallback readCallback;
  peekCallback.dataAvailableCallback = [&]() {
    peekCallback.verifyData("he", 2);
    acceptedSocket->setPreReceivedData(IOBuf::copyBuffer("h"));
    acceptedSocket->setPreReceivedData(IOBuf::copyBuffer("e"));
    acceptedSocket->setReadCB(nullptr);
    acceptedSocket->setReadCB(&readCallback);
  };
  readCallback.dataAvailableCallback = [&]() {
    if (readCallback.dataRead() == 5) {
      readCallback.verifyData("hello", 5);
      acceptedSocket->setReadCB(nullptr);
    }
  };

  acceptedSocket->setReadCB(&peekCallback);

  evb.loop();
}

TEST(AsyncSocket, PreReceivedDataOnly) {
  TestServer server;

  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->connect(nullptr, server.getAddress(), 30);
  evb.loop();

  socket->writeChain(nullptr, IOBuf::copyBuffer("hello"));

  auto acceptedSocket = server.acceptAsync(&evb);

  ReadCallback peekCallback;
  ReadCallback readCallback;
  peekCallback.dataAvailableCallback = [&]() {
    peekCallback.verifyData("hello", 5);
    acceptedSocket->setPreReceivedData(IOBuf::copyBuffer("hello"));
    acceptedSocket->setReadCB(&readCallback);
  };
  readCallback.dataAvailableCallback = [&]() {
    readCallback.verifyData("hello", 5);
    acceptedSocket->setReadCB(nullptr);
  };

  acceptedSocket->setReadCB(&peekCallback);

  evb.loop();
}

TEST(AsyncSocket, PreReceivedDataPartial) {
  TestServer server;

  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->connect(nullptr, server.getAddress(), 30);
  evb.loop();

  socket->writeChain(nullptr, IOBuf::copyBuffer("hello"));

  auto acceptedSocket = server.acceptAsync(&evb);

  ReadCallback peekCallback;
  ReadCallback smallReadCallback(3);
  ReadCallback normalReadCallback;
  peekCallback.dataAvailableCallback = [&]() {
    peekCallback.verifyData("hello", 5);
    acceptedSocket->setPreReceivedData(IOBuf::copyBuffer("hello"));
    acceptedSocket->setReadCB(&smallReadCallback);
  };
  smallReadCallback.dataAvailableCallback = [&]() {
    smallReadCallback.verifyData("hel", 3);
    acceptedSocket->setReadCB(&normalReadCallback);
  };
  normalReadCallback.dataAvailableCallback = [&]() {
    normalReadCallback.verifyData("lo", 2);
    acceptedSocket->setReadCB(nullptr);
  };

  acceptedSocket->setReadCB(&peekCallback);

  evb.loop();
}

TEST(AsyncSocket, PreReceivedDataTakeover) {
  TestServer server;

  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);
  socket->connect(nullptr, server.getAddress(), 30);
  evb.loop();

  socket->writeChain(nullptr, IOBuf::copyBuffer("hello"));

  auto acceptedSocket =
      AsyncSocket::UniquePtr(new AsyncSocket(&evb, server.acceptFD()));
  AsyncSocket::UniquePtr takeoverSocket;

  ReadCallback peekCallback(3);
  ReadCallback readCallback;
  peekCallback.dataAvailableCallback = [&]() {
    peekCallback.verifyData("hel", 3);
    acceptedSocket->setPreReceivedData(IOBuf::copyBuffer("hello"));
    acceptedSocket->setReadCB(nullptr);
    takeoverSocket =
        AsyncSocket::UniquePtr(new AsyncSocket(std::move(acceptedSocket)));
    takeoverSocket->setReadCB(&readCallback);
  };
  readCallback.dataAvailableCallback = [&]() {
    readCallback.verifyData("hello", 5);
    takeoverSocket->setReadCB(nullptr);
  };

  acceptedSocket->setReadCB(&peekCallback);

  evb.loop();
}

#ifdef MSG_NOSIGNAL
TEST(AsyncSocketTest, SendMessageFlags) {
  TestServer server;
  TestSendMsgParamsCallback sendMsgCB(
      MSG_DONTWAIT | MSG_NOSIGNAL | MSG_MORE, 0, nullptr);

  // connect()
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb);

  ConnCallback ccb;
  socket->connect(&ccb, server.getAddress(), 30);
  std::shared_ptr<BlockingSocket> acceptedSocket = server.accept();

  evb.loop();
  ASSERT_EQ(ccb.state, STATE_SUCCEEDED);

  // Set SendMsgParamsCallback
  socket->setSendMsgParamCB(&sendMsgCB);
  ASSERT_EQ(socket->getSendMsgParamsCB(), &sendMsgCB);

  // Write the first portion of data. This data is expected to be
  // sent out immediately.
  std::vector<uint8_t> buf(128, 'a');
  WriteCallback wcb;
  sendMsgCB.reset(MSG_DONTWAIT | MSG_NOSIGNAL);
  socket->write(&wcb, buf.data(), buf.size());
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);
  ASSERT_TRUE(sendMsgCB.queriedFlags_);
  ASSERT_FALSE(sendMsgCB.queriedData_);

  // Using different flags for the second write operation.
  // MSG_MORE flag is expected to delay sending this
  // data to the wire.
  sendMsgCB.reset(MSG_DONTWAIT | MSG_NOSIGNAL | MSG_MORE);
  socket->write(&wcb, buf.data(), buf.size());
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);
  ASSERT_TRUE(sendMsgCB.queriedFlags_);
  ASSERT_FALSE(sendMsgCB.queriedData_);

  // Make sure the accepted socket saw only the data from
  // the first write request.
  std::vector<uint8_t> readbuf(2 * buf.size());
  uint32_t bytesRead = acceptedSocket->read(readbuf.data(), readbuf.size());
  ASSERT_TRUE(std::equal(buf.begin(), buf.end(), readbuf.begin()));
  ASSERT_EQ(bytesRead, buf.size());

  // Make sure the server got a connection and received the data
  acceptedSocket->close();
  socket->close();

  ASSERT_TRUE(socket->isClosedBySelf());
  ASSERT_FALSE(socket->isClosedByPeer());
}

TEST(AsyncSocketTest, SendMessageAncillaryData) {
  int fds[2];
  EXPECT_EQ(socketpair(AF_UNIX, SOCK_STREAM, 0, fds), 0);

  // "Client" socket
  int cfd = fds[0];
  ASSERT_NE(cfd, -1);

  // "Server" socket
  int sfd = fds[1];
  ASSERT_NE(sfd, -1);
  SCOPE_EXIT {
    close(sfd);
  };

  // Instantiate AsyncSocket object for the connected socket
  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb, cfd);

  // Open a temporary file and write a magic string to it
  // We'll transfer the file handle to test the message parameters
  // callback logic.
  TemporaryFile file(
      StringPiece(), fs::path(), TemporaryFile::Scope::UNLINK_IMMEDIATELY);
  int tmpfd = file.fd();
  ASSERT_NE(tmpfd, -1) << "Failed to open a temporary file";
  std::string magicString("Magic string");
  ASSERT_EQ(
      write(tmpfd, magicString.c_str(), magicString.length()),
      magicString.length());

  // Send message
  union {
    // Space large enough to hold an 'int'
    char control[CMSG_SPACE(sizeof(int))];
    struct cmsghdr cmh;
  } s_u;
  s_u.cmh.cmsg_len = CMSG_LEN(sizeof(int));
  s_u.cmh.cmsg_level = SOL_SOCKET;
  s_u.cmh.cmsg_type = SCM_RIGHTS;
  memcpy(CMSG_DATA(&s_u.cmh), &tmpfd, sizeof(int));

  // Set up the callback providing message parameters
  TestSendMsgParamsCallback sendMsgCB(
      MSG_DONTWAIT | MSG_NOSIGNAL, sizeof(s_u.control), s_u.control);
  socket->setSendMsgParamCB(&sendMsgCB);

  // We must transmit at least 1 byte of real data in order
  // to send ancillary data
  int s_data = 12345;
  WriteCallback wcb;
  socket->write(&wcb, &s_data, sizeof(s_data));
  ASSERT_EQ(wcb.state, STATE_SUCCEEDED);

  // Receive the message
  union {
    // Space large enough to hold an 'int'
    char control[CMSG_SPACE(sizeof(int))];
    struct cmsghdr cmh;
  } r_u;
  struct msghdr msgh;
  struct iovec iov;
  int r_data = 0;

  msgh.msg_control = r_u.control;
  msgh.msg_controllen = sizeof(r_u.control);
  msgh.msg_name = nullptr;
  msgh.msg_namelen = 0;
  msgh.msg_iov = &iov;
  msgh.msg_iovlen = 1;
  iov.iov_base = &r_data;
  iov.iov_len = sizeof(r_data);

  // Receive data
  ASSERT_NE(recvmsg(sfd, &msgh, 0), -1) << "recvmsg failed: " << errno;

  // Validate the received message
  ASSERT_EQ(r_u.cmh.cmsg_len, CMSG_LEN(sizeof(int)));
  ASSERT_EQ(r_u.cmh.cmsg_level, SOL_SOCKET);
  ASSERT_EQ(r_u.cmh.cmsg_type, SCM_RIGHTS);
  ASSERT_EQ(r_data, s_data);
  int fd = 0;
  memcpy(&fd, CMSG_DATA(&r_u.cmh), sizeof(int));
  ASSERT_NE(fd, 0);
  SCOPE_EXIT {
    close(fd);
  };

  std::vector<uint8_t> transferredMagicString(magicString.length() + 1, 0);

  // Reposition to the beginning of the file
  ASSERT_EQ(0, lseek(fd, 0, SEEK_SET));

  // Read the magic string back, and compare it with the original
  ASSERT_EQ(
      magicString.length(),
      read(fd, transferredMagicString.data(), transferredMagicString.size()));
  ASSERT_TRUE(std::equal(
      magicString.begin(), magicString.end(), transferredMagicString.begin()));
}

TEST(AsyncSocketTest, UnixDomainSocketErrMessageCB) {
  // In the latest stable kernel 4.14.3 as of 2017-12-04, Unix Domain
  // Socket (UDS) does not support MSG_ERRQUEUE. So
  // recvmsg(MSG_ERRQUEUE) will read application data from UDS which
  // breaks application message flow.  To avoid this problem,
  // AsyncSocket currently disables setErrMessageCB for UDS.
  //
  // This tests two things for UDS
  // 1. setErrMessageCB fails
  // 2. recvmsg(MSG_ERRQUEUE) reads application data
  //
  // Feel free to remove this test if UDS supports MSG_ERRQUEUE in the future.

  int fd[2];
  EXPECT_EQ(socketpair(AF_UNIX, SOCK_STREAM, 0, fd), 0);
  ASSERT_NE(fd[0], -1);
  ASSERT_NE(fd[1], -1);
  SCOPE_EXIT {
    close(fd[1]);
  };

  EXPECT_EQ(fcntl(fd[0], F_SETFL, O_NONBLOCK), 0);
  EXPECT_EQ(fcntl(fd[1], F_SETFL, O_NONBLOCK), 0);

  EventBase evb;
  std::shared_ptr<AsyncSocket> socket = AsyncSocket::newSocket(&evb, fd[0]);

  // setErrMessageCB should fail for unix domain socket
  TestErrMessageCallback errMsgCB;
  ASSERT_NE(&errMsgCB, nullptr);
  socket->setErrMessageCB(&errMsgCB);
  ASSERT_EQ(socket->getErrMessageCallback(), nullptr);

#ifdef FOLLY_HAVE_MSG_ERRQUEUE
  // The following verifies that MSG_ERRQUEUE does not work for UDS,
  // and recvmsg reads application data
  union {
    // Space large enough to hold an 'int'
    char control[CMSG_SPACE(sizeof(int))];
    struct cmsghdr cmh;
  } r_u;
  struct msghdr msgh;
  struct iovec iov;
  int recv_data = 0;

  msgh.msg_control = r_u.control;
  msgh.msg_controllen = sizeof(r_u.control);
  msgh.msg_name = nullptr;
  msgh.msg_namelen = 0;
  msgh.msg_iov = &iov;
  msgh.msg_iovlen = 1;
  iov.iov_base = &recv_data;
  iov.iov_len = sizeof(recv_data);

  // there is no data, recvmsg should fail
  EXPECT_EQ(recvmsg(fd[1], &msgh, MSG_ERRQUEUE), -1);
  EXPECT_TRUE(errno == EAGAIN || errno == EWOULDBLOCK);

  // provide some application data, error queue should be empty if it exists
  // However, UDS reads application data as error message
  int test_data = 123456;
  WriteCallback wcb;
  socket->write(&wcb, &test_data, sizeof(test_data));
  recv_data = 0;
  ASSERT_NE(recvmsg(fd[1], &msgh, MSG_ERRQUEUE), -1);
  ASSERT_EQ(recv_data, test_data);
#endif // FOLLY_HAVE_MSG_ERRQUEUE
}

TEST(AsyncSocketTest, V6TosReflectTest) {
  EventBase eventBase;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  folly::IPAddress ip("::1");
  std::vector<folly::IPAddress> serverIp;
  serverIp.push_back(ip);
  serverSocket->bind(serverIp, 0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Enable TOS reflect
  serverSocket->setTosReflect(true);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
  });
  serverSocket->addAcceptCallback(&acceptCallback, &eventBase);
  serverSocket->startAccepting();

  // Create a client socket, setsockopt() the TOS before connecting
  auto clientThread = [](std::shared_ptr<AsyncSocket>& clientSock,
                         ConnCallback* ccb,
                         EventBase* evb,
                         folly::SocketAddress sAddr) {
    clientSock = AsyncSocket::newSocket(evb);
    AsyncSocket::OptionKey v6Opts = {IPPROTO_IPV6, IPV6_TCLASS};
    AsyncSocket::OptionMap optionMap;
    optionMap.insert({v6Opts, 0x2c});
    SocketAddress bindAddr("0.0.0.0", 0);
    clientSock->connect(ccb, sAddr, 30, optionMap, bindAddr);
  };

  std::shared_ptr<AsyncSocket> socket(nullptr);
  ConnCallback cb;
  clientThread(socket, &cb, &eventBase, serverAddress);

  eventBase.loop();

  // Verify if the connection is accepted and if the accepted socket has
  // setsockopt on the TOS for the same value that was on the client socket
  int fd = acceptCallback.getEvents()->at(1).fd;
  ASSERT_GE(fd, 0);
  int value;
  socklen_t valueLength = sizeof(value);
  int rc = getsockopt(fd, IPPROTO_IPV6, IPV6_TCLASS, &value, &valueLength);
  ASSERT_EQ(rc, 0);
  ASSERT_EQ(value, 0x2c);
}

TEST(AsyncSocketTest, V4TosReflectTest) {
  EventBase eventBase;

  // Create a server socket
  std::shared_ptr<AsyncServerSocket> serverSocket(
      AsyncServerSocket::newSocket(&eventBase));
  folly::IPAddress ip("127.0.0.1");
  std::vector<folly::IPAddress> serverIp;
  serverIp.push_back(ip);
  serverSocket->bind(serverIp, 0);
  serverSocket->listen(16);
  folly::SocketAddress serverAddress;
  serverSocket->getAddress(&serverAddress);

  // Enable TOS reflect
  serverSocket->setTosReflect(true);

  // Add a callback to accept one connection then stop the loop
  TestAcceptCallback acceptCallback;
  acceptCallback.setConnectionAcceptedFn(
      [&](int /* fd */, const folly::SocketAddress& /* addr */) {
        serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
      });
  acceptCallback.setAcceptErrorFn([&](const std::exception& /* ex */) {
    serverSocket->removeAcceptCallback(&acceptCallback, &eventBase);
  });
  serverSocket->addAcceptCallback(&acceptCallback, &eventBase);
  serverSocket->startAccepting();

  // Create a client socket, setsockopt() the TOS before connecting
  auto clientThread = [](std::shared_ptr<AsyncSocket>& clientSock,
                         ConnCallback* ccb,
                         EventBase* evb,
                         folly::SocketAddress sAddr) {
    clientSock = AsyncSocket::newSocket(evb);
    AsyncSocket::OptionKey v4Opts = {IPPROTO_IP, IP_TOS};
    AsyncSocket::OptionMap optionMap;
    optionMap.insert({v4Opts, 0x2c});
    SocketAddress bindAddr("0.0.0.0", 0);
    clientSock->connect(ccb, sAddr, 30, optionMap, bindAddr);
  };

  std::shared_ptr<AsyncSocket> socket(nullptr);
  ConnCallback cb;
  clientThread(socket, &cb, &eventBase, serverAddress);

  eventBase.loop();

  // Verify if the connection is accepted and if the accepted socket has
  // setsockopt on the TOS for the same value that was on the client socket
  int fd = acceptCallback.getEvents()->at(1).fd;
  ASSERT_GE(fd, 0);
  int value;
  socklen_t valueLength = sizeof(value);
  int rc = getsockopt(fd, IPPROTO_IP, IP_TOS, &value, &valueLength);
  ASSERT_EQ(rc, 0);
  ASSERT_EQ(value, 0x2c);
}
#endif

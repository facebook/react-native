/*
 * Copyright 2014-present Facebook, Inc.
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

#include <numeric>
#include <thread>

#include <folly/Conv.h>
#include <folly/SocketAddress.h>
#include <folly/io/IOBuf.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/AsyncUDPServerSocket.h>
#include <folly/io/async/AsyncUDPSocket.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

using folly::AsyncTimeout;
using folly::AsyncUDPServerSocket;
using folly::AsyncUDPSocket;
using folly::EventBase;
using folly::IOBuf;
using folly::SocketAddress;
using namespace testing;

struct TestData {
  TestData(
      int gso,
      bool useSocketGSO,
      int* in,
      size_t inLen,
      int* expected,
      size_t expectedLen)
      : gso_(gso), useSocketGSO_(useSocketGSO) {
    in_.assign(in, in + inLen);
    expected_.assign(expected, expected + expectedLen);

    expectedSize_ = std::accumulate(expected_.begin(), expected_.end(), 0);
  }

  bool checkIn() const {
    return (expectedSize_ == std::accumulate(in_.begin(), in_.end(), 0));
  }

  bool checkOut() const {
    return (expectedSize_ == std::accumulate(out_.begin(), out_.end(), 0));
  }

  bool appendOut(int num) {
    out_.push_back(num);
    outSize_ += num;

    return (outSize_ >= expectedSize_);
  }

  std::unique_ptr<folly::IOBuf> getInBuf() {
    if (!in_.size()) {
      return nullptr;
    }

    std::string str(in_[0], 'A');
    std::unique_ptr<folly::IOBuf> ret =
        folly::IOBuf::copyBuffer(str.data(), str.size());

    for (size_t i = 1; i < in_.size(); i++) {
      str = std::string(in_[i], 'A');
      ret->prependChain(folly::IOBuf::copyBuffer(str.data(), str.size()));
    }

    return ret;
  }

  int gso_{0};
  bool useSocketGSO_{false};
  std::vector<int> in_;
  std::vector<int> expected_; // expected
  int expectedSize_;
  std::vector<int> out_;
  int outSize_{0};
};

class UDPAcceptor : public AsyncUDPServerSocket::Callback {
 public:
  UDPAcceptor(EventBase* evb) : evb_(evb) {}

  void onListenStarted() noexcept override {}

  void onListenStopped() noexcept override {}

  void onDataAvailable(
      std::shared_ptr<folly::AsyncUDPSocket> socket,
      const folly::SocketAddress& client,
      std::unique_ptr<folly::IOBuf> data,
      bool /*unused*/) noexcept override {
    // send pong
    socket->write(client, data->clone());
  }

 private:
  EventBase* const evb_{nullptr};
};

class UDPServer {
 public:
  UDPServer(EventBase* evb, folly::SocketAddress addr, int n)
      : evb_(evb), addr_(addr), evbs_(n) {}

  void start() {
    CHECK(evb_->isInEventBaseThread());

    socket_ = std::make_unique<AsyncUDPServerSocket>(evb_, 1500);

    try {
      socket_->bind(addr_);
      VLOG(4) << "Server listening on " << socket_->address().describe();
    } catch (const std::exception& ex) {
      LOG(FATAL) << ex.what();
    }

    acceptors_.reserve(evbs_.size());
    threads_.reserve(evbs_.size());

    // Add numWorkers thread
    int i = 0;
    for (auto& evb : evbs_) {
      acceptors_.emplace_back(&evb);

      std::thread t([&]() { evb.loopForever(); });

      evb.waitUntilRunning();

      socket_->addListener(&evb, &acceptors_[i]);
      threads_.emplace_back(std::move(t));
      ++i;
    }

    socket_->listen();
  }

  folly::SocketAddress address() const {
    return socket_->address();
  }

  void shutdown() {
    CHECK(evb_->isInEventBaseThread());
    socket_->close();
    socket_.reset();

    for (auto& evb : evbs_) {
      evb.terminateLoopSoon();
    }

    for (auto& t : threads_) {
      t.join();
    }
  }

  void pauseAccepting() {
    socket_->pauseAccepting();
  }

  void resumeAccepting() {
    socket_->resumeAccepting();
  }

 private:
  EventBase* const evb_{nullptr};
  const folly::SocketAddress addr_;

  std::unique_ptr<AsyncUDPServerSocket> socket_;
  std::vector<std::thread> threads_;
  std::vector<folly::EventBase> evbs_;
  std::vector<UDPAcceptor> acceptors_;
};

class UDPClient : private AsyncUDPSocket::ReadCallback, private AsyncTimeout {
 public:
  explicit UDPClient(EventBase* evb, TestData& testData)
      : AsyncTimeout(evb), evb_(evb), testData_(testData) {}

  void start(const folly::SocketAddress& server) {
    CHECK(evb_->isInEventBaseThread());
    server_ = server;
    socket_ = std::make_unique<AsyncUDPSocket>(evb_);

    try {
      socket_->bind(folly::SocketAddress("127.0.0.1", 0));
      if (connectAddr_) {
        connect();
      }
      VLOG(2) << "Client bound to " << socket_->address().describe();
    } catch (const std::exception& ex) {
      LOG(FATAL) << ex.what();
    }

    // succeed if GSO not available
    if (socket_->getGSO() < 0) {
      LOG(INFO) << "GSO  not supported";
      testData_.out_ = testData_.expected_;
      shutdown();
      return;
    }

    if (testData_.useSocketGSO_) {
      socket_->setGSO(testData_.gso_);
    } else {
      socket_->setGSO(0);
    }

    socket_->resumeRead(this);

    // Start playing ping pong
    sendPing();
  }

  void connect() {
    int ret = socket_->connect(*connectAddr_);
    if (ret != 0) {
      throw folly::AsyncSocketException(
          folly::AsyncSocketException::NOT_OPEN, "ConnectFail", errno);
    }
    VLOG(2) << "Client connected to address=" << *connectAddr_;
  }

  void shutdown() {
    CHECK(evb_->isInEventBaseThread());
    socket_->pauseRead();
    socket_->close();
    socket_.reset();
    evb_->terminateLoopSoon();
  }

  void sendPing() {
    scheduleTimeout(5);
    writePing(
        testData_.getInBuf(), testData_.useSocketGSO_ ? -1 : testData_.gso_);
  }

  virtual void writePing(std::unique_ptr<folly::IOBuf> buf, int gso) {
    socket_->writeGSO(server_, std::move(buf), gso);
  }

  void getReadBuffer(void** buf, size_t* len) noexcept override {
    *buf = buf_;
    *len = sizeof(buf_);
  }

  void onDataAvailable(
      const folly::SocketAddress& /*unused*/,
      size_t len,
      bool /*unused*/) noexcept override {
    VLOG(0) << "Got " << len << " bytes";
    if (testData_.appendOut(len)) {
      shutdown();
    }
  }

  void onReadError(const folly::AsyncSocketException& ex) noexcept override {
    VLOG(4) << ex.what();

    // Start listening for next PONG
    socket_->resumeRead(this);
  }

  void onReadClosed() noexcept override {
    CHECK(false) << "We unregister reads before closing";
  }

  void timeoutExpired() noexcept override {
    VLOG(4) << "Timeout expired";
    shutdown();
  }

  AsyncUDPSocket& getSocket() {
    return *socket_;
  }

  void setShouldConnect(const folly::SocketAddress& connectAddr) {
    connectAddr_ = connectAddr;
  }

 protected:
  folly::Optional<folly::SocketAddress> connectAddr_;
  EventBase* const evb_{nullptr};

  folly::SocketAddress server_;
  std::unique_ptr<AsyncUDPSocket> socket_;

 private:
  char buf_[2048];
  TestData& testData_;
};

class AsyncSocketGSOIntegrationTest : public Test {
 public:
  void SetUp() override {
    server = std::make_unique<UDPServer>(
        &sevb, folly::SocketAddress("127.0.0.1", 0), 1);

    // Start event loop in a separate thread
    serverThread =
        std::make_unique<std::thread>([this]() { sevb.loopForever(); });

    // Wait for event loop to start
    sevb.waitUntilRunning();
  }

  void startServer() {
    // Start the server
    sevb.runInEventBaseThreadAndWait([&]() { server->start(); });
    LOG(INFO) << "Server listening=" << server->address();
  }

  void TearDown() override {
    // Shutdown server
    sevb.runInEventBaseThread([&]() {
      server->shutdown();
      sevb.terminateLoopSoon();
    });

    // Wait for server thread to join
    serverThread->join();
  }

  std::unique_ptr<UDPClient> performPingPongTest(
      TestData& testData,
      folly::Optional<folly::SocketAddress> connectedAddress);

  folly::EventBase sevb;
  folly::EventBase cevb;
  TestData* testData_{nullptr};
  std::unique_ptr<std::thread> serverThread;
  std::unique_ptr<UDPServer> server;
  std::unique_ptr<UDPClient> client;
};

std::unique_ptr<UDPClient> AsyncSocketGSOIntegrationTest::performPingPongTest(
    TestData& testData,
    folly::Optional<folly::SocketAddress> connectedAddress) {
  testData_ = &testData;

  client = std::make_unique<UDPClient>(&cevb, testData);
  if (connectedAddress) {
    client->setShouldConnect(*connectedAddress);
  }

  // Start event loop in a separate thread
  auto clientThread = std::thread([this]() { cevb.loopForever(); });

  // Wait for event loop to start
  cevb.waitUntilRunning();

  // Send ping
  cevb.runInEventBaseThread([&]() { client->start(server->address()); });

  // Wait for client to finish
  clientThread.join();
  return std::move(client);
}

TEST_F(AsyncSocketGSOIntegrationTest, PingPongGlobalGSO) {
  int gso = 1000;
  int in[] = {100, 1200, 3000, 200, 100, 300};
  int expected[] = {1000, 1000, 1000, 1000, 900};
  TestData testData(
      gso,
      true /*useSocketGSO*/,
      in,
      sizeof(in) / sizeof(in[0]),
      expected,
      sizeof(expected) / sizeof(expected[0]));
  ASSERT_TRUE(testData.checkIn());
  startServer();
  auto pingClient = performPingPongTest(testData, folly::none);
  ASSERT_TRUE(testData.checkOut());
}

TEST_F(AsyncSocketGSOIntegrationTest, PingPongRequestGSO) {
  int gso = 421;
  int in[] = {100, 1200, 3000, 200, 100, 300};
  int expected[] = {421, 421, 421, 421, 421, 421, 421, 421, 421, 421, 421, 269};
  TestData testData(
      gso,
      false /*useSocketGSO*/,
      in,
      sizeof(in) / sizeof(in[0]),
      expected,
      sizeof(expected) / sizeof(expected[0]));
  ASSERT_TRUE(testData.checkIn());
  startServer();
  auto pingClient = performPingPongTest(testData, folly::none);
  ASSERT_TRUE(testData.checkOut());
}

// buffer sizes
constexpr auto kGSO1 = 100;
constexpr auto kGSO2 = 200;
constexpr auto kGSO = kGSO1 + kGSO2;

class GSOBuf {
 public:
  explicit GSOBuf(size_t size1, size_t size2 = 0) {
    std::string str(size1, 'A');
    ioBuf_ = folly::IOBuf::copyBuffer(str.data(), str.size());

    if (size2) {
      str = std::string(size2, 'B');
      auto tmp = folly::IOBuf::copyBuffer(str.data(), str.size());
      ioBuf_->prependChain(std::move(tmp));
    }
  }

  const std::unique_ptr<IOBuf>& get() const {
    return ioBuf_;
  }

 private:
  std::unique_ptr<IOBuf> ioBuf_;
};

class GSOSendTest {
 public:
  explicit GSOSendTest(
      folly::AsyncUDPSocket& socket,
      const folly::SocketAddress& address,
      int gso,
      size_t size1,
      size_t size2 = 0) {
    GSOBuf buf(size1, size2);

    ret_ = socket.writeGSO(address, buf.get(), gso);
  }

  ssize_t get() const {
    return ret_;
  }

 private:
  ssize_t ret_;
};

TEST(AsyncSocketGSOTest, send) {
  EventBase evb;
  folly::AsyncUDPSocket client(&evb);
  client.bind(folly::SocketAddress("127.0.0.1", 0));
  if (client.getGSO() < 0) {
    LOG(INFO) << "GSO not supported";
    // GSO not supported
    return;
  }

  folly::AsyncUDPSocket server(&evb);
  server.bind(folly::SocketAddress("127.0.0.1", 0));

  // send less than GSO in a single IOBuf
  {
    GSOSendTest test(client, server.address(), kGSO, kGSO - 1);
    CHECK_LT(test.get(), 0);
  }

  // send less than GSO in multiple IOBufs
  {
    GSOSendTest test(client, server.address(), kGSO, kGSO1 - 1, kGSO2);
    CHECK_LT(test.get(), 0);
  }

  // send  GSO in a single IOBuf
  {
    GSOSendTest test(client, server.address(), kGSO, kGSO);
    CHECK_LT(test.get(), 0);
  }

  // send GSO in multiple IOBuf
  {
    GSOSendTest test(client, server.address(), kGSO, kGSO1, kGSO2);
    CHECK_LT(test.get(), 0);
  }

  // send more than GSO in a single IOBuf
  {
    GSOSendTest test(client, server.address(), kGSO, kGSO + 1);
    CHECK_EQ(test.get(), kGSO + 1);
  }

  // send more than GSO in a multiple IOBufs
  {
    GSOSendTest test(client, server.address(), kGSO, kGSO1 + 1, kGSO2 + 1);
    CHECK_EQ(test.get(), kGSO + 2);
  }
}

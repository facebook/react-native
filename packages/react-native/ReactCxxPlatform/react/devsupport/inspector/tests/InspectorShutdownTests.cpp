/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <jsinspector-modern/InspectorInterfaces.h>
#include <react/devsupport/inspector/Inspector.h>
#include <chrono>
#include <thread>

namespace facebook::react {

class InspectorShutdownTest : public ::testing::Test {
 protected:
  struct SocketState {
    IWebSocketClient::OnConnectCallback onConnect;
    IWebSocketClient::OnClosedCallback onClosed;
    IWebSocketClient::OnMessageCallback onMessage;
    std::weak_ptr<Inspector> inspector;
    std::thread::id closeThread;
    bool ownedDuringClose{false};
    int closes{0};
  };

  class Socket final : public IWebSocketClient {
   public:
    explicit Socket(std::shared_ptr<SocketState> state)
        : state_(std::move(state)) {}

    void setOnClosedCallback(OnClosedCallback&& callback) noexcept override {
      state_->onClosed = std::move(callback);
    }

    void setOnMessageCallback(OnMessageCallback&& callback) noexcept override {
      state_->onMessage = std::move(callback);
    }

    void connect(const std::string& /*url*/, OnConnectCallback&& callback)
        override {
      state_->onConnect = std::move(callback);
    }

    void close(const std::string& reason) override {
      ++state_->closes;
      state_->closeThread = std::this_thread::get_id();
      state_->ownedDuringClose = !state_->inspector.expired();
      if (state_->onClosed) {
        state_->onClosed(reason);
      }
    }

    void send(const std::string& /*message*/) override {}
    void ping() override {}

   private:
    std::shared_ptr<SocketState> state_;
  };

  void SetUp() override {
    socket = std::make_shared<SocketState>();
    inspector = std::make_shared<Inspector>(
        "shutdown-test",
        "test-device",
        [state = socket]() { return std::make_unique<Socket>(state); },
        []() { return std::unique_ptr<IHttpClient>{}; });
    socket->inspector = inspector;
  }

  void TearDown() override {
    if (inspector) {
      inspector->shutdown();
    }
  }

  std::shared_ptr<SocketState> socket;
  std::shared_ptr<Inspector> inspector;
};

TEST_F(InspectorShutdownTest, ShutdownDisposesPageAndSocketWhileOwned) {
  auto pageCount = jsinspector_modern::getInspectorInstance().getPages().size();
  inspector->ensureHostTarget({}, {});
  EXPECT_NE(inspector->inspectorTarget(), nullptr);
  inspector->connectDebugger("http://localhost:8081/inspector/device");
  std::thread::id inspectorThread;
  inspector->runOnInspectorThreadSync(
      [&]() { inspectorThread = std::this_thread::get_id(); });
  ASSERT_TRUE(socket->onConnect);
  EXPECT_EQ(
      jsinspector_modern::getInspectorInstance().getPages().size(),
      pageCount + 1);

  inspector->shutdown();

  EXPECT_EQ(inspector->inspectorTarget(), nullptr);
  EXPECT_EQ(
      jsinspector_modern::getInspectorInstance().getPages().size(), pageCount);
  EXPECT_EQ(socket->closes, 1);
  EXPECT_EQ(socket->closeThread, inspectorThread);
  EXPECT_TRUE(socket->ownedDuringClose);
  EXPECT_EQ(inspector.use_count(), 1);
  inspector->shutdown();
  EXPECT_EQ(socket->closes, 1);
  inspector.reset();
  EXPECT_TRUE(socket->inspector.expired());
}

TEST_F(
    InspectorShutdownTest,
    ShutdownDropsDelayedOwnersAndRejectsLateCallbacks) {
  InspectorThread& dispatch = *inspector;
  bool ran = false;
  dispatch.invokeElsePost(
      [owner = inspector, &ran]() { ran = true; }, std::chrono::hours(1));

  inspector->shutdown();

  EXPECT_FALSE(ran);
  EXPECT_EQ(inspector.use_count(), 1);
  dispatch.invokeElsePost([&]() { ran = true; });
  dispatch.invokeElsePost([&]() { ran = true; }, std::chrono::hours(1));
  inspector->connectDebugger("http://localhost:8081/inspector/device");
  EXPECT_FALSE(ran);
  EXPECT_FALSE(socket->onConnect);
  inspector.reset();
  EXPECT_TRUE(socket->inspector.expired());
}

TEST_F(
    InspectorShutdownTest,
    LateTransportFailureCannotReconnectAfterShutdown) {
  inspector->connectDebugger("http://localhost:8081/inspector/device");
  inspector->runOnInspectorThreadSync([]() {});
  ASSERT_TRUE(socket->onConnect);
  auto onConnect = socket->onConnect;
  auto onMessage = socket->onMessage;

  inspector->shutdown();
  onConnect(false, "late failure");
  onMessage(R"({"event":"getPages"})");

  EXPECT_EQ(socket->closes, 1);
  EXPECT_EQ(inspector.use_count(), 1);
  inspector.reset();
  EXPECT_TRUE(socket->inspector.expired());
}

} // namespace facebook::react

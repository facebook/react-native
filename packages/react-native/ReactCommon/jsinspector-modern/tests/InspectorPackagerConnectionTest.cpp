/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/Format.h>
#include <folly/dynamic.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>

#include <functional>
#include <memory>

#include "FollyDynamicMatchers.h"
#include "InspectorMocks.h"
#include "UniquePtrFactory.h"

using namespace ::testing;
using namespace std::literals::string_literals;
using folly::dynamic, folly::parseJson, folly::toJson, folly::format,
    folly::sformat;

namespace facebook::react::jsinspector_modern {

namespace {

class InspectorPackagerConnectionTest : public testing::Test {
 protected:
  InspectorPackagerConnectionTest()
      : packagerConnection_(InspectorPackagerConnection{
            "ws://mock-host:12345",
            "my-app",
            packagerConnectionDelegates_.make_unique()}) {
    ON_CALL(*packagerConnectionDelegate(), connectWebSocket(_, _))
        .WillByDefault(webSockets_.lazily_make_unique<
                       const std::string&,
                       std::weak_ptr<IWebSocketDelegate>>());
  }

  ~InspectorPackagerConnectionTest() override {
    // Clean up all pages currently registered with the inspector.
    std::vector<int> pagesToRemove;
    for (auto& page : getInspectorInstance().getPages()) {
      pagesToRemove.push_back(page.id);
    }
    for (auto id : pagesToRemove) {
      getInspectorInstance().removePage(id);
    }
  }

  MockInspectorPackagerConnectionDelegate* packagerConnectionDelegate() {
    // We only create one PackagerConnectionDelegate per test.
    EXPECT_EQ(packagerConnectionDelegates_.objectsVended(), 1);
    return packagerConnectionDelegates_[0];
  }

  UniquePtrFactory<MockInspectorPackagerConnectionDelegate>
      packagerConnectionDelegates_;
  /**
   * webSockets_ will hold the WebSocket instance(s) owned by
   * packagerConnection_ while also allowing us to access them during
   * the test. We can send messages *to* packagerConnection_ by
   * calling webSockets_[i]->getDelegate().didReceiveMessage(...). Messages
   * *from* packagerConnection_ will be found as calls to
   * webSockets_[i]->send, which is a mock method installed by gmock.
   * These are strict mocks, so method calls will fail if they are not
   * expected with a corresponding call to EXPECT_CALL(...) - for example
   * if unexpected WebSocket messages are sent.
   */
  UniquePtrFactory<StrictMock<MockWebSocket>> webSockets_;
  /**
   * localConnections_ will hold the LocalConnection instances owned
   * by packagerConnection_ while also allowing us to access them
   * during the test.
   * These are strict mocks, so method calls will fail if they are not
   * expected with a corresponding call to EXPECT_CALL(...).
   */
  UniquePtrFactory<StrictMock<MockLocalConnection>> localConnections_;
  std::optional<InspectorPackagerConnection> packagerConnection_;
};

} // namespace

TEST_F(InspectorPackagerConnectionTest, TestConnectThenDestroy) {
  packagerConnection_->connect();

  // The connection should be established immediately.
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_EQ(webSockets_[0]->url, "ws://mock-host:12345");
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Destroying packagerConnection_ should close the underlying WebSocket (by
  // destroying it).
  packagerConnection_.reset();
  EXPECT_FALSE(webSockets_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectMultipleTimes) {
  packagerConnection_->connect();

  packagerConnection_->connect();

  // The WebSocket gets recreated and the connection is in a valid state.
  EXPECT_FALSE(webSockets_[0]);
  ASSERT_TRUE(webSockets_[1]);
  EXPECT_EQ(webSockets_[1]->url, "ws://mock-host:12345");
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Destroying packagerConnection_ should close the underlying WebSocket (by
  // destroying it).
  packagerConnection_.reset();
  EXPECT_FALSE(webSockets_[1]);
}

TEST_F(InspectorPackagerConnectionTest, TestCloseQuietly) {
  packagerConnection_->connect();

  ASSERT_TRUE(webSockets_[0]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  packagerConnection_->closeQuietly();
  EXPECT_FALSE(packagerConnection_->isConnected());
  EXPECT_FALSE(webSockets_[0]);

  // Calling closeQuietly again has no effect.
  packagerConnection_->closeQuietly();
  EXPECT_FALSE(packagerConnection_->isConnected());
  EXPECT_FALSE(webSockets_[0]);

  // Connecting again is a noop (except for logging an error).
  packagerConnection_->connect();
  EXPECT_FALSE(packagerConnection_->isConnected());
  EXPECT_FALSE(webSockets_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestGetPages) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  // The list of pages is empty at first.
  EXPECT_CALL(*webSockets_[0], send(JsonEq(R"({
      "event": "getPages",
      "payload": []
    })")))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");

  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // getPages now reports the page we registered.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("getPages")),
          AtJsonPtr(
              "/payload",
              ElementsAreArray({AllOf(
                  AtJsonPtr("/app", Eq("my-app")),
                  AtJsonPtr("/title", Eq("mock-title [C++ connection]")),
                  AtJsonPtr("/vm", Eq("mock-vm")),
                  AtJsonPtr("/id", Eq(std::to_string(pageId))))}))))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");

  getInspectorInstance().removePage(pageId);

  // getPages is back to reporting no pages.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonEq(
          R"({
              "event": "getPages",
              "payload": []
            })")))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");
}

TEST_F(InspectorPackagerConnectionTest, TestSendReceiveEvents) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the mocked backend (local) to the frontend (remote)
  // and observe it being sent via the socket.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("wrappedEvent")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr(
              "/payload/wrappedEvent",
              JsonEq(
                  R"({
                    "method": "FakeDomain.eventTriggered",
                    "params": ["arg1", "arg2"]
                  })"))))))
      .RetiresOnSaturation();
  localConnections_[0]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventTriggered",
                                                            "params": ["arg1", "arg2"]
                                                          })");

  // Send an event from the frontend (remote) to the backend (local) and
  // observe it being received by localConnection.
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(1234)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
      toJson(std::to_string(pageId)),
      toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));
}

TEST_F(InspectorPackagerConnectionTest, TestSendReceiveEventsToMultiplePages) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  std::vector<int> pageIds;

  const int kNumPages = 2;
  for (int i = 0; i < kNumPages; ++i) {
    pageIds.push_back(getInspectorInstance().addPage(
        "mock-title",
        "mock-vm",
        localConnections_
            .lazily_make_unique<std::unique_ptr<IRemoteConnection>>()));
    if (i > 0) {
      ASSERT_NE(pageIds[i], pageIds[i - 1])
          << "Received duplicate page IDs from inspector.";
    }
  }

  for (int i = 0; i < kNumPages; ++i) {
    // Connect to the i-th page.
    webSockets_[0]->getDelegate().didReceiveMessage(sformat(
        R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
        toJson(std::to_string(pageIds[i]))));
    ASSERT_TRUE(localConnections_[i]);
  }

  // Send an event from each LocalConnection and observe it being sent via
  // the socket.
  for (int i = 0; i < kNumPages; ++i) {
    // Generate a unique method name for this page to validate that we are
    // routing the events correctly.
    std::string method =
        "FakeDomain.eventFromPage"s + std::to_string(pageIds[i]);
    EXPECT_CALL(
        *webSockets_[0],
        send(JsonParsed(AllOf(
            AtJsonPtr("/event", Eq("wrappedEvent")),
            AtJsonPtr("/payload/pageId", Eq(std::to_string(pageIds[i]))),
            AtJsonPtr(
                "/payload/wrappedEvent",
                JsonParsed(AtJsonPtr("/method", Eq(method))))))))
        .RetiresOnSaturation();
    localConnections_[i]->getRemoteConnection().onMessage(
        toJson(dynamic::object("method", method)));
  }

  // Send an event from the frontend (remote) to the backend (local) and
  // observe it being received by each LocalConnection.
  for (int i = 0; i < kNumPages; ++i) {
    // Generate a unique method name for this page to validate that we are
    // routing the events correctly.
    std::string method =
        "FakeDomain.methodToPage"s + std::to_string(pageIds[i]);
    EXPECT_CALL(
        *localConnections_[i],
        sendMessage(JsonParsed(AtJsonPtr("/method", Eq(method)))))
        .RetiresOnSaturation();
    webSockets_[0]->getDelegate().didReceiveMessage(sformat(
        R"({{
            "event": "wrappedEvent",
            "payload": {{
              "pageId": {0},
              "wrappedEvent": {1}
            }}
          }})",
        toJson(std::to_string(pageIds[i])),
        toJson(toJson(dynamic::object("method", method)))));
  }
}

TEST_F(InspectorPackagerConnectionTest, TestSendEventToAllConnections) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Impersonate the frontend (remote) to send a message to all (local)
  // connections.
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(1234)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();
  packagerConnection_->sendEventToAllConnections(R"({
    "method": "FakeDomain.fakeMethod",
    "id": 1234,
    "params": ["arg1", "arg2"]
  })");
}

TEST_F(InspectorPackagerConnectionTest, TestConnectThenDisconnect) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectThenCloseSocket) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Notify that the socket was closed.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didClose();
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectThenSocketFailure) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Notify that the socket was closed (implicitly, as the result of an error).
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didFailWithError(ECONNABORTED, "Test error");
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestExplicitCloseAfterSocketFailure) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Notify that the socket was closed (implicitly, as the result of an error).
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();

  // For convenience, the mock scheduleCallback usually calls the callback
  // immediately. However, here we want the async behaviour so we can ensure
  // only one reconnection gets scheduled.
  std::function<void()> scheduledCallback;
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .WillOnce(
          [&](std::function<void(void)> callback, std::chrono::milliseconds) {
            EXPECT_FALSE(scheduledCallback);
            scheduledCallback = callback;
          })
      .RetiresOnSaturation();

  {
    // The WebSocket instance gets destroyed during didFailWithError, so extract
    // the delegate in order to call didClose.
    std::shared_ptr webSocketDelegate = webSockets_[0]->delegate.lock();

    webSocketDelegate->didFailWithError(ECONNABORTED, "Test error");
    webSocketDelegate->didClose();
  }

  ASSERT_FALSE(localConnections_[0]);
  // We're still disconnected since we haven't called the reconnect callback.
  ASSERT_FALSE(packagerConnection_->isConnected());

  // Flush the callback queue.
  EXPECT_TRUE(scheduledCallback);
  scheduledCallback();

  ASSERT_TRUE(packagerConnection_->isConnected());
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestConnectWhileAlreadyConnectedCausesDisconnection) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Try connecting to the same page again. This results in a disconnection.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestMultipleDisconnect) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Disconnect again. This is a noop.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestDisconnectThenSendEvent) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Send an event from the frontend (remote) to the backend (local). This
  // is a noop.
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
      toJson(std::to_string(pageId)),
      toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));
}

TEST_F(InspectorPackagerConnectionTest, TestSendEventToUnknownPage) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  // Send an event from the frontend (remote) to the backend (local). This
  // is a noop (except for logging).
  webSockets_[0]->getDelegate().didReceiveMessage(sformat(
      R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": "1234",
            "wrappedEvent": {0}
          }}
        }})",
      toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectSuccessful) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didClose();
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_TRUE(webSockets_[1]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectFailure) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .Times(2)
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didClose();
  EXPECT_FALSE(webSockets_[0]);
  ASSERT_TRUE(webSockets_[1]);
  webSockets_[1]->getDelegate().didClose();
  EXPECT_FALSE(webSockets_[1]);
  ASSERT_TRUE(webSockets_[2]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();

  EXPECT_FALSE(webSockets_[2]);
  EXPECT_FALSE(packagerConnection_->isConnected());
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectOnSocketError) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didFailWithError(ECONNRESET, "Test error");
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_TRUE(webSockets_[1]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectOnSocketErrorWithNoCode) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didFailWithError(std::nullopt, "Test error");
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_TRUE(webSockets_[1]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();
}

TEST_F(InspectorPackagerConnectionTest, TestNoReconnectOnConnectionRefused) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  webSockets_[0]->getDelegate().didFailWithError(ECONNREFUSED, "Test error");
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_FALSE(packagerConnection_->isConnected());
}

TEST_F(InspectorPackagerConnectionTest, TestUnknownEvent) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  // This is a noop (other than logging an error).
  webSockets_[0]->getDelegate().didReceiveMessage(R"({"event": "foo"})");
}

TEST_F(InspectorPackagerConnectionTest, TestMalformedEvent) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  // This is a noop (other than logging an error).
  webSockets_[0]->getDelegate().didReceiveMessage("this is not json");
  webSockets_[0]->getDelegate().didReceiveMessage("{");
  webSockets_[0]->getDelegate().didReceiveMessage("");
}

TEST_F(InspectorPackagerConnectionTest, TestEventsNotConformingToType) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  // These are all noops (other than logging an error).
  webSockets_[0]->getDelegate().didReceiveMessage(R"({})");
  webSockets_[0]->getDelegate().didReceiveMessage(
      R"({"event": "wrappedEvent"})");
  webSockets_[0]->getDelegate().didReceiveMessage(R"({"event": "connect"})");
  webSockets_[0]->getDelegate().didReceiveMessage(R"({"event": "disconnect"})");
  webSockets_[0]->getDelegate().didReceiveMessage(
      R"({"payload": {"pageId": "1"}})");
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestWebSocketDelegateIsDestroyedWithConnectionByDefault) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  std::weak_ptr delegate = webSockets_[0]->delegate;
  EXPECT_TRUE(delegate.lock());

  packagerConnection_.reset();
  EXPECT_FALSE(delegate.lock());
}

// Edge case: When the C++ layer has released the InspectorPackagerConnection,
// the platform bindings can still call methods on IWebSocketDelegate through
// a shared_ptr (typically _briefly_ upgraded from the weak_ptr we provide).
TEST_F(
    InspectorPackagerConnectionTest,
    TestWebSocketDelegateCanOutliveConnection) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  std::shared_ptr retainedWebSocketDelegate = webSockets_[0]->delegate.lock();
  ASSERT_TRUE(retainedWebSocketDelegate);

  // Destroy our InspectorPackagerConnection. We can't call methods on it
  // anymore, but its internals are still valid and it is still responding to
  // socket messages.
  packagerConnection_.reset();

  auto pageId = getInspectorInstance().addPage(
      "mock-title",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  retainedWebSocketDelegate->didReceiveMessage(sformat(
      R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
      toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the frontend (remote) to the backend (local) and
  // observe it being received by localConnection.
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(1234)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();

  retainedWebSocketDelegate->didReceiveMessage(sformat(
      R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
      toJson(std::to_string(pageId)),
      toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));

  retainedWebSocketDelegate.reset();
  EXPECT_FALSE(localConnections_[0]);
  EXPECT_FALSE(webSockets_[0]);
}

} // namespace facebook::react::jsinspector_modern

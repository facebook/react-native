/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/PageTarget.h>

#include <memory>

#include "FollyDynamicMatchers.h"
#include "InspectorMocks.h"
#include "UniquePtrFactory.h"

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

class PageTargetTest : public Test {
 protected:
  PageTargetTest() {
    EXPECT_CALL(instanceTargetDelegate_, createRuntimeAgent(_, _))
        .WillRepeatedly(
            runtimeAgents_
                .lazily_make_unique<FrontendChannel, SessionState&>());
  }

  void connect() {
    ASSERT_FALSE(toPage_) << "Can only connect once in a PageTargetTest.";
    toPage_ = page_.connect(
        remoteConnections_.make_unique(),
        {.integrationName = "PageTargetTest"});

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL(*remoteConnections_[0], onDisconnect());
  }

  MockPageTargetDelegate pageTargetDelegate_;

  MockRemoteConnection& fromPage() {
    assert(toPage_);
    return *remoteConnections_[0];
  }

  PageTarget page_{pageTargetDelegate_};

  MockInstanceTargetDelegate instanceTargetDelegate_;

  UniquePtrFactory<StrictMock<MockRuntimeAgent>> runtimeAgents_;

 private:
  UniquePtrFactory<StrictMock<MockRemoteConnection>> remoteConnections_;

 protected:
  // NOTE: Needs to be destroyed before page_.
  std::unique_ptr<ILocalConnection> toPage_;
};

/**
 * Simplified test harness focused on sending messages to and from a PageTarget.
 */
class PageTargetProtocolTest : public PageTargetTest {
 public:
  PageTargetProtocolTest() {
    connect();
  }

 private:
  // Protocol tests shouldn't manually call connect()
  using PageTargetTest::connect;
};

} // namespace

TEST_F(PageTargetProtocolTest, UnrecognizedMethod) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32601)), AtJsonPtr("/id", Eq(1))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "SomeUnrecognizedMethod",
                           "params": [1, 2]
                         })");
}

TEST_F(PageTargetProtocolTest, TypeErrorInMethodName) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32600)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": 42,
                           "params": [1, 2]
                         })");
}

TEST_F(PageTargetProtocolTest, MissingId) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32600)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "method": "SomeUnrecognizedMethod",
                           "params": [1, 2]
                         })");
}

TEST_F(PageTargetProtocolTest, MalformedJson) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32700)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage("{");
}

TEST_F(PageTargetProtocolTest, InjectLogsToIdentifyBackend) {
  InSequence s;

  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Log.entryAdded"),
          AtJsonPtr("/params/entry", Not(IsEmpty()))))))
      .Times(2)
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Log.enable"
                         })");
}

TEST_F(PageTargetProtocolTest, PageReloadMethod) {
  InSequence s;

  EXPECT_CALL(
      pageTargetDelegate_,
      onReload(Eq(PageTargetDelegate::PageReloadRequest{
          .ignoreCache = std::nullopt,
          .scriptToEvaluateOnLoad = std::nullopt})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Page.reload"
                         })");

  EXPECT_CALL(
      pageTargetDelegate_,
      onReload(Eq(PageTargetDelegate::PageReloadRequest{
          .ignoreCache = true, .scriptToEvaluateOnLoad = "alert('hello');"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Page.reload",
                           "params": {
                             "ignoreCache": true,
                             "scriptToEvaluateOnLoad": "alert('hello');"
                           }
                         })");
}

TEST_F(PageTargetProtocolTest, RegisterUnregisterInstanceWithoutEvents) {
  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredInstanceWithoutEvents) {
  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  connect();

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RegisterUnregisterInstanceWithEvents) {
  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredInstanceWithEvents) {
  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  connect();

  InSequence s;

  EXPECT_CALL(*runtimeAgents_[0], handleRequest(Eq(cdp::preparse(R"({
                                                                    "id": 1,
                                                                    "method": "Runtime.enable"
                                                                  })"))))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));

  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RuntimeAgentLifecycle) {
  {
    auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

    EXPECT_TRUE(runtimeAgents_[0]);

    page_.unregisterInstance(instanceTarget);
  }

  EXPECT_FALSE(runtimeAgents_[0]);

  {
    auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

    EXPECT_TRUE(runtimeAgents_[1]);

    page_.unregisterInstance(instanceTarget);
  }

  EXPECT_FALSE(runtimeAgents_[1]);
}

TEST_F(PageTargetProtocolTest, MethodNotHandledByRuntimeAgent) {
  InSequence s;

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  ASSERT_TRUE(runtimeAgents_[0]);
  EXPECT_CALL(*runtimeAgents_[0], handleRequest(_))
      .WillOnce(Return(false))
      .RetiresOnSaturation();
  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, MethodHandledByRuntimeAgent) {
  InSequence s;

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  ASSERT_TRUE(runtimeAgents_[0]);
  EXPECT_CALL(*runtimeAgents_[0], handleRequest(_))
      .WillOnce(Return(true))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  static constexpr auto kFooResponse = R"({
    "id": 1,
    "result": {
      "fooValue": 42
    }
  })";
  EXPECT_CALL(fromPage(), onMessage(JsonEq(kFooResponse)))
      .RetiresOnSaturation();
  runtimeAgents_[0]->frontendChannel(kFooResponse);

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, MessageRoutingWhileNoRuntimeAgent) {
  InSequence s;

  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  ASSERT_TRUE(runtimeAgents_[0]);
  EXPECT_CALL(*runtimeAgents_[0], handleRequest(_))
      .WillOnce(Return(true))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  static constexpr auto kFooResponse = R"({
    "id": 2,
    "result": {
      "fooValue": 42
    }
  })";
  EXPECT_CALL(fromPage(), onMessage(JsonEq(kFooResponse)))
      .RetiresOnSaturation();
  runtimeAgents_[0]->frontendChannel(kFooResponse);

  page_.unregisterInstance(instanceTarget);

  EXPECT_FALSE(runtimeAgents_[0]);

  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 3,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");
}

TEST_F(PageTargetProtocolTest, InstanceWithNullRuntimeAgent) {
  InSequence s;

  EXPECT_CALL(instanceTargetDelegate_, createRuntimeAgent(_, _))
      .WillRepeatedly(ReturnNull());

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate_);

  EXPECT_FALSE(runtimeAgents_[0]);

  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RuntimeAgentHasAccessToSessionState) {
  InSequence s;

  // Send Runtime.enable before registering the Instance (which in turns creates
  // the RuntimeAgent).
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  page_.registerInstance(instanceTargetDelegate_);
  ASSERT_TRUE(runtimeAgents_[0]);

  EXPECT_TRUE(runtimeAgents_[0]->sessionState.isRuntimeDomainEnabled);

  // Send Runtime.disable while the RuntimeAgent exists - it receives the
  // message and can also observe the updated state.
  EXPECT_CALL(*runtimeAgents_[0], handleRequest(Eq(cdp::preparse(R"({
                                                                    "id": 2,
                                                                    "method": "Runtime.disable"
                                                                  })"))));
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Runtime.disable"
                         })");

  EXPECT_FALSE(runtimeAgents_[0]->sessionState.isRuntimeDomainEnabled);
}

} // namespace facebook::react::jsinspector_modern

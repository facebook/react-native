/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/executors/QueuedImmediateExecutor.h>
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
  folly::QueuedImmediateExecutor immediateExecutor_;

 protected:
  PageTargetTest() {
    EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _))
        .WillRepeatedly(runtimeAgentDelegates_.lazily_make_unique<
                        FrontendChannel,
                        SessionState&,
                        std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
                        const ExecutionContextDescription&>());
  }

  void connect() {
    ASSERT_FALSE(toPage_) << "Can only connect once in a PageTargetTest.";
    toPage_ = page_->connect(
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

  VoidExecutor inspectorExecutor_ = [this](auto callback) {
    immediateExecutor_.add(callback);
  };

  std::shared_ptr<PageTarget> page_ =
      PageTarget::create(pageTargetDelegate_, inspectorExecutor_);

  MockInstanceTargetDelegate instanceTargetDelegate_;
  MockRuntimeTargetDelegate runtimeTargetDelegate_;
  // We don't have access to a jsi::Runtime in these tests, so just use an
  // executor that never runs the scheduled callbacks.
  RuntimeExecutor runtimeExecutor_ = [](auto) {};

  UniquePtrFactory<StrictMock<MockRuntimeAgentDelegate>> runtimeAgentDelegates_;

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
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredInstanceWithoutEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  connect();

  page_->unregisterInstance(instanceTarget);
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

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredInstanceWithEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  connect();

  InSequence s;

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
  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredRuntimeWithEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  connect();

  InSequence s;

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
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
  runtimeAgentDelegates_[0]->frontendChannel(kFooResponse);

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RuntimeAgentDelegateLifecycle) {
  {
    auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
    auto& runtimeTarget = instanceTarget.registerRuntime(
        runtimeTargetDelegate_, runtimeExecutor_);

    EXPECT_TRUE(runtimeAgentDelegates_[0]);

    instanceTarget.unregisterRuntime(runtimeTarget);
    page_->unregisterInstance(instanceTarget);
  }

  EXPECT_FALSE(runtimeAgentDelegates_[0]);

  {
    auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
    auto& runtimeTarget = instanceTarget.registerRuntime(
        runtimeTargetDelegate_, runtimeExecutor_);

    EXPECT_TRUE(runtimeAgentDelegates_[1]);

    instanceTarget.unregisterRuntime(runtimeTarget);
    page_->unregisterInstance(instanceTarget);
  }

  EXPECT_FALSE(runtimeAgentDelegates_[1]);
}

TEST_F(PageTargetProtocolTest, MethodNotHandledByRuntimeAgentDelegate) {
  InSequence s;

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
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

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, MethodHandledByRuntimeAgentDelegate) {
  InSequence s;

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
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
  runtimeAgentDelegates_[0]->frontendChannel(kFooResponse);

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, MessageRoutingWhileNoRuntimeAgentDelegate) {
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

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
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
  runtimeAgentDelegates_[0]->frontendChannel(kFooResponse);

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);

  EXPECT_FALSE(runtimeAgentDelegates_[0]);

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

TEST_F(PageTargetProtocolTest, InstanceWithNullRuntimeAgentDelegate) {
  InSequence s;

  EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _))
      .WillRepeatedly(ReturnNull());

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  EXPECT_FALSE(runtimeAgentDelegates_[0]);

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

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RuntimeAgentDelegateHasAccessToSessionState) {
  InSequence s;

  // Send Runtime.enable before registering the Instance (which in turns creates
  // the RuntimeAgentDelegate).
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  EXPECT_CALL(
      fromPage(),
      onMessage(
          JsonParsed(AtJsonPtr("/method", "Runtime.executionContextCreated"))))
      .RetiresOnSaturation();
  instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);
  ASSERT_TRUE(runtimeAgentDelegates_[0]);

  EXPECT_TRUE(runtimeAgentDelegates_[0]->sessionState.isRuntimeDomainEnabled);

  // Send Runtime.disable while the RuntimeAgentDelegate exists - it receives
  // the message and can also observe the updated state.
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(Eq(cdp::preparse(R"({
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

  EXPECT_FALSE(runtimeAgentDelegates_[0]->sessionState.isRuntimeDomainEnabled);
}

} // namespace facebook::react::jsinspector_modern

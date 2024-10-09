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

#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/InspectorInterfaces.h>

#include <memory>

#include "FollyDynamicMatchers.h"
#include "InspectorMocks.h"
#include "UniquePtrFactory.h"

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

class HostTargetTest : public Test {
  folly::QueuedImmediateExecutor immediateExecutor_;

 protected:
  HostTargetTest() {
    EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
        .WillRepeatedly(runtimeAgentDelegates_.lazily_make_unique<
                        FrontendChannel,
                        SessionState&,
                        std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
                        const ExecutionContextDescription&,
                        RuntimeExecutor>());
  }

  void connect() {
    ASSERT_FALSE(toPage_) << "Can only connect once in a HostTargetTest.";
    auto conn = makeConnection();
    toPage_ = std::move(conn.first);
  }

  std::pair<std::unique_ptr<ILocalConnection>, MockRemoteConnection&>
  makeConnection() {
    size_t connectionIndex = remoteConnections_.objectsVended();
    auto toPage = page_->connect(remoteConnections_.make_unique());

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL(*remoteConnections_[connectionIndex], onDisconnect());
    return {std::move(toPage), *remoteConnections_[connectionIndex]};
  }

  MockHostTargetDelegate hostTargetDelegate_;

  MockRemoteConnection& fromPage() {
    assert(toPage_);
    return *remoteConnections_[0];
  }

  VoidExecutor inspectorExecutor_ = [this](auto callback) {
    immediateExecutor_.add(callback);
  };

  std::shared_ptr<HostTarget> page_ =
      HostTarget::create(hostTargetDelegate_, inspectorExecutor_);

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
 * Simplified test harness focused on sending messages to and from a HostTarget.
 */
class HostTargetProtocolTest : public HostTargetTest {
 public:
  HostTargetProtocolTest() {
    connect();
  }

 private:
  // Protocol tests shouldn't manually call connect()
  using HostTargetTest::connect;
};

} // namespace

TEST_F(HostTargetProtocolTest, UnrecognizedMethod) {
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

TEST_F(HostTargetProtocolTest, TypeErrorInMethodName) {
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

TEST_F(HostTargetProtocolTest, MissingId) {
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

TEST_F(HostTargetProtocolTest, MalformedJson) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32700)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage("{");
}

TEST_F(HostTargetProtocolTest, InjectLogsToIdentifyBackend) {
  InSequence s;

  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Log.entryAdded"),
          AtJsonPtr("/params/entry", Not(IsEmpty()))))))
      .Times(AtLeast(1));
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

TEST_F(HostTargetProtocolTest, PageReloadMethod) {
  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      onReload(Eq(HostTargetDelegate::PageReloadRequest{
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
      hostTargetDelegate_,
      onReload(Eq(HostTargetDelegate::PageReloadRequest{
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

TEST_F(HostTargetProtocolTest, OverlaySetPausedInDebuggerMessageMethod) {
  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = std::nullopt})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Overlay.setPausedInDebuggerMessage"
                         })");

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = "Paused in debugger"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Overlay.setPausedInDebuggerMessage",
                           "params": {
                             "message": "Paused in debugger"
                           }
                         })");

  // A cleanup message is sent automatically when we destroy the session.
  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = std::nullopt})))
      .RetiresOnSaturation();
}

TEST_F(HostTargetProtocolTest, OverlaySetPausedInDebuggerMultipleClients) {
  auto [toPage2, fromPage2] = makeConnection();

  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = "Paused in debugger - client 1"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Overlay.setPausedInDebuggerMessage",
                           "params": {
                             "message": "Paused in debugger - client 1"
                           }
                         })");

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = "Paused in debugger - client 2"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage2, onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage2->sendMessage(R"({
                           "id": 1,
                           "method": "Overlay.setPausedInDebuggerMessage",
                           "params": {
                             "message": "Paused in debugger - client 2"
                           }
                         })");

  toPage2.reset();

  // The cleanup message is sent exactly once.
  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = std::nullopt})))
      .Times(1)
      .RetiresOnSaturation();
}

TEST_F(HostTargetProtocolTest, RegisterUnregisterInstanceWithoutEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetTest, ConnectToAlreadyRegisteredInstanceWithoutEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  connect();

  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetProtocolTest, RegisterUnregisterInstanceWithEvents) {
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

TEST_F(HostTargetTest, ConnectToAlreadyRegisteredInstanceWithEvents) {
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

TEST_F(HostTargetTest, ConnectToAlreadyRegisteredRuntimeWithEvents) {
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

TEST_F(HostTargetProtocolTest, RuntimeAgentDelegateLifecycle) {
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

TEST_F(HostTargetProtocolTest, MethodNotHandledByRuntimeAgentDelegate) {
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

TEST_F(HostTargetProtocolTest, MethodHandledByRuntimeAgentDelegate) {
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

TEST_F(HostTargetProtocolTest, MessageRoutingWhileNoRuntimeAgentDelegate) {
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

TEST_F(HostTargetProtocolTest, InstanceWithNullRuntimeAgentDelegate) {
  InSequence s;

  EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
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

TEST_F(HostTargetProtocolTest, RuntimeAgentDelegateHasAccessToSessionState) {
  // Ignore console messages originating inside the backend.
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Runtime.consoleAPICalled"),
          AtJsonPtr("/params/context", "main#InstanceAgent")))))
      .Times(AnyNumber());

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

TEST_F(HostTargetTest, HostCommands) {
  // Set up expectations for the RuntimeAgentDelegate that will be created
  // as part of the private session inside HostCommandSender.
  EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
      .WillOnce([this](
                    FrontendChannel frontendChannel,
                    SessionState& sessionState,
                    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
                        exportedState,
                    const ExecutionContextDescription& context,
                    RuntimeExecutor runtimeExecutor) {
        auto delegate = runtimeAgentDelegates_.make_unique(
            std::move(frontendChannel),
            sessionState,
            std::move(exportedState),
            context,
            std::move(runtimeExecutor));
        InSequence s;
        EXPECT_CALL(
            *delegate,
            handleRequest(
                Field(&cdp::PreparsedRequest::method, "Debugger.resume")))
            .WillOnce(Return(false))
            .RetiresOnSaturation();
        EXPECT_CALL(
            *delegate,
            handleRequest(
                Field(&cdp::PreparsedRequest::method, "Debugger.stepOver")))
            .WillOnce(Return(false))
            .RetiresOnSaturation();
        return delegate;
      })
      .RetiresOnSaturation();

  // No RuntimeAgent yet; this command is simply ignored.
  page_->sendCommand(HostCommand::DebuggerStepOver);
  EXPECT_FALSE(runtimeAgentDelegates_[0]);

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  page_->sendCommand(HostCommand::DebuggerResume);
  page_->sendCommand(HostCommand::DebuggerStepOver);
  ASSERT_TRUE(runtimeAgentDelegates_[0]);

  connect();

  // This is part of the HostCommandSender session.
  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  // This is part of the session we just connect()ed to above.
  EXPECT_TRUE(runtimeAgentDelegates_[1]);
  // We can still send commands.
  EXPECT_CALL(
      *runtimeAgentDelegates_[0],
      handleRequest(Field(&cdp::PreparsedRequest::method, "Debugger.stepOver")))
      .WillOnce(Return(false))
      .RetiresOnSaturation();
  page_->sendCommand(HostCommand::DebuggerStepOver);

  // NOTE: Our use of StrictMock ensures that the session doesn't receive any
  // noise resulting from the sendCommand call ( = no
  // runtimeAgentDelegates_[1]->handleRequest, no fromPage()->onMessage, etc).

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

} // namespace facebook::react::jsinspector_modern

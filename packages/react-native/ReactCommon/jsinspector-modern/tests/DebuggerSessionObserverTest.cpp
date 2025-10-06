/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/executors/QueuedImmediateExecutor.h>

#include "JsiIntegrationTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

class DebuggerSessionObserverTest : public JsiIntegrationPortableTestBase<
                                        JsiIntegrationTestHermesEngineAdapter,
                                        folly::QueuedImmediateExecutor> {
 protected:
  void enableRuntimeDomain() {
    InSequence s;

    auto executionContextInfo = expectMessageFromPage(JsonParsed(
        AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
    expectMessageFromPage(JsonEq(R"({
                                        "id": 1,
                                        "result": {}
                                    })"));
    toPage_->sendMessage(R"({
                                "id": 1,
                                "method": "Runtime.enable"
                            })");
  }

  void enableLogDomain() {
    InSequence s;

    EXPECT_CALL(
        fromPage(),
        onMessage(JsonParsed(AllOf(
            AtJsonPtr("/method", "Log.entryAdded"),
            AtJsonPtr("/params/entry", Not(IsEmpty()))))))
        .Times(AtLeast(1));
    expectMessageFromPage(JsonEq(R"({
                                        "id": 1,
                                        "result": {}
                                    })"));
    toPage_->sendMessage(R"({
                                "id": 1,
                                "method": "Log.enable"
                            })");
  }

  void disableRuntimeDomain() {
    InSequence s;
    expectMessageFromPage(JsonEq(R"({
                                        "id": 1,
                                        "result": {}
                                    })"));
    toPage_->sendMessage(R"({
                                "id": 1,
                                "method": "Runtime.disable"
                            })");
  }

  void disableLogDomain() {
    InSequence s;
    expectMessageFromPage(JsonEq(R"({
                                        "id": 1,
                                        "result": {}
                                    })"));
    toPage_->sendMessage(R"({
                                "id": 1,
                                "method": "Log.disable"
                            })");
  }
};

TEST_F(DebuggerSessionObserverTest, InstallsGlobalObserverObjectByDefault) {
  EXPECT_TRUE(eval("__DEBUGGER_SESSION_OBSERVER__ != null").asBool());
}

TEST_F(
    DebuggerSessionObserverTest,
    WillNotEmitStatusUpdateUnlessBothRuntimeAndLogDomainsAreEnabled) {
  EXPECT_FALSE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());

  connect();

  EXPECT_FALSE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());

  enableRuntimeDomain();

  EXPECT_FALSE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());

  enableLogDomain();

  EXPECT_TRUE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());
}

TEST_F(
    DebuggerSessionObserverTest,
    UpdatesTheStatusOnceRuntimeDomainIsDisabled) {
  connect();
  enableLogDomain();
  enableRuntimeDomain();

  EXPECT_TRUE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());

  disableRuntimeDomain();

  EXPECT_FALSE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());
}

TEST_F(DebuggerSessionObserverTest, UpdatesTheStatusOnceLogDomainIsDisabled) {
  connect();
  enableLogDomain();
  enableRuntimeDomain();

  EXPECT_TRUE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());

  disableLogDomain();

  EXPECT_FALSE(eval("__DEBUGGER_SESSION_OBSERVER__.hasActiveSession").asBool());
}

TEST_F(
    DebuggerSessionObserverTest,
    NotifiesSubscribersWhichWereSubscribedBeforeSessionInitialization) {
  eval(
      R"(
        var latestStatus = undefined;
        __DEBUGGER_SESSION_OBSERVER__.subscribers.add(updatedStatus => {
          latestStatus = updatedStatus;
        });
      )");

  EXPECT_TRUE(eval("latestStatus").isUndefined());

  connect();
  enableLogDomain();
  enableRuntimeDomain();
  EXPECT_TRUE(eval("latestStatus").asBool());

  disableLogDomain();

  EXPECT_FALSE(eval("latestStatus").asBool());
}

} // namespace facebook::react::jsinspector_modern

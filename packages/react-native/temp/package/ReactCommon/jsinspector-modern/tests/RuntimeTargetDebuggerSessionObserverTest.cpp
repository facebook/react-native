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

class RuntimeTargetDebuggerSessionObserverTest
    : public JsiIntegrationPortableTestBase<
          JsiIntegrationTestHermesEngineAdapter,
          folly::QueuedImmediateExecutor> {
 public:
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

TEST_F(
    RuntimeTargetDebuggerSessionObserverTest,
    InstallsGlobalObserverObjectByDefault) {
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_THAT(
      eval("JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__ != null)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(true)"));
}

TEST_F(
    RuntimeTargetDebuggerSessionObserverTest,
    WillNotEmitStatusUpdateUnlessBothRuntimeAndLogDomainsAreEnabled) {
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(false)"));

  connect();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(false)"));

  enableRuntimeDomain();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(false)"));

  enableLogDomain();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(true)"));
}

TEST_F(
    RuntimeTargetDebuggerSessionObserverTest,
    UpdatesTheStatusOnceOneRuntimeDomainIsDisabled) {
  auto& runtime = engineAdapter_->getRuntime();
  connect();
  enableLogDomain();
  enableRuntimeDomain();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(true)"));

  disableRuntimeDomain();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(false)"));
}

TEST_F(
    RuntimeTargetDebuggerSessionObserverTest,
    UpdatesTheStatusOnceOneLogDomainIsDisabled) {
  auto& runtime = engineAdapter_->getRuntime();
  connect();
  enableLogDomain();
  enableRuntimeDomain();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(true)"));

  disableLogDomain();

  EXPECT_THAT(
      eval(
          "JSON.stringify(globalThis.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(false)"));
}

TEST_F(
    RuntimeTargetDebuggerSessionObserverTest,
    NotifiesSubscribersWhichWereSubscribedBeforeSessionInitialization) {
  auto& runtime = engineAdapter_->getRuntime();

  eval(
      "globalThis.__DEBUGGER_SESSION_OBSERVER__.subscribers.add(updatedStatus => (globalThis.__LOREM_IPSUM__ = updatedStatus))");

  EXPECT_THAT(
      eval("JSON.stringify(globalThis.__LOREM_IPSUM__ === undefined)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(true)"));

  connect();
  enableLogDomain();
  enableRuntimeDomain();

  EXPECT_THAT(
      eval("JSON.stringify(globalThis.__LOREM_IPSUM__)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(true)"));

  disableLogDomain();

  EXPECT_THAT(
      eval("JSON.stringify(globalThis.__LOREM_IPSUM__)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(R"(false)"));
}

} // namespace facebook::react::jsinspector_modern

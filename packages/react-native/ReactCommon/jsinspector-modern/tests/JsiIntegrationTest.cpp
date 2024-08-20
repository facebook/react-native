/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/Format.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/executors/QueuedImmediateExecutor.h>

#include "JsiIntegrationTest.h"
#include "engines/JsiIntegrationTestGenericEngineAdapter.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

using namespace ::testing;
using folly::sformat;

namespace facebook::react::jsinspector_modern {

////////////////////////////////////////////////////////////////////////////////

// Some tests are specific to Hermes's CDP capabilities and some are not.
// We'll use JsiIntegrationHermesTest as an alias for Hermes-specific tests
// and JsiIntegrationPortableTest for the engine-agnostic ones.

/**
 * The list of engine adapters for which engine-agnostic tests should pass.
 */
using AllEngines = Types<
    JsiIntegrationTestHermesEngineAdapter,
    JsiIntegrationTestGenericEngineAdapter>;

using AllHermesVariants = Types<JsiIntegrationTestHermesEngineAdapter>;

template <typename EngineAdapter>
using JsiIntegrationPortableTest = JsiIntegrationPortableTestBase<
    EngineAdapter,
    folly::QueuedImmediateExecutor>;

TYPED_TEST_SUITE(JsiIntegrationPortableTest, AllEngines);

template <typename EngineAdapter>
using JsiIntegrationHermesTest = JsiIntegrationPortableTestBase<
    EngineAdapter,
    folly::QueuedImmediateExecutor>;

/**
 * Fixture class for tests that run on a ManualExecutor. Work scheduled
 * on the executor is *not* run automatically; it must be manually advanced
 * in the body of the test.
 */
template <typename EngineAdapter>
class JsiIntegrationHermesTestAsync : public JsiIntegrationPortableTestBase<
                                          EngineAdapter,
                                          folly::ManualExecutor> {
 public:
  void TearDown() override {
    // Assert there are no pending tasks on the ManualExecutor.
    auto tasksCleared = this->executor_.clear();
    EXPECT_EQ(tasksCleared, 0)
        << "There were still pending tasks on executor_ at the end of the test. Use advance() or run() as needed.";
    JsiIntegrationPortableTestBase<EngineAdapter, folly::ManualExecutor>::
        TearDown();
  }
};

TYPED_TEST_SUITE(JsiIntegrationHermesTest, AllHermesVariants);
TYPED_TEST_SUITE(JsiIntegrationHermesTestAsync, AllHermesVariants);

#pragma region AllEngines

TYPED_TEST(JsiIntegrationPortableTest, ConnectWithoutCrashing) {
  this->connect();
}

TYPED_TEST(JsiIntegrationPortableTest, ErrorOnUnknownMethod) {
  this->connect();

  this->expectMessageFromPage(
      JsonParsed(AllOf(AtJsonPtr("/id", 1), AtJsonPtr("/error/code", -32601))));

  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Foobar.unknownMethod"
                               })");
}

TYPED_TEST(JsiIntegrationPortableTest, ExecutionContextNotifications) {
  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                         "method": "Runtime.executionContextCreated",
                                         "params": {
                                           "context": {
                                             "id": 1,
                                             "origin": "",
                                             "name": "main"
                                           }
                                         }
                                       })"));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.enable"
                               })");

  this->expectMessageFromPage(JsonEq(R"({
                                         "method": "Runtime.executionContextDestroyed",
                                         "params": {
                                           "executionContextId": 1
                                         }
                                       })"));
  this->expectMessageFromPage(JsonEq(R"({
                                         "method": "Runtime.executionContextsCleared"
                                       })"));

  this->expectMessageFromPage(JsonEq(R"({
                                         "method": "Runtime.executionContextCreated",
                                         "params": {
                                           "context": {
                                             "id": 2,
                                             "origin": "",
                                             "name": "main"
                                           }
                                         }
                                       })"));
  // Simulate a reload triggered by the app (not by the debugger).
  this->reload();

  this->expectMessageFromPage(JsonEq(R"({
                                         "method": "Runtime.executionContextDestroyed",
                                         "params": {
                                           "executionContextId": 2
                                         }
                                       })"));
  this->expectMessageFromPage(JsonEq(R"({
                                         "method": "Runtime.executionContextsCleared"
                                       })"));
  this->expectMessageFromPage(JsonEq(R"({
                                                     "method": "Runtime.executionContextCreated",
                                                     "params": {
                                                       "context": {
                                                         "id": 3,
                                                         "origin": "",
                                                         "name": "main"
                                                       }
                                                     }
                                                   })"));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 2,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Page.reload"
                               })");
}

TYPED_TEST(JsiIntegrationPortableTest, AddBinding) {
  this->connect();

  InSequence s;

  auto executionContextInfo = this->expectMessageFromPage(JsonParsed(
      AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.enable"
                               })");
  ASSERT_TRUE(executionContextInfo->has_value());
  auto executionContextId =
      executionContextInfo->value()["params"]["context"]["id"];

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Runtime.addBinding",
                                 "params": {"name": "foo"}
                               })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Runtime.bindingCalled"),
      AtJsonPtr("/params/name", "foo"),
      AtJsonPtr("/params/payload", "bar"),
      AtJsonPtr("/params/executionContextId", executionContextId))));
  this->eval("globalThis.foo('bar');");
}

TYPED_TEST(JsiIntegrationPortableTest, AddedBindingSurvivesReload) {
  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.addBinding",
                                 "params": {"name": "foo"}
                               })");

  this->reload();

  // Get the new context ID by sending Runtime.enable now.
  auto executionContextInfo = this->expectMessageFromPage(JsonParsed(
      AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.enable"
                               })");
  ASSERT_TRUE(executionContextInfo->has_value());
  auto executionContextId =
      executionContextInfo->value()["params"]["context"]["id"];

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Runtime.bindingCalled"),
      AtJsonPtr("/params/name", "foo"),
      AtJsonPtr("/params/payload", "bar"),
      AtJsonPtr("/params/executionContextId", executionContextId))));
  this->eval("globalThis.foo('bar');");
}

TYPED_TEST(JsiIntegrationPortableTest, RemovedBindingRemainsInstalled) {
  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.addBinding",
                                 "params": {"name": "foo"}
                               })");

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Runtime.removeBinding",
                                 "params": {"name": "foo"}
                               })");

  this->eval("globalThis.foo('bar');");
}

TYPED_TEST(JsiIntegrationPortableTest, RemovedBindingDoesNotSurviveReload) {
  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.addBinding",
                                 "params": {"name": "foo"}
                               })");

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Runtime.removeBinding",
                                 "params": {"name": "foo"}
                               })");

  this->reload();

  EXPECT_TRUE(this->eval("typeof globalThis.foo === 'undefined'").getBool());
}

TYPED_TEST(JsiIntegrationPortableTest, AddBindingClobbersExistingProperty) {
  this->connect();

  InSequence s;

  this->eval(R"(
    globalThis.foo = 'clobbered value';
  )");

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.addBinding",
                                 "params": {"name": "foo"}
                               })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Runtime.bindingCalled"),
      AtJsonPtr("/params/name", "foo"),
      AtJsonPtr("/params/payload", "bar"))));
  this->eval("globalThis.foo('bar');");
}

TYPED_TEST(JsiIntegrationPortableTest, ExceptionDuringAddBindingIsIgnored) {
  this->connect();

  InSequence s;

  this->eval(R"(
    Object.defineProperty(globalThis, 'foo', {
      get: function () { return 42; },
      set: function () { throw new Error('nope'); },
    });
  )");

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.addBinding",
                                 "params": {"name": "foo"}
                               })");

  EXPECT_TRUE(this->eval("globalThis.foo === 42").getBool());
}

TYPED_TEST(JsiIntegrationPortableTest, FuseboxSetClientMetadata) {
  this->connect();

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));

  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "FuseboxClient.setClientMetadata",
                                 "params": {}
                               })");
}

TYPED_TEST(JsiIntegrationPortableTest, ReactNativeApplicationEnable) {
  this->connect();

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->expectMessageFromPage(JsonEq(R"({
                                          "method": "ReactNativeApplication.metadataUpdated",
                                          "params": {
                                            "integrationName": "JsiIntegrationTest"
                                          }
                                        })"));

  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "ReactNativeApplication.enable",
                                 "params": {}
                               })");
}

TYPED_TEST(JsiIntegrationPortableTest, ReactNativeApplicationDisable) {
  this->connect();

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));

  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "ReactNativeApplication.disable",
                                 "params": {}
                               })");
}

#pragma endregion // AllEngines
#pragma region AllHermesVariants

TYPED_TEST(JsiIntegrationHermesTestAsync, HermesObjectsTableDoesNotMemoryLeak) {
  // This is a regression test for T186157855 (CDPAgent leaking JSI data in
  // RemoteObjectsTable past the Runtime's lifetime)
  this->connect();
  this->executor_.run();

  InSequence s;

  this->expectMessageFromPage(JsonParsed(
      AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.enable"
                               })");
  this->executor_.run();

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Runtime.consoleAPICalled"),
      AtJsonPtr("/params/args/0/objectId", "1"))));
  this->eval(R"(console.log({a: 1});)");
  this->executor_.run();

  this->expectMessageFromPage(JsonEq(R"({
                                          "method": "Runtime.executionContextDestroyed",
                                          "params": {
                                            "executionContextId": 1
                                          }
                                        })"));
  this->expectMessageFromPage(JsonEq(R"({
                                          "method": "Runtime.executionContextsCleared"
                                        })"));
  this->expectMessageFromPage(JsonEq(R"({
                                          "method": "Runtime.executionContextCreated",
                                          "params": {
                                            "context": {
                                              "id": 2,
                                              "origin": "",
                                              "name": "main"
                                            }
                                          }
                                        })"));
  // NOTE: Doesn't crash when Hermes checks for JSI value leaks
  this->reload();
  this->executor_.run();
}

TYPED_TEST(JsiIntegrationHermesTest, EvaluateExpression) {
  this->connect();

  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {
                                           "result": {
                                             "type": "number",
                                             "value": 42
                                           }
                                         }
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.evaluate",
                                 "params": {"expression": "42"}
                               })");
}

TYPED_TEST(JsiIntegrationHermesTest, EvaluateExpressionInExecutionContext) {
  this->connect();

  InSequence s;

  auto executionContextInfo = this->expectMessageFromPage(JsonParsed(
      AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Runtime.enable"
                               })");
  ASSERT_TRUE(executionContextInfo->has_value());
  auto executionContextId =
      executionContextInfo->value()["params"]["context"]["id"].getInt();

  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {
                                           "result": {
                                             "type": "number",
                                             "value": 42
                                           }
                                         }
                                       })"));
  this->toPage_->sendMessage(sformat(
      R"({{
        "id": 1,
        "method": "Runtime.evaluate",
        "params": {{"expression": "42", "contextId": {0}}}
      }})",
      std::to_string(executionContextId)));

  // Silence notifications about execution contexts.
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 2,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Runtime.disable"
                               })");
  this->reload();

  // Now the old execution context is stale.
  this->expectMessageFromPage(
      JsonParsed(AllOf(AtJsonPtr("/id", 3), AtJsonPtr("/error/code", -32600))));
  this->toPage_->sendMessage(sformat(
      R"({{
        "id": 3,
        "method": "Runtime.evaluate",
        "params": {{"expression": "10000", "contextId": {0}}}
      }})",
      std::to_string(executionContextId)));
}

TYPED_TEST(JsiIntegrationHermesTest, ResolveBreakpointAfterEval) {
  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Debugger.enable"
                               })");

  auto scriptInfo = this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Debugger.scriptParsed"),
      AtJsonPtr("/params/url", "breakpointTest.js"))));
  this->eval(R"( // line 0
    globalThis.foo = function() { // line 1
      Date.now(); // line 2
    };
    //# sourceURL=breakpointTest.js
  )");
  ASSERT_TRUE(scriptInfo->has_value());

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/id", 2),
      AtJsonPtr("/result/locations/0/lineNumber", 2),
      AtJsonPtr(
          "/result/locations/0/scriptId",
          scriptInfo->value()["params"]["scriptId"]))));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Debugger.setBreakpointByUrl",
                                 "params": {"lineNumber": 2, "url": "breakpointTest.js"}
                               })");
}

TYPED_TEST(JsiIntegrationHermesTest, ResolveBreakpointAfterReload) {
  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Debugger.enable"
                               })");

  this->expectMessageFromPage(JsonParsed(AtJsonPtr("/id", 2)));
  this->toPage_->sendMessage(R"({
                                 "id": 2,
                                 "method": "Debugger.setBreakpointByUrl",
                                 "params": {"lineNumber": 2, "url": "breakpointTest.js"}
                               })");

  this->reload();

  auto scriptInfo = this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Debugger.scriptParsed"),
      AtJsonPtr("/params/url", "breakpointTest.js"))));
  auto breakpointInfo = this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Debugger.breakpointResolved"),
      AtJsonPtr("/params/location/lineNumber", 2))));
  this->eval(R"( // line 0
    globalThis.foo = function() { // line 1
      Date.now(); // line 2
    };
    //# sourceURL=breakpointTest.js
  )");
  ASSERT_TRUE(breakpointInfo->has_value());
  ASSERT_TRUE(scriptInfo->has_value());
  EXPECT_EQ(
      breakpointInfo->value()["params"]["location"]["scriptId"],
      scriptInfo->value()["params"]["scriptId"]);
}

TYPED_TEST(JsiIntegrationHermesTest, CDPAgentReentrancyRegressionTest) {
  this->connect();

  InSequence s;

  this->inspectorExecutor_([&]() {
    // Tasks scheduled on our executor here will be executed when this lambda
    // returns. This is integral to the bug we're trying to reproduce, so we
    // place the EXPECT_* calls at the end of the lambda body to ensure the
    // test fails if we get eager (unexpected) responses.

    // 1. Cause CDPAgent to schedule a task to process the message. Originally,
    //    the task would be simultaneously scheduled on the JS executor, and as
    //    an interrupt on the JS interpreter. It's called via the executor
    //    regardless, since the interpreter is idle at the moment.
    this->toPage_->sendMessage(R"({
                                   "id": 1,
                                   "method": "Runtime.evaluate",
                                   "params": {"expression": "Math.random(); /* Interrupts processed here. */ globalThis.x = 1 + 2"}
                                 })");

    // 2. Cause CDPAgent to schedule another task. If scheduled as an interrupt,
    //    this task will run _during_ the first task.
    this->toPage_->sendMessage(R"({
                                   "id": 2,
                                   "method": "Runtime.evaluate",
                                   "params": {"expression": "globalThis.x = 3 + 4"}
                                 })");

    //  This setup used to trigger three distinct bugs in CDPAgent:
    //    - The first task would be triggered twice due to a race condition
    //      between the executor and the interrupt handler. (D54771697)
    //    - The second task would deadlock due to the first task holding a lock
    //      preventing any other CDPAgent tasks from running. (D54838179)
    //    - The second task would complete first, returning `evaluate`
    //      responses out of order and (crucially) performing any JS side
    //      effects out of order. (D55250610)

    this->expectMessageFromPage(JsonEq(R"({
                                            "id": 1,
                                            "result": {
                                              "result": {
                                                "type": "number",
                                                "value": 3
                                              }
                                            }
                                          })"));

    this->expectMessageFromPage(JsonEq(R"({
                                            "id": 2,
                                            "result": {
                                              "result": {
                                                "type": "number",
                                                "value": 7
                                              }
                                            }
                                          })"));
  });

  // Make sure the second task ran last.
  EXPECT_EQ(this->eval("globalThis.x").getNumber(), 7);
}

TYPED_TEST(JsiIntegrationHermesTest, ScriptParsedExactlyOnce) {
  // Regression test for T182003727 (multiple scriptParsed events for a single
  // script under Hermes lazy compilation).

  this->connect();

  InSequence s;

  this->eval(R"(
    // NOTE: Triggers lazy compilation in Hermes when running with
    // CompilationMode::ForceLazyCompilation.
    (function foo(){var x = 2;})()
    //# sourceURL=script.js
  )");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Debugger.scriptParsed"),
      AtJsonPtr("/params/url", "script.js"))));
  this->expectMessageFromPage(JsonEq(R"({
                                         "id": 1,
                                         "result": {}
                                       })"));
  this->toPage_->sendMessage(R"({
                                 "id": 1,
                                 "method": "Debugger.enable"
                               })");
}

TYPED_TEST(JsiIntegrationHermesTest, FunctionDescriptionIncludesName) {
  // See
  // https://github.com/facebookexperimental/rn-chrome-devtools-frontend/blob/9a23d4c7c4c2d1a3d9e913af38d6965f474c4284/front_end/ui/legacy/components/object_ui/ObjectPropertiesSection.ts#L311-L391

  this->connect();

  InSequence s;

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/id", 1),
      AtJsonPtr("/result/result/type", "function"),
      AtJsonPtr(
          "/result/result/description",
          DynamicString(StartsWith("function foo() {"))))));
  this->toPage_->sendMessage(R"({
                               "id": 1,
                               "method": "Runtime.evaluate",
                               "params": {"expression": "(function foo() {Math.random()});"}
                             })");
}

#pragma endregion // AllHermesVariants

} // namespace facebook::react::jsinspector_modern

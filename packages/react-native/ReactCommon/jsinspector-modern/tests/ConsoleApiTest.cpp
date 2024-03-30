/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsiIntegrationTest.h"

#include "engines/JsiIntegrationTestHermesEngineAdapter.h"
#include "prelude.js.h"

#include <utility>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

struct Params {
  /**
   * Whether to evaluate the prelude.js script (containing RN's console
   * polyfill) after setting up the Runtime.
   */
  bool withConsolePolyfill{false};

  /**
   * Whether to install the global nativeLoggingHook function after setting up
   * the Runtime (before the prelude if any).
   */
  bool withNativeLoggingHook{false};

  /**
   * Whether to enable the Runtime domain at the start of the test (and expect
   * live consoleAPICalled notifications), or enable it at the *end* of the test
   * (and expect buffered notifications at that point).
   */
  bool runtimeEnabledAtStart{false};
};

} // namespace

/**
 * A test fixture for the Console API.
 */
class ConsoleApiTest
    : public JsiIntegrationPortableTest<JsiIntegrationTestHermesEngineAdapter>,
      public WithParamInterface<Params> {
  struct ExpectedConsoleApiCall {
    std::string type;
    std::string argsJson;
  };

 protected:
  void SetUp() override {
    JsiIntegrationPortableTest::SetUp();
    connect();
    if (GetParam().runtimeEnabledAtStart) {
      enableRuntimeDomain();
    }
  }

  void TearDown() override {
    if (!GetParam().runtimeEnabledAtStart) {
      enableRuntimeDomain();
    }
    JsiIntegrationPortableTest::TearDown();
  }

  void expectConsoleApiCall(std::string type, std::string argsJson) {
    ExpectedConsoleApiCall call{
        .type = std::move(type), .argsJson = std::move(argsJson)};
    if (runtimeEnabled_) {
      expectConsoleApiCallImpl(std::move(call));
    } else {
      expectedConsoleApiCalls_.emplace_back(call);
    }
  }

  bool isRuntimeDomainEnabled() const {
    return runtimeEnabled_;
  }

  void clearExpectedConsoleApiCalls() {
    expectedConsoleApiCalls_.clear();
  }

 private:
  void expectConsoleApiCallImpl(ExpectedConsoleApiCall call) {
    this->expectMessageFromPage(JsonParsed(AllOf(
        AtJsonPtr("/method", "Runtime.consoleAPICalled"),
        AtJsonPtr("/params/type", call.type),
        AtJsonPtr("/params/args", Eq(folly::parseJson(call.argsJson))))));
  }

  void enableRuntimeDomain() {
    InSequence s;
    auto executionContextInfo = this->expectMessageFromPage(JsonParsed(
        AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
    if (!runtimeEnabled_) {
      for (auto& call : expectedConsoleApiCalls_) {
        expectConsoleApiCallImpl(call);
      }
      expectedConsoleApiCalls_.clear();
    }
    this->expectMessageFromPage(JsonEq(R"({
                                            "id": 1,
                                            "result": {}
                                        })"));
    this->toPage_->sendMessage(R"({
                                    "id": 1,
                                    "method": "Runtime.enable"
                                })");

    ASSERT_TRUE(executionContextInfo->has_value());

    runtimeEnabled_ = true;
  }

  void loadMainBundle() override {
    auto params = GetParam();
    if (params.withNativeLoggingHook) {
      // The presence or absence of nativeLoggingHook affects the console
      // polyfill's behaviour.
      eval(
          R"(
            if (!globalThis.nativeLoggingHook) {
              globalThis.nativeLoggingHook = function(level, message) {
                print(level + ': ' + message);
              };
            }
          )");
    } else {
      // Ensure that we run without nativeLoggingHook even if it was installed
      // elsewhere.
      eval(R"(
        delete globalThis.nativeLoggingHook;
      )");
    }
    if (params.withConsolePolyfill) {
      eval(preludeJsCode);
    }
  }

  std::vector<ExpectedConsoleApiCall> expectedConsoleApiCalls_;
  bool runtimeEnabled_{false};
};

class ConsoleApiTestWithPreExistingConsole : public ConsoleApiTest {
  void setupRuntimeBeforeRegistration(jsi::Runtime& /*unused*/) override {
    eval(R"(
      globalThis.__console_messages__ = [];
      globalThis.console = {
        log: function(...args) {
          globalThis.__console_messages__.push({
            type: 'log',
            args,
          });
        },
        warn: function(...args) {
          globalThis.__console_messages__.push({
            type: 'warn',
            args,
          });
        },
      };
    )");
  }
};

TEST_P(ConsoleApiTest, testConsoleLog) {
  InSequence s;
  expectConsoleApiCall("log", R"([{
    "type": "string",
    "value": "hello"
  }, {
    "type": "string",
    "value": "world"
  }])");
  eval("console.log('hello', 'world');");
}

TEST_P(ConsoleApiTest, testConsoleDebug) {
  InSequence s;
  expectConsoleApiCall("debug", R"([{
    "type": "string",
    "value": "hello fusebox"
  }])");
  eval("console.debug('hello fusebox');");
}

TEST_P(ConsoleApiTest, testConsoleInfo) {
  InSequence s;
  expectConsoleApiCall("info", R"([{
    "type": "string",
    "value": "you should know this"
  }])");
  eval("console.info('you should know this');");
}

TEST_P(ConsoleApiTest, testConsoleError) {
  InSequence s;
  expectConsoleApiCall("error", R"([{
    "type": "string",
    "value": "uh oh"
  }])");
  eval("console.error('uh oh');");
}

TEST_P(ConsoleApiTest, testConsoleWarn) {
  InSequence s;
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "careful"
  }])");
  eval("console.warn('careful');");
}

TEST_P(ConsoleApiTest, testConsoleDir) {
  InSequence s;
  expectConsoleApiCall("dir", R"([{
    "type": "string",
    "value": "something"
  }])");
  eval("console.dir('something');");
}

TEST_P(ConsoleApiTest, testConsoleDirxml) {
  InSequence s;
  expectConsoleApiCall("dirxml", R"([{
    "type": "string",
    "value": "pretend this is a DOM element"
  }])");
  eval("console.dirxml('pretend this is a DOM element');");
}

TEST_P(ConsoleApiTest, testConsoleTable) {
  InSequence s;
  expectConsoleApiCall("table", R"([{
    "type": "string",
    "value": "pretend this is a complex object"
  }])");
  eval("console.table('pretend this is a complex object');");
}

TEST_P(ConsoleApiTest, testConsoleTrace) {
  InSequence s;
  expectConsoleApiCall("trace", R"([{
    "type": "string",
    "value": "trace trace"
  }])");
  eval("console.trace('trace trace');");
}

TEST_P(ConsoleApiTest, testConsoleClear) {
  InSequence s;
  expectConsoleApiCall("clear", "[]");
  eval("console.clear();");
}

TEST_P(ConsoleApiTest, testConsoleClearAfterOtherCall) {
  InSequence s;
  if (isRuntimeDomainEnabled()) {
    // This should only be delivered if console notifications are enabled, not
    // when they're being cached for later.
    expectConsoleApiCall("log", R"([{
      "type": "string",
      "value": "hello"
    }])");
  }
  expectConsoleApiCall("clear", "[]");
  eval("console.log('hello');");
  eval("console.clear();");
}

TEST_P(ConsoleApiTest, testConsoleGroup) {
  InSequence s;
  expectConsoleApiCall("startGroup", R"([{
    "type": "string",
    "value": "group title"
  }])");
  expectConsoleApiCall("log", R"([{
    "type": "string",
    "value": "in group"
  }])");
  expectConsoleApiCall("endGroup", "[]");
  eval("console.group('group title');");
  eval("console.log('in group');");
  eval("console.groupEnd();");
}

TEST_P(ConsoleApiTest, testConsoleGroupCollapsed) {
  InSequence s;
  expectConsoleApiCall("startGroupCollapsed", R"([{
    "type": "string",
    "value": "group collapsed title"
  }])");
  expectConsoleApiCall("log", R"([{
    "type": "string",
    "value": "in group collapsed"
  }])");
  expectConsoleApiCall("endGroup", "[]");
  eval("console.groupCollapsed('group collapsed title');");
  eval("console.log('in group collapsed');");
  eval("console.groupEnd();");
}

TEST_P(ConsoleApiTest, testConsoleAssert) {
  InSequence s;
  expectConsoleApiCall("assert", R"([{
    "type": "string",
    "value": "Assertion failed: something is bad"
  }])");
  eval("console.assert(true, 'everything is good');");
  eval("console.assert(false, 'something is bad');");

  expectConsoleApiCall("assert", R"([{
    "type": "string",
    "value": "Assertion failed"
  }])");
  eval("console.assert();");
}

TEST_P(ConsoleApiTest, testConsoleCount) {
  InSequence s;
  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "default: 1"
  }])");
  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "default: 2"
  }])");
  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "default: 3"
  }])");
  eval("console.count();");
  eval("console.count('default');");
  eval("console.count();");
  eval("console.countReset();");

  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "default: 1"
  }])");
  eval("console.count();");
  eval("console.countReset('default');");

  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "default: 1"
  }])");
  eval("console.count();");
}

TEST_P(ConsoleApiTest, testConsoleCountLabel) {
  InSequence s;
  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "foo: 1"
  }])");
  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "foo: 2"
  }])");
  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "foo: 3"
  }])");
  eval("console.count('foo');");
  eval("console.count('foo');");
  eval("console.count('foo');");
  eval("console.countReset('foo');");

  expectConsoleApiCall("count", R"([{
    "type": "string",
    "value": "foo: 1"
  }])");
  eval("console.count('foo');");
}

TEST_P(ConsoleApiTest, testConsoleCountResetInvalidLabel) {
  InSequence s;
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Count for 'default' does not exist"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Count for 'default' does not exist"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Count for 'foo' does not exist"
  }])");
  eval("console.countReset();");
  eval("console.countReset('default');");
  eval("console.countReset('foo');");
}

// TODO(moti): Tests for console.timeEnd() and timeLog() that actually check the
// output (with mocked system clock?)

TEST_P(ConsoleApiTest, testConsoleTimeExistingLabel) {
  eval("console.time();");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'default' already exists"
  }])");
  eval("console.time('default');");

  eval("console.time('foo');");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'foo' already exists"
  }])");
  eval("console.time('foo');");
}

TEST_P(ConsoleApiTest, testConsoleTimeInvalidLabel) {
  InSequence s;
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'default' does not exist"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'default' does not exist"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'foo' does not exist"
  }])");
  eval("console.timeEnd();");
  eval("console.timeEnd('default');");
  eval("console.timeEnd('foo');");

  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'default' does not exist"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'default' does not exist"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "Timer 'foo' does not exist"
  }])");
  eval("console.timeLog();");
  eval("console.timeLog('default');");
  eval("console.timeLog('foo');");
}

TEST_P(ConsoleApiTest, testConsoleSilentlyClearedOnReload) {
  InSequence s;
  expectConsoleApiCall("log", R"([{
    "type": "string",
    "value": "hello"
  }])");
  eval("console.log('hello');");

  // If there are any expectations we haven't checked yet, clear them
  clearExpectedConsoleApiCalls();
  // Reloading generates some Runtime events
  if (isRuntimeDomainEnabled()) {
    expectMessageFromPage(JsonParsed(
        AllOf(AtJsonPtr("/method", "Runtime.executionContextDestroyed"))));
    expectMessageFromPage(JsonParsed(
        AllOf(AtJsonPtr("/method", "Runtime.executionContextsCleared"))));
    expectMessageFromPage(JsonParsed(
        AllOf(AtJsonPtr("/method", "Runtime.executionContextCreated"))));
  }
  reload();

  expectConsoleApiCall("log", R"([{
    "type": "string",
    "value": "world"
  }])");
  eval("console.log('world');");
}

TEST_P(ConsoleApiTestWithPreExistingConsole, testPreExistingConsoleObject) {
  InSequence s;
  expectConsoleApiCall("log", R"([{
    "type": "string",
    "value": "hello"
  }])");
  expectConsoleApiCall("warning", R"([{
    "type": "string",
    "value": "world"
  }])");
  expectConsoleApiCall("table", R"([{
    "type": "number",
    "value": 42
  }])");
  eval("console.log('hello');");
  eval("console.warn('world');");
  // NOTE: not present in the pre-existing console object
  eval("console.table(42);");
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_THAT(
      eval("JSON.stringify(globalThis.__console_messages__)")
          .asString(runtime)
          .utf8(runtime),
      JsonEq(
          R"([{
            "type": "log",
            "args": [
              "hello"
            ]
          }, {
            "type": "warn",
            "args": [
              "world"
            ]
          }])"));
}

static const auto paramValues = testing::Values(
    Params{
        .withConsolePolyfill = true,
        .withNativeLoggingHook = false,
        .runtimeEnabledAtStart = false,
    },
    Params{
        .withConsolePolyfill = false,
        .withNativeLoggingHook = false,
        .runtimeEnabledAtStart = false,
    },
    Params{
        .withConsolePolyfill = true,
        .withNativeLoggingHook = false,
        .runtimeEnabledAtStart = true,
    },
    Params{
        .withConsolePolyfill = false,
        .withNativeLoggingHook = false,
        .runtimeEnabledAtStart = true,
    },
    Params{
        .withConsolePolyfill = true,
        .withNativeLoggingHook = true,
        .runtimeEnabledAtStart = false,
    },
    Params{
        .withConsolePolyfill = false,
        .withNativeLoggingHook = true,
        .runtimeEnabledAtStart = false,
    },
    Params{
        .withConsolePolyfill = true,
        .withNativeLoggingHook = true,
        .runtimeEnabledAtStart = true,
    },
    Params{
        .withConsolePolyfill = false,
        .withNativeLoggingHook = true,
        .runtimeEnabledAtStart = true,
    });

INSTANTIATE_TEST_SUITE_P(ConsoleApiTest, ConsoleApiTest, paramValues);

INSTANTIATE_TEST_SUITE_P(
    ConsoleApiTestWithPreExistingConsole,
    ConsoleApiTestWithPreExistingConsole,
    paramValues);

} // namespace facebook::react::jsinspector_modern

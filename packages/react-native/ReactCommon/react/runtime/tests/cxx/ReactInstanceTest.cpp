/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <queue>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <ReactCommon/RuntimeExecutor.h>
#include <hermes/hermes.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsi/jsi.h>
#include <react/runtime/ReactInstance.h>

using ::testing::_;
using ::testing::HasSubstr;
using ::testing::SaveArg;

namespace facebook::react {

class MockTimerRegistry : public PlatformTimerRegistry {
 public:
  MOCK_METHOD2(createTimer, void(uint32_t, double));
  MOCK_METHOD2(createRecurringTimer, void(uint32_t, double));
  MOCK_METHOD1(deleteTimer, void(uint32_t));
};

class MockMessageQueueThread : public MessageQueueThread {
 public:
  void runOnQueue(std::function<void()>&& func) {
    callbackQueue_.push(func);
  }

  // Unused
  void runOnQueueSync(std::function<void()>&&) {}

  // Unused
  void quitSynchronous() {}

  void tick() {
    if (!callbackQueue_.empty()) {
      auto callback = callbackQueue_.front();
      callback();
      callbackQueue_.pop();
    }
  }

  void guardedTick() {
    try {
      tick();
    } catch (const std::exception& e) {
      // For easier debugging
      FAIL() << e.what();
    }
  }

  size_t size() {
    return callbackQueue_.size();
  }

 private:
  std::queue<std::function<void()>> callbackQueue_;
};

class ErrorUtils : public jsi::HostObject {
 public:
  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {
    auto methodName = name.utf8(rt);

    if (methodName == "reportFatalError") {
      return jsi::Function::createFromHostFunction(
          rt,
          name,
          1,
          [this](
              jsi::Runtime& runtime,
              const jsi::Value& thisValue,
              const jsi::Value* arguments,
              size_t count) {
            if (count >= 1) {
              auto value = jsi::Value(runtime, std::move(arguments[0]));
              auto error = jsi::JSError(runtime, std::move(value));
              reportFatalError(std::move(error));
            }
            return jsi::Value::undefined();
          });
    } else {
      throw std::runtime_error("Unknown method: " + methodName);
    }
  }

  void reportFatalError(jsi::JSError&& error) {
    errors_.push_back(std::move(error));
  }

  size_t size() {
    return errors_.size();
  }

  jsi::JSError getLastError() {
    auto error = errors_.back();
    errors_.pop_back();
    return error;
  }

 private:
  std::vector<jsi::JSError> errors_;
};

class ReactInstanceTest : public ::testing::Test {
 protected:
  ReactInstanceTest() {}

  void SetUp() override {
    auto runtime =
        std::make_unique<JSIRuntimeHolder>(hermes::makeHermesRuntime());
    runtime_ = &runtime->getRuntime();
    messageQueueThread_ = std::make_shared<MockMessageQueueThread>();
    auto mockRegistry = std::make_unique<MockTimerRegistry>();
    mockRegistry_ = mockRegistry.get();
    timerManager_ = std::make_shared<TimerManager>(std::move(mockRegistry));
    auto onJsError = [](const JsErrorHandler::ParsedError& errorMap) noexcept {
      // Do nothing
    };

    instance_ = std::make_unique<ReactInstance>(
        std::move(runtime),
        messageQueueThread_,
        timerManager_,
        std::move(onJsError));
    timerManager_->setRuntimeExecutor(instance_->getBufferedRuntimeExecutor());

    // Install a C++ error handler
    errorHandler_ = std::make_shared<ErrorUtils>();
    runtime_->global().setProperty(
        *runtime_,
        "ErrorUtils",
        jsi::Object::createFromHostObject(*runtime_, errorHandler_));
  }

  void initializeRuntimeWithScript(
      ReactInstance::JSRuntimeFlags jsRuntimeFlags,
      std::string script) {
    instance_->initializeRuntime(jsRuntimeFlags, [](jsi::Runtime& runtime) {});
    step();

    // Run the main bundle, so that native -> JS calls no longer get buffered.
    loadScript(script);
  }

  void initializeRuntimeWithScript(std::string script) {
    instance_->initializeRuntime(
        {.isProfiling = false}, [](jsi::Runtime& runtime) {});
    step();

    // Run the main bundle, so that native -> JS calls no longer get buffered.
    loadScript(script);
  }

  jsi::Value tryEval(std::string js, std::string defaultVal) {
    return eval(
        "(function() { try { return " + js + "; } catch { return " +
        defaultVal + "; } })()");
  }

  jsi::Value eval(std::string js) {
    RuntimeExecutor runtimeExecutor = instance_->getUnbufferedRuntimeExecutor();
    jsi::Value ret = jsi::Value::undefined();
    runtimeExecutor([js, &ret](jsi::Runtime& runtime) {
      ret = runtime.evaluateJavaScript(
          std::make_unique<jsi::StringBuffer>(js), "");
    });
    step();
    return ret;
  }

  // Call instance_->loadScript() to evaluate JS script and flush buffered JS
  // calls
  jsi::Value loadScript(std::string js) {
    jsi::Value ret = jsi::Value::undefined();
    instance_->loadScript(std::make_unique<JSBigStdString>(std::move(js)), "");
    step();
    return ret;
  }

  void expectError() {
    EXPECT_NE(errorHandler_->size(), 0)
        << "Expected an error to have been thrown, but it wasn't.";
  }

  void expectNoError() {
    EXPECT_EQ(errorHandler_->size(), 0)
        << "Expected no error to have been thrown, but one was.";
  }

  std::string getLastErrorMessage() {
    auto error = errorHandler_->getLastError();
    return error.getMessage();
  }

  std::string getErrorMessage(std::string js) {
    eval(js);
    return getLastErrorMessage();
  }

  void step() {
    messageQueueThread_->guardedTick();
  }

  jsi::Runtime* runtime_;
  std::shared_ptr<MockMessageQueueThread> messageQueueThread_;
  std::unique_ptr<ReactInstance> instance_;
  std::shared_ptr<TimerManager> timerManager_;
  MockTimerRegistry* mockRegistry_;
  std::shared_ptr<ErrorUtils> errorHandler_;
};

TEST_F(ReactInstanceTest, testBridgelessFlagIsSet) {
  auto valBefore = tryEval("RN$Bridgeless === true", "false");
  EXPECT_EQ(valBefore.getBool(), false);
  initializeRuntimeWithScript("");
  auto val = eval("RN$Bridgeless === true");
  EXPECT_EQ(val.getBool(), true);
}

TEST_F(ReactInstanceTest, testProfilingFlag) {
  auto valBefore = tryEval("__RCTProfileIsProfiling === true", "false");
  EXPECT_EQ(valBefore.getBool(), false);
  initializeRuntimeWithScript({.isProfiling = true}, "");
  auto val = eval("__RCTProfileIsProfiling === true");
  EXPECT_EQ(val.getBool(), true);
}

TEST_F(ReactInstanceTest, testPromiseIntegration) {
  initializeRuntimeWithScript("");

  eval(R"xyz123(
let called = 0;
function getResult() {
  return called;
}
Promise.resolve().then(() => {
  called++;
}).then(() => {
  called++;
})
)xyz123");
  auto result = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(result.getNumber(), 2);
}

TEST_F(ReactInstanceTest, testSetImmediate) {
  initializeRuntimeWithScript("");

  eval(R"xyz123(
let called = false;
function getResult() {
  return called;
}
setImmediate(() => {
  called = true;
});
)xyz123");
  auto result = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(result.getBool(), true);
}

TEST_F(ReactInstanceTest, testNestedSetImmediate) {
  initializeRuntimeWithScript("");

  eval(R"xyz123(
let called = false;
function getResult() {
  return called;
}
setImmediate(() => {
  setImmediate(() => {
    called = true;
  })
});
)xyz123");
  auto result = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(result.getBool(), true);
}

TEST_F(ReactInstanceTest, testSetImmediateWithInvalidArgs) {
  initializeRuntimeWithScript("");

  EXPECT_EQ(
      getErrorMessage("setImmediate();"),
      "setImmediate must be called with at least one argument (a function to call)");

  eval("setImmediate('invalid');");
  expectNoError();

  eval("setImmediate({});");
  expectNoError();
}

TEST_F(ReactInstanceTest, testClearImmediate) {
  initializeRuntimeWithScript("");

  eval(R"xyz123(
let called = false;
function getResult() {
  return called;
}
const handle = setImmediate(() => {
  called = true;
});
clearImmediate(handle);
)xyz123");

  auto func = runtime_->global().getPropertyAsFunction(*runtime_, "getResult");
  auto val = func.call(*runtime_);
  EXPECT_EQ(val.getBool(), false);
}

TEST_F(ReactInstanceTest, testClearImmediateWithInvalidHandle) {
  initializeRuntimeWithScript("");

  auto js = R"xyz123(
let called = false;
const handle = setImmediate(() => {
  called = true;
});
function getResult() {
  return called;
}
function clearInvalidHandle() {
  clearImmediate(handle);
}
)xyz123";
  eval(js);

  auto clear =
      runtime_->global().getPropertyAsFunction(*runtime_, "clearInvalidHandle");
  // Clearing an invalid handle should fail silently.
  EXPECT_NO_THROW(clear.call((*runtime_)));
}

TEST_F(ReactInstanceTest, testClearImmediateWithInvalidArgs) {
  initializeRuntimeWithScript("");

  eval("clearImmediate();");
  expectNoError();

  eval("clearImmediate('invalid');");
  expectNoError();

  eval("clearImmediate({});");
  expectNoError();

  eval("clearImmediate(undefined);");
  expectNoError();
}

TEST_F(ReactInstanceTest, testSetTimeout) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 100))
      .WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let called = false;
setTimeout(() => {
  called = true;
}, 100);
function getResult() {
  return called;
}
  )xyz123");
  timerManager_->callTimer(timerID);
  step();
  auto called = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(called.getBool(), true);
}

TEST_F(ReactInstanceTest, testSetTimeoutWithoutDelay) {
  initializeRuntimeWithScript("");

  EXPECT_CALL(
      *mockRegistry_,
      createTimer(_, 0)); // If delay is not provided, it should use 0
  eval("setTimeout(() => {});");
}

TEST_F(ReactInstanceTest, testSetTimeoutWithPassThroughArgs) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 0)).WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let result;
setTimeout(arg => {
  result = arg;
}, undefined, 'foo');
function getResult() {
  return result;
}
  )xyz123");
  timerManager_->callTimer(timerID);
  step();
  auto result = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(result.asString(*runtime_).utf8(*runtime_), "foo");
}

TEST_F(ReactInstanceTest, testSetTimeoutWithInvalidArgs) {
  initializeRuntimeWithScript("");

  EXPECT_EQ(
      getErrorMessage("setTimeout();"),
      "setTimeout must be called with at least one argument (the function to call).");

  eval("setTimeout('invalid');");
  expectNoError();

  eval("setTimeout(() => {}, 'invalid');");
  expectNoError();
}

TEST_F(ReactInstanceTest, testClearTimeout) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 100))
      .WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
const handle = setTimeout(() => {}, 100);
function clear() {
  clearTimeout(handle);
}
  )xyz123");
  EXPECT_CALL(*mockRegistry_, deleteTimer(timerID));
  runtime_->global().getPropertyAsFunction(*runtime_, "clear").call(*runtime_);
}

TEST_F(ReactInstanceTest, testClearTimeoutWithInvalidArgs) {
  initializeRuntimeWithScript("");

  eval("clearTimeout();");
  expectNoError();

  eval("clearTimeout('invalid');");
  expectNoError();

  eval("clearTimeout({});");
  expectNoError();

  eval("clearTimeout(undefined);");
  expectNoError();
}

TEST_F(ReactInstanceTest, testClearTimeoutForExpiredTimer) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 100))
      .WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
const handle = setTimeout(() => {}, 100);
function clear() {
  clearTimeout(handle);
}
  )xyz123");
  // Call the timer
  timerManager_->callTimer(timerID);
  step();

  // Now clear the called timer
  EXPECT_CALL(*mockRegistry_, deleteTimer(timerID));
  auto clear = runtime_->global().getPropertyAsFunction(*runtime_, "clear");
  EXPECT_NO_THROW(clear.call(*runtime_));
}

TEST_F(ReactInstanceTest, testSetInterval) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createRecurringTimer(_, 100))
      .WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let result = 0;
setInterval(() => {
  result++;
}, 100);
function getResult() {
  return result;
}
  )xyz123");
  timerManager_->callTimer(timerID);
  step();
  auto getResult =
      runtime_->global().getPropertyAsFunction(*runtime_, "getResult");
  EXPECT_EQ(getResult.call(*runtime_).asNumber(), 1.0);

  // Should be able to call the same callback again.
  timerManager_->callTimer(timerID);
  step();
  EXPECT_EQ(getResult.call(*runtime_).asNumber(), 2.0);
}

TEST_F(ReactInstanceTest, testSetIntervalWithPassThroughArgs) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createRecurringTimer(_, 100))
      .WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let result;
setInterval(arg => {
  result = arg;
}, 100, 'foo');
function getResult() {
  return result;
}
  )xyz123");
  timerManager_->callTimer(timerID);
  step();

  auto getResult =
      runtime_->global().getPropertyAsFunction(*runtime_, "getResult");
  EXPECT_EQ(
      getResult.call(*runtime_).asString(*runtime_).utf8(*runtime_), "foo");
}

TEST_F(ReactInstanceTest, testSetIntervalWithInvalidArgs) {
  initializeRuntimeWithScript("");

  EXPECT_EQ(
      getErrorMessage("setInterval();"),
      "setInterval must be called with at least one argument (the function to call).");
  EXPECT_EQ(
      getErrorMessage("setInterval('invalid', 100);"),
      "The first argument to setInterval must be a function.");
}

TEST_F(ReactInstanceTest, testClearInterval) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createRecurringTimer(_, 100))
      .WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let result = 0;
const handle = setInterval(() => {
  result++;
}, 100);
function clear() {
  clearInterval(handle);
}
function getResult() {
  return result;
}
  )xyz123");
  timerManager_->callTimer(timerID);
  step();
  auto getResult =
      runtime_->global().getPropertyAsFunction(*runtime_, "getResult");
  EXPECT_EQ(getResult.call(*runtime_).asNumber(), 1.0);

  EXPECT_CALL(*mockRegistry_, deleteTimer(timerID));
  runtime_->global().getPropertyAsFunction(*runtime_, "clear").call(*runtime_);
  step();

  timerManager_->callTimer(timerID);
  step();
  // Callback should not have been invoked again.
  EXPECT_EQ(getResult.call(*runtime_).asNumber(), 1.0);
}

TEST_F(ReactInstanceTest, testClearIntervalWithInvalidArgs) {
  initializeRuntimeWithScript("");

  eval("clearInterval();");
  expectNoError();

  eval("clearInterval(false);");
  expectNoError();

  eval("clearInterval({});");
  expectNoError();

  eval("clearInterval(undefined);");
  expectNoError();
}

TEST_F(ReactInstanceTest, testRequestAnimationFrame) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 0)).WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let called = false;
performance = {
  now: () => 0
}
requestAnimationFrame(() => {
  called = true;
});
function getResult() {
  return called;
}
  )xyz123");
  auto getResult =
      runtime_->global().getPropertyAsFunction(*runtime_, "getResult");
  EXPECT_EQ(getResult.call(*runtime_).getBool(), false);

  timerManager_->callTimer(timerID);
  step();
  EXPECT_EQ(getResult.call(*runtime_).getBool(), true);
}

TEST_F(
    ReactInstanceTest,
    testRequestAnimationFrameCallbackArgIsPerformanceNow) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 0)).WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let now = 0;
performance = {
  now: () => 123456
}
requestAnimationFrame(($now) => {
  now = $now;
});
function getResult() {
  return now;
}
  )xyz123");
  auto getResult =
      runtime_->global().getPropertyAsFunction(*runtime_, "getResult");
  EXPECT_EQ(getResult.call(*runtime_).getNumber(), 0);

  timerManager_->callTimer(timerID);
  step();
  EXPECT_EQ(getResult.call(*runtime_).getNumber(), 123456);
}

TEST_F(ReactInstanceTest, testRequestAnimationFrameWithInvalidArgs) {
  initializeRuntimeWithScript("");

  eval(R"xyz123(
performance = {
  now: () => 0
}
  )xyz123");

  EXPECT_EQ(
      getErrorMessage("requestAnimationFrame();"),
      "requestAnimationFrame must be called with at least one argument (i.e: a callback)");
  EXPECT_EQ(
      getErrorMessage("requestAnimationFrame('invalid');"),
      "The first argument to requestAnimationFrame must be a function.");
  EXPECT_EQ(
      getErrorMessage("requestAnimationFrame({});"),
      "The first argument to requestAnimationFrame must be a function.");
}

TEST_F(ReactInstanceTest, testCancelAnimationFrame) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 0)).WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let called = false;
performance = {
  now: () => 0
}
const handle = requestAnimationFrame(() => {
  called = true;
});
function clear() {
  cancelAnimationFrame(handle);
}
function getResult() {
  return called;
}
  )xyz123");

  EXPECT_CALL(*mockRegistry_, deleteTimer(timerID));
  runtime_->global().getPropertyAsFunction(*runtime_, "clear").call(*runtime_);

  // Attempt to call timer; should fail silently.
  timerManager_->callTimer(timerID);
  step();

  // Verify the callback was not called.
  auto called = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(called.getBool(), false);
}

TEST_F(ReactInstanceTest, testCancelAnimationFrameWithInvalidArgs) {
  initializeRuntimeWithScript("");

  eval("cancelAnimationFrame();");
  expectNoError();

  eval("cancelAnimationFrame(false);");
  expectNoError();

  eval("cancelAnimationFrame({});");
  expectNoError();

  eval("cancelAnimationFrame(undefined);");
  expectNoError();
}

TEST_F(ReactInstanceTest, testCancelAnimationFrameWithExpiredTimer) {
  initializeRuntimeWithScript("");

  uint32_t timerID{0};
  EXPECT_CALL(*mockRegistry_, createTimer(_, 0)).WillOnce(SaveArg<0>(&timerID));
  eval(R"xyz123(
let called = false;
performance = {
  now: () => 0
}
const handle = requestAnimationFrame(() => {
  called = true;
});
function clear() {
  cancelAnimationFrame(handle);
}
function getResult() {
  return called;
}
  )xyz123");

  timerManager_->callTimer(timerID);
  step();

  auto called = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(called.getBool(), true);

  EXPECT_CALL(*mockRegistry_, deleteTimer(timerID));
  auto clear = runtime_->global().getPropertyAsFunction(*runtime_, "clear");
  // Canceling an expired timer should fail silently.
  EXPECT_NO_THROW(clear.call(*runtime_));
}

TEST_F(ReactInstanceTest, testRegisterCallableModule) {
  initializeRuntimeWithScript(R"xyz123(
let called = false;
const module = {
  bar: () => {
    called = true;
  },
};
function getResult() {
  return called;
}
RN$registerCallableModule('foo', () => module);
  )xyz123");

  auto args = folly::dynamic::array(0);
  instance_->callFunctionOnModule("foo", "bar", std::move(args));
  step();

  auto called = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(called.getBool(), true);
}

TEST_F(ReactInstanceTest, testRegisterCallableModule_invalidArgs) {
  initializeRuntimeWithScript("");

  EXPECT_EQ(
      getErrorMessage("RN$registerCallableModule();"),
      "registerCallableModule requires exactly 2 arguments");
  EXPECT_EQ(
      getErrorMessage("RN$registerCallableModule('foo');"),
      "registerCallableModule requires exactly 2 arguments");
  EXPECT_EQ(
      getErrorMessage("RN$registerCallableModule(1, () => ({}));"),
      "The first argument to registerCallableModule must be a string (the name of the JS module).");
  EXPECT_EQ(
      getErrorMessage("RN$registerCallableModule('foo', false);"),
      "The second argument to registerCallableModule must be a function that returns the JS module.");
}

TEST_F(ReactInstanceTest, testCallFunctionOnModule_invalidModule) {
  initializeRuntimeWithScript("");

  auto args = folly::dynamic::array(0);
  instance_->callFunctionOnModule("invalidModule", "method", std::move(args));
  step();
  expectError();
  EXPECT_THAT(
      getLastErrorMessage(),
      HasSubstr(
          "Failed to call into JavaScript module method invalidModule.method()"));
}

TEST_F(ReactInstanceTest, testCallFunctionOnModule_undefinedMethod) {
  initializeRuntimeWithScript(R"xyz123(
const module = {
  bar: () => {},
};
RN$registerCallableModule('foo', () => module);
  )xyz123");

  auto args = folly::dynamic::array(0);
  instance_->callFunctionOnModule("foo", "invalidMethod", std::move(args));
  step();
  expectError();
  EXPECT_EQ(
      getLastErrorMessage(),
      "getPropertyAsObject: property 'invalidMethod' is undefined, expected an Object");
}

TEST_F(ReactInstanceTest, testCallFunctionOnModule_invalidMethod) {
  initializeRuntimeWithScript(R"xyz123(
const module = {
  bar: false,
};
RN$registerCallableModule('foo', () => module);
  )xyz123");

  auto args = folly::dynamic::array(0);
  instance_->callFunctionOnModule("foo", "bar", std::move(args));
  step();
  expectError();
}

TEST_F(ReactInstanceTest, testRegisterCallableModule_withArgs) {
  initializeRuntimeWithScript(R"xyz123(
let result;
const module = {
  bar: thing => {
    result = thing;
  },
};
RN$registerCallableModule('foo', () => module);
function getResult() {
  return result;
}
  )xyz123");

  auto args = folly::dynamic::array(1);
  instance_->callFunctionOnModule("foo", "bar", std::move(args));
  step();

  auto result = runtime_->global()
                    .getPropertyAsFunction(*runtime_, "getResult")
                    .call(*runtime_);
  EXPECT_EQ(result.getNumber(), 1);
}

} // namespace facebook::react

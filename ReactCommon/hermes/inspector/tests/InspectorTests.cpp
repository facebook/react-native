// Copyright 2004-present Facebook. All Rights Reserved.

#include <hermes/inspector/Inspector.h>

#include <atomic>
#include <chrono>
#include <functional>
#include <iostream>
#include <memory>

#include <folly/futures/Future.h>
#include <gtest/gtest.h>
#include <hermes/inspector/RuntimeAdapter.h>

namespace facebook {
namespace hermes {
namespace inspector {

namespace debugger = facebook::hermes::debugger;
using namespace std::chrono_literals;
using Unit = folly::Unit;

static auto constexpr kDefaultTimeout = 5000ms;

namespace {

int getCurrentLine(const debugger::ProgramState &state) {
  return state.getStackTrace().callFrameForIndex(0).location.line;
}

debugger::SourceLocation locationForLine(int line) {
  debugger::SourceLocation loc;
  loc.line = line;
  return loc;
}

} // namespace

/*
 * LambdaInspectorObserver is useful for sequencing calls to the debugger based
 * on the number of onPause() callbacks.
 */

using OnPauseFunction =
    std::function<void(Inspector &, const debugger::ProgramState &, int)>;

class LambdaInspectorObserver : public InspectorObserver {
 public:
  LambdaInspectorObserver(OnPauseFunction func)
      : onPauseFunc_(func), pauseCount_(0) {}
  ~LambdaInspectorObserver() = default;

  void onBreakpointResolved(
      Inspector &inspector,
      const debugger::BreakpointInfo &info) override {}

  void onContextCreated(Inspector &inspector) override {}

  void onPause(Inspector &inspector, const debugger::ProgramState &state)
      override {
    pauseCount_++;
    onPauseFunc_(inspector, state, pauseCount_);
  }

  void onResume(Inspector &inspector) override {}

  void onScriptParsed(Inspector &inspector, const ScriptInfo &info) override {}

  void onMessageAdded(Inspector &inspector, const ConsoleMessageInfo &info)
      override{};

  int getPauseCount() {
    return pauseCount_;
  }

 private:
  OnPauseFunction onPauseFunc_;
  int pauseCount_;
};

/*
 * Helpers for running JS in a separate thread.
 */

struct HermesDebugContext {
  HermesDebugContext(
      InspectorObserver &observer,
      folly::Future<Unit> &&finished)
      : runtime(makeHermesRuntime()),
        inspector(
            std::make_shared<SharedRuntimeAdapter>(runtime),
            observer,
            false),
        stopFlag(false),
        finished(std::move(finished)) {
    runtime->global().setProperty(
        *runtime,
        "shouldStop",
        jsi::Function::createFromHostFunction(
            *runtime,
            jsi::PropNameID::forAscii(*runtime, "shouldStop"),
            0,
            [this](
                jsi::Runtime &,
                const jsi::Value &,
                const jsi::Value *args,
                size_t count) {
              return stopFlag.load() ? jsi::Value(true) : jsi::Value(false);
            }));
  }
  ~HermesDebugContext() = default;

  void setStopFlag() {
    stopFlag.store(true);
  }

  void wait(std::chrono::milliseconds timeout = kDefaultTimeout) {
    std::move(finished).get(timeout);
  }

  std::shared_ptr<HermesRuntime> runtime;
  Inspector inspector;
  std::atomic<bool> stopFlag{};
  folly::Future<Unit> finished;
};

static std::shared_ptr<HermesDebugContext> runScriptAsync(
    InspectorObserver &observer,
    const std::string &script) {
  auto promise = std::make_shared<folly::Promise<Unit>>();
  auto future = promise->getFuture();
  auto context =
      std::make_shared<HermesDebugContext>(observer, std::move(future));

  std::thread t([=]() {
    HermesRuntime::DebugFlags flags{};
    context->runtime->debugJavaScript(script, "url", flags);
    promise->setValue();
  });
  t.detach();

  return context;
}

/*
 * Tests
 */

TEST(InspectorTests, testStepOver) {
  std::string script = R"(
    var a = 1 + 2;
    debugger;
    var b = a / 2;
    var c = a + b;
    var d = b - c;
    var e = c * d;
    var f = 10;
  )";

  // TODO: move this vector into lambdaInspectorObserver
  std::vector<folly::Future<Unit>> futures;

  OnPauseFunction onPauseFunc = [&futures](
                                    Inspector &inspector,
                                    const debugger::ProgramState &state,
                                    int pauseCount) {
    switch (pauseCount) {
      case 1: {
        EXPECT_EQ(
            state.getPauseReason(), debugger::PauseReason::DebuggerStatement);
        EXPECT_EQ(getCurrentLine(state), 3);

        futures.emplace_back(inspector.stepOver());

        break;
      }
      case 2: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::StepFinish);
        EXPECT_EQ(getCurrentLine(state), 4);

        futures.emplace_back(inspector.stepOver());

        break;
      }
      case 3: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::StepFinish);
        EXPECT_EQ(getCurrentLine(state), 5);

        futures.emplace_back(inspector.resume());

        break;
      }
    }
  };

  LambdaInspectorObserver observer(onPauseFunc);
  std::shared_ptr<HermesDebugContext> context =
      runScriptAsync(observer, script);

  // TODO: temporarily do this to ensure i hit failure case
  std::this_thread::sleep_for(1000ms);

  futures.emplace_back(context->inspector.enable());

  context->wait();
  folly::collectAll(futures).get(kDefaultTimeout);

  EXPECT_EQ(observer.getPauseCount(), 3);
}

TEST(InspectorTests, testSetBreakpoint) {
  std::string script = R"(
    var a = 1 + 2;
    debugger;
    var b = a / 2;
    var c = a + b;
    var d = b - c;
    var e = c * d;
    var f = 10;
  )";

  std::vector<folly::Future<Unit>> futures;

  OnPauseFunction onPauseFunc = [&futures](
                                    Inspector &inspector,
                                    const debugger::ProgramState &state,
                                    int pauseCount) {
    switch (pauseCount) {
      case 1: {
        EXPECT_EQ(
            state.getPauseReason(), debugger::PauseReason::DebuggerStatement);
        EXPECT_EQ(getCurrentLine(state), 3);

        auto stepFuture = inspector.stepOver();
        futures.emplace_back(std::move(stepFuture));

        break;
      }
      case 2: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::StepFinish);
        EXPECT_EQ(getCurrentLine(state), 4);

        auto breakpointFuture = inspector.setBreakpoint(locationForLine(6));
        futures.emplace_back(std::move(breakpointFuture)
                                 .thenValue([](debugger::BreakpointInfo info) {
                                   EXPECT_EQ(info.resolvedLocation.line, 6);
                                 }));

        auto resumeFuture = inspector.resume();
        futures.emplace_back(std::move(resumeFuture));

        break;
      }
      case 3: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::Breakpoint);
        EXPECT_EQ(getCurrentLine(state), 6);

        auto resumeFuture = inspector.resume();
        futures.emplace_back(std::move(resumeFuture));

        break;
      }
    }
  };

  LambdaInspectorObserver observer(onPauseFunc);
  std::shared_ptr<HermesDebugContext> context =
      runScriptAsync(observer, script);

  auto enablePromise = context->inspector.enable();
  futures.emplace_back(std::move(enablePromise));

  context->wait();
  folly::collectAll(futures).get(kDefaultTimeout);

  EXPECT_EQ(observer.getPauseCount(), 3);
}

TEST(InspectorTests, testAsyncSetBreakpoint) {
  std::string script = R"(
    while (!shouldStop()) {
      var a = 1;
      var b = 2;
      var c = a + b;
      var d = 10;
    }
  )";

  std::vector<folly::Future<Unit>> futures;
  folly::Func stopFunc;

  OnPauseFunction onPauseFunc = [&futures, &stopFunc](
                                    Inspector &inspector,
                                    const debugger::ProgramState &state,
                                    int pauseCount) {
    switch (pauseCount) {
      case 1: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::Breakpoint);
        EXPECT_EQ(getCurrentLine(state), 4);

        auto stepFuture = inspector.stepOver();
        futures.emplace_back(std::move(stepFuture));

        break;
      }
      case 2: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::StepFinish);
        EXPECT_EQ(getCurrentLine(state), 5);

        stopFunc();

        auto resumeFuture = inspector.resume();
        futures.emplace_back(std::move(resumeFuture));

        break;
      }
    }
  };

  LambdaInspectorObserver observer(onPauseFunc);
  std::shared_ptr<HermesDebugContext> context =
      runScriptAsync(observer, script);

  stopFunc = [context]() { context->setStopFlag(); };

  context->inspector.enable();

  auto breakpointPromise = context->inspector.setBreakpoint(locationForLine(4))
                               .thenValue([](debugger::BreakpointInfo info) {
                                 EXPECT_EQ(info.resolvedLocation.line, 4);
                               });

  context->wait();

  futures.emplace_back(std::move(breakpointPromise));
  folly::collectAll(futures).get(kDefaultTimeout);

  EXPECT_EQ(observer.getPauseCount(), 2);
}

TEST(InspectorTests, testDisable) {
  std::string script = R"(
    var a = 1 + 2;
    debugger;
    var b = a / 2;
    var c = a + b;
    var d = b - c;
    var e = c * d;
    var f = 10;
  )";

  std::vector<folly::Future<Unit>> futures;

  OnPauseFunction onPauseFunc = [&futures](
                                    Inspector &inspector,
                                    const debugger::ProgramState &state,
                                    int pauseCount) {
    switch (pauseCount) {
      case 1: {
        EXPECT_EQ(
            state.getPauseReason(), debugger::PauseReason::DebuggerStatement);
        EXPECT_EQ(getCurrentLine(state), 3);

        auto stepFuture = inspector.stepOver();
        futures.emplace_back(std::move(stepFuture));

        break;
      }
      case 2: {
        EXPECT_EQ(state.getPauseReason(), debugger::PauseReason::StepFinish);
        EXPECT_EQ(getCurrentLine(state), 4);

        futures.emplace_back(inspector.setBreakpoint(locationForLine(6))
                                 .thenValue([](debugger::BreakpointInfo info) {
                                   EXPECT_EQ(info.resolvedLocation.line, 6);
                                 }));
        futures.emplace_back(inspector.setBreakpoint(locationForLine(7))
                                 .thenValue([](debugger::BreakpointInfo info) {
                                   EXPECT_EQ(info.resolvedLocation.line, 7);
                                 }));

        auto detachFuture = inspector.disable();
        futures.emplace_back(std::move(detachFuture));

        break;
      }
    }
  };

  LambdaInspectorObserver observer(onPauseFunc);
  std::shared_ptr<HermesDebugContext> context =
      runScriptAsync(observer, script);

  auto enablePromise = context->inspector.enable();
  futures.emplace_back(std::move(enablePromise));

  context->wait();
  folly::collectAll(futures).get(kDefaultTimeout);

  EXPECT_EQ(observer.getPauseCount(), 2);
}

} // namespace inspector
} // namespace hermes
} // namespace facebook

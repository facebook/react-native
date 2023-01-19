/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesExecutorFactory.h"

#include <thread>

#include <cxxreact/MessageQueueThread.h>
#include <cxxreact/SystraceSection.h>
#include <hermes/hermes.h>
#include <jsi/decorator.h>

#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/Registration.h>

#include "JSITracing.h"

using namespace facebook::hermes;
using namespace facebook::jsi;

namespace facebook {
namespace react {

namespace {

std::unique_ptr<HermesRuntime> makeHermesRuntimeSystraced(
    const ::hermes::vm::RuntimeConfig &runtimeConfig) {
  SystraceSection s("HermesExecutorFactory::makeHermesRuntimeSystraced");
  return hermes::makeHermesRuntime(runtimeConfig);
}

class HermesExecutorRuntimeAdapter
    : public facebook::hermes::inspector::RuntimeAdapter {
 public:
  HermesExecutorRuntimeAdapter(
      std::shared_ptr<HermesRuntime> runtime,
      std::shared_ptr<MessageQueueThread> thread)
      : runtime_(runtime), thread_(std::move(thread)) {}

  virtual ~HermesExecutorRuntimeAdapter() = default;

  HermesRuntime &getRuntime() override {
    return *runtime_;
  }

  void tickleJs() override {
    // The queue will ensure that runtime_ is still valid when this
    // gets invoked.
    thread_->runOnQueue([&runtime = runtime_]() {
      auto func =
          runtime->global().getPropertyAsFunction(*runtime, "__tickleJs");
      func.call(*runtime);
    });
  }

 private:
  std::shared_ptr<HermesRuntime> runtime_;

  std::shared_ptr<MessageQueueThread> thread_;
};

struct ReentrancyCheck {
// This is effectively a very subtle and complex assert, so only
// include it in builds which would include asserts.
#ifndef NDEBUG
  ReentrancyCheck() : tid(std::thread::id()), depth(0) {}

  void before() {
    std::thread::id this_id = std::this_thread::get_id();
    std::thread::id expected = std::thread::id();

    // A note on memory ordering: the main purpose of these checks is
    // to observe a before/before race, without an intervening after.
    // This will be detected by the compare_exchange_strong atomicity
    // properties, regardless of memory order.
    //
    // For everything else, it is easiest to think of 'depth' as a
    // proxy for any access made inside the VM.  If access to depth
    // are reordered incorrectly, the same could be true of any other
    // operation made by the VM.  In fact, using acquire/release
    // memory ordering could create barriers which mask a programmer
    // error.  So, we use relaxed memory order, to avoid masking
    // actual ordering errors.  Although, in practice, ordering errors
    // of this sort would be surprising, because the decorator would
    // need to call after() without before().

    if (tid.compare_exchange_strong(
            expected, this_id, std::memory_order_relaxed)) {
      // Returns true if tid and expected were the same.  If they
      // were, then the stored tid referred to no thread, and we
      // atomically saved this thread's tid.  Now increment depth.
      assert(depth == 0 && "No thread id, but depth != 0");
      ++depth;
    } else if (expected == this_id) {
      // If the stored tid referred to a thread, expected was set to
      // that value.  If that value is this thread's tid, that's ok,
      // just increment depth again.
      assert(depth != 0 && "Thread id was set, but depth == 0");
      ++depth;
    } else {
      // The stored tid was some other thread.  This indicates a bad
      // programmer error, where VM methods were called on two
      // different threads unsafely.  Fail fast (and hard) so the
      // crash can be analyzed.
      __builtin_trap();
    }
  }

  void after() {
    assert(
        tid.load(std::memory_order_relaxed) == std::this_thread::get_id() &&
        "No thread id in after()");
    if (--depth == 0) {
      // If we decremented depth to zero, store no-thread into tid.
      std::thread::id expected = std::this_thread::get_id();
      bool didWrite = tid.compare_exchange_strong(
          expected, std::thread::id(), std::memory_order_relaxed);
      assert(didWrite && "Decremented to zero, but no tid write");
    }
  }

  std::atomic<std::thread::id> tid;
  // This is not atomic, as it is only written or read from the owning
  // thread.
  unsigned int depth;
#endif
};

// This adds ReentrancyCheck and debugger enable/teardown to the given
// Runtime.
class DecoratedRuntime : public jsi::WithRuntimeDecorator<ReentrancyCheck> {
 public:
  // The first argument may be another decorater which itself
  // decorates the real HermesRuntime, depending on the build config.
  // The second argument is the real HermesRuntime as well to
  // manage the debugger registration.
  DecoratedRuntime(
      std::unique_ptr<Runtime> runtime,
      HermesRuntime &hermesRuntime,
      std::shared_ptr<MessageQueueThread> jsQueue,
      bool enableDebugger,
      const std::string &debuggerName)
      : jsi::WithRuntimeDecorator<ReentrancyCheck>(*runtime, reentrancyCheck_),
        runtime_(std::move(runtime)) {
    enableDebugger_ = enableDebugger;
    if (enableDebugger_) {
      std::shared_ptr<HermesRuntime> rt(runtime_, &hermesRuntime);
      auto adapter =
          std::make_unique<HermesExecutorRuntimeAdapter>(rt, jsQueue);
      debugToken_ = facebook::hermes::inspector::chrome::enableDebugging(
          std::move(adapter), debuggerName);
    }
  }

  ~DecoratedRuntime() {
    if (enableDebugger_) {
      facebook::hermes::inspector::chrome::disableDebugging(debugToken_);
    }
  }

 private:
  // runtime_ is a potentially decorated Runtime.
  // hermesRuntime is a reference to a HermesRuntime managed by runtime_.
  //
  // HermesExecutorRuntimeAdapter requirements are kept, because the
  // dtor will disable debugging on the HermesRuntime before the
  // member managing it is destroyed.

  std::shared_ptr<Runtime> runtime_;
  ReentrancyCheck reentrancyCheck_;
  bool enableDebugger_;
  facebook::hermes::inspector::chrome::DebugSessionToken debugToken_;
};

} // namespace

void HermesExecutorFactory::setEnableDebugger(bool enableDebugger) {
  enableDebugger_ = enableDebugger;
}

void HermesExecutorFactory::setDebuggerName(const std::string &debuggerName) {
  debuggerName_ = debuggerName;
}

std::unique_ptr<JSExecutor> HermesExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) {
  std::unique_ptr<HermesRuntime> hermesRuntime =
      makeHermesRuntimeSystraced(runtimeConfig_);
  HermesRuntime &hermesRuntimeRef = *hermesRuntime;
  auto decoratedRuntime = std::make_shared<DecoratedRuntime>(
      std::move(hermesRuntime),
      hermesRuntimeRef,
      jsQueue,
      enableDebugger_,
      debuggerName_);

  // So what do we have now?
  // DecoratedRuntime -> HermesRuntime
  //
  // DecoratedRuntime is held by JSIExecutor.  When it gets used, it
  // will check that it's on the right thread, do any necessary trace
  // logging, then call the real HermesRuntime.  When it is destroyed,
  // it will shut down the debugger before the HermesRuntime is.  In
  // the normal case where debugging is not compiled in,
  // all that's left is the thread checking.

  // Add js engine information to Error.prototype so in error reporting we
  // can send this information.
  auto errorPrototype =
      decoratedRuntime->global()
          .getPropertyAsObject(*decoratedRuntime, "Error")
          .getPropertyAsObject(*decoratedRuntime, "prototype");
  errorPrototype.setProperty(*decoratedRuntime, "jsEngine", "hermes");

  return std::make_unique<HermesExecutor>(
      decoratedRuntime, delegate, jsQueue, timeoutInvoker_, runtimeInstaller_);
}

::hermes::vm::RuntimeConfig HermesExecutorFactory::defaultRuntimeConfig() {
  return ::hermes::vm::RuntimeConfig::Builder()
      .withEnableSampleProfiling(true)
      .build();
}

HermesExecutor::HermesExecutor(
    std::shared_ptr<jsi::Runtime> runtime,
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue,
    const JSIScopedTimeoutInvoker &timeoutInvoker,
    RuntimeInstaller runtimeInstaller)
    : JSIExecutor(runtime, delegate, timeoutInvoker, runtimeInstaller) {
  jsi::addNativeTracingHooks(*runtime);
}

} // namespace react
} // namespace facebook

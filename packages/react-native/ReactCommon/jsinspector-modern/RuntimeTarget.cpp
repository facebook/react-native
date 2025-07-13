/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SessionState.h"

#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>

using namespace facebook::jsi;

namespace facebook::react::jsinspector_modern {

namespace {

void emitSessionStatusChangeForObserverWithValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  auto globalObj = runtime.global();
  auto observer =
      globalObj.getPropertyAsObject(runtime, "__DEBUGGER_SESSION_OBSERVER__");
  auto onSessionStatusChange =
      observer.getPropertyAsFunction(runtime, "onSessionStatusChange");
  onSessionStatusChange.call(runtime, value);
}

} // namespace

std::shared_ptr<RuntimeTarget> RuntimeTarget::create(
    const ExecutionContextDescription& executionContextDescription,
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor,
    VoidExecutor selfExecutor) {
  std::shared_ptr<RuntimeTarget> runtimeTarget{
      new RuntimeTarget(executionContextDescription, delegate, jsExecutor)};
  runtimeTarget->setExecutor(selfExecutor);
  runtimeTarget->installGlobals();
  return runtimeTarget;
}

RuntimeTarget::RuntimeTarget(
    const ExecutionContextDescription& executionContextDescription,
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor)
    : executionContextDescription_(executionContextDescription),
      delegate_(delegate),
      jsExecutor_(jsExecutor) {}

void RuntimeTarget::installGlobals() {
  // NOTE: RuntimeTarget::installConsoleHandler is in RuntimeTargetConsole.cpp
  installConsoleHandler();
  installDebuggerSessionObserver();
}

std::shared_ptr<RuntimeAgent> RuntimeTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  auto runtimeAgentState =
      std::move(sessionState.lastRuntimeAgentExportedState);
  auto runtimeAgent = std::make_shared<RuntimeAgent>(
      channel,
      controller_,
      executionContextDescription_,
      sessionState,
      delegate_.createAgentDelegate(
          channel,
          sessionState,
          std::move(runtimeAgentState.delegateState),
          executionContextDescription_,
          jsExecutor_));
  agents_.insert(runtimeAgent);
  return runtimeAgent;
}

RuntimeTarget::~RuntimeTarget() {
  // Agents are owned by the session, not by RuntimeTarget, but
  // they hold a RuntimeTarget& that we must guarantee is valid.
  assert(
      agents_.empty() &&
      "RuntimeAgent objects must be destroyed before their RuntimeTarget. Did you call InstanceTarget::unregisterRuntime()?");
}

void RuntimeTarget::installBindingHandler(const std::string& bindingName) {
  jsExecutor_([bindingName,
               selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    auto globalObj = runtime.global();
    try {
      auto bindingNamePropID = jsi::PropNameID::forUtf8(runtime, bindingName);
      globalObj.setProperty(
          runtime,
          bindingNamePropID,
          jsi::Function::createFromHostFunction(
              runtime,
              bindingNamePropID,
              1,
              [bindingName, selfExecutor](
                  jsi::Runtime& rt,
                  const jsi::Value&,
                  const jsi::Value* args,
                  size_t count) -> jsi::Value {
                if (count != 1 || !args[0].isString()) {
                  throw jsi::JSError(
                      rt, "Invalid arguments: should be exactly one string.");
                }
                std::string payload = args[0].getString(rt).utf8(rt);

                selfExecutor([bindingName, payload](auto& self) {
                  self.agents_.forEach([bindingName, payload](auto& agent) {
                    agent.notifyBindingCalled(bindingName, payload);
                  });
                });

                return jsi::Value::undefined();
              }));
    } catch (jsi::JSError&) {
      // Per Chrome's implementation, @cdp Runtime.createBinding swallows
      // JavaScript exceptions that occur while setting up the binding.
    }
  });
}

void RuntimeTarget::emitDebuggerSessionCreated() {
  jsExecutor_([selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    try {
      emitSessionStatusChangeForObserverWithValue(runtime, jsi::Value(true));
    } catch (jsi::JSError&) {
      // Suppress any errors, they should not be visible to the user
      // and should not affect runtime.
    }
  });
}

void RuntimeTarget::emitDebuggerSessionDestroyed() {
  jsExecutor_([selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    try {
      emitSessionStatusChangeForObserverWithValue(runtime, jsi::Value(false));
    } catch (jsi::JSError&) {
      // Suppress any errors, they should not be visible to the user
      // and should not affect runtime.
    }
  });
}

RuntimeTargetController::RuntimeTargetController(RuntimeTarget& target)
    : target_(target) {}

void RuntimeTargetController::installBindingHandler(
    const std::string& bindingName) {
  target_.installBindingHandler(bindingName);
}

void RuntimeTargetController::notifyDebuggerSessionCreated() {
  target_.emitDebuggerSessionCreated();
}

void RuntimeTargetController::notifyDebuggerSessionDestroyed() {
  target_.emitDebuggerSessionDestroyed();
}

void RuntimeTargetController::registerForTracing() {
  target_.registerForTracing();
}

void RuntimeTargetController::enableSamplingProfiler() {
  target_.enableSamplingProfiler();
}

void RuntimeTargetController::disableSamplingProfiler() {
  target_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile
RuntimeTargetController::collectSamplingProfile() {
  return target_.collectSamplingProfile();
}

void RuntimeTarget::registerForTracing() {
  jsExecutor_([](auto& /*runtime*/) {
    tracing::PerformanceTracer::getInstance().reportJavaScriptThread();
  });
}

void RuntimeTarget::enableSamplingProfiler() {
  delegate_.enableSamplingProfiler();
}

void RuntimeTarget::disableSamplingProfiler() {
  delegate_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile RuntimeTarget::collectSamplingProfile() {
  return delegate_.collectSamplingProfile();
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SessionState.h"

#include <jsinspector-modern/RuntimeTarget.h>

using namespace facebook::jsi;

namespace facebook::react::jsinspector_modern {

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
  installConsoleHandler();
}

void RuntimeTarget::installConsoleHandler() {
  jsExecutor_([selfWeak = weak_from_this(),
               selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    // TODO(moti): Switch from implementing __inspectorLog to directly
    // installing a `console` object.
    runtime.global().setProperty(
        runtime,
        "__inspectorLog",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "__inspectorLog"),
            4,
            [selfWeak, selfExecutor](
                jsi::Runtime& rt,
                const jsi::Value& /*thisVal*/,
                const jsi::Value* args,
                size_t count) {
              if (count < 4) {
                throw jsi::JSError(
                    rt,
                    "__inspectorLog requires at least 4 arguments: logLevel, str, args, framesToSkip");
              }
              std::chrono::time_point<std::chrono::system_clock> timestamp =
                  std::chrono::system_clock::now();
              std::string level = args[0].asString(rt).utf8(rt);
              ConsoleAPIType type = ConsoleAPIType::kLog;
              if (level == "debug") {
                type = ConsoleAPIType::kDebug;
              } else if (level == "log") {
                type = ConsoleAPIType::kLog;
              } else if (level == "warning") {
                type = ConsoleAPIType::kWarning;
              } else if (level == "error") {
                type = ConsoleAPIType::kError;
              }
              // NOTE: args[1] is the processed string message - ignore it.
              jsi::Array argsArray = args[2].asObject(rt).asArray(rt);
              std::vector<jsi::Value> argsVec;
              for (size_t i = 0, length = argsArray.length(rt); i != length;
                   ++i) {
                argsVec.emplace_back(argsArray.getValueAtIndex(rt, i));
              }
              // TODO(moti): Handle framesToSkip in some way. Note that the
              // runtime doesn't even capture a stack trace at the moment.
              ConsoleMessage consoleMessage{
                  std::chrono::duration_cast<
                      std::chrono::duration<double, std::milli>>(
                      timestamp.time_since_epoch())
                      .count(),
                  type,
                  std::move(argsVec)};
              if (auto self = selfWeak.lock()) {
                // Q: Why is it safe to use self->delegate_ here?
                // A: Because the caller of InspectorTarget::registerRuntime
                // is explicitly required to guarantee that the delegate not
                // only outlives the target, but also outlives all JS code
                // execution that occurs on the JS thread.
                self->delegate_.addConsoleMessage(
                    rt, std::move(consoleMessage));
                // To ensure we never destroy `self` on the JS thread, send
                // our shared_ptr back to the inspector thread.
                selfExecutor([self = std::move(self)](auto&) { (void)self; });
              }
              return jsi::Value::undefined();
            }));
  });
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

RuntimeTargetController::RuntimeTargetController(RuntimeTarget& target)
    : target_(target) {}

void RuntimeTargetController::installBindingHandler(
    const std::string& bindingName) {
  target_.installBindingHandler(bindingName);
}

} // namespace facebook::react::jsinspector_modern

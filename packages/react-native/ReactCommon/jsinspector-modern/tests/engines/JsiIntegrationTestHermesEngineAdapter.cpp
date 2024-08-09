/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/executors/QueuedImmediateExecutor.h>

#include <hermes/inspector-modern/chrome/HermesRuntimeAgentDelegate.h>

#include "JsiIntegrationTestHermesEngineAdapter.h"

using facebook::hermes::makeHermesRuntime;

namespace facebook::react::jsinspector_modern {

JsiIntegrationTestHermesEngineAdapter::JsiIntegrationTestHermesEngineAdapter(
    folly::Executor& jsExecutor)
    : runtime_{hermes::makeHermesRuntime()}, jsExecutor_{jsExecutor} {}

std::unique_ptr<RuntimeAgentDelegate>
JsiIntegrationTestHermesEngineAdapter::createAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription) {
  return std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate>(
      new HermesRuntimeAgentDelegate(
          frontendChannel,
          sessionState,
          std::move(previouslyExportedState),
          executionContextDescription,
          runtime_,
          getRuntimeExecutor()));
}

jsi::Runtime& JsiIntegrationTestHermesEngineAdapter::getRuntime()
    const noexcept {
  return *runtime_;
}

RuntimeExecutor JsiIntegrationTestHermesEngineAdapter::getRuntimeExecutor()
    const noexcept {
  auto& jsExecutor = jsExecutor_;
  return [runtimeWeak = std::weak_ptr(runtime_), &jsExecutor](auto fn) {
    jsExecutor.add([runtimeWeak, fn]() {
      auto runtime = runtimeWeak.lock();
      if (!runtime) {
        return;
      }
      fn(*runtime);
    });
  };
}

} // namespace facebook::react::jsinspector_modern

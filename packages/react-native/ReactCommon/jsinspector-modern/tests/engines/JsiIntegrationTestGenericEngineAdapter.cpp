/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/FallbackRuntimeAgentDelegate.h>

#include <folly/executors/QueuedImmediateExecutor.h>
#include <hermes/hermes.h>

#include "JsiIntegrationTestGenericEngineAdapter.h"

using facebook::hermes::makeHermesRuntime;

namespace facebook::react::jsinspector_modern {

JsiIntegrationTestGenericEngineAdapter::JsiIntegrationTestGenericEngineAdapter(
    folly::Executor& jsExecutor)
    : runtime_{hermes::makeHermesRuntime()}, jsExecutor_{jsExecutor} {}

std::unique_ptr<RuntimeAgentDelegate>
JsiIntegrationTestGenericEngineAdapter::createAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
    const ExecutionContextDescription&) {
  return std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate>(
      new FallbackRuntimeAgentDelegate(
          frontendChannel,
          sessionState,
          "Generic engine (" + runtime_->description() + ")"));
}

jsi::Runtime& JsiIntegrationTestGenericEngineAdapter::getRuntime()
    const noexcept {
  return *runtime_;
}

RuntimeExecutor JsiIntegrationTestGenericEngineAdapter::getRuntimeExecutor()
    const noexcept {
  return [&jsExecutor = jsExecutor_, &runtime = getRuntime()](auto fn) {
    jsExecutor.add([fn, &runtime]() { fn(runtime); });
  };
}

} // namespace facebook::react::jsinspector_modern

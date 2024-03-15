/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsiIntegrationTestHermesWithCDPAgentEngineAdapter.h"

namespace facebook::react::jsinspector_modern {

JsiIntegrationTestHermesWithCDPAgentEngineAdapter::
    JsiIntegrationTestHermesWithCDPAgentEngineAdapter(
        folly::Executor& jsExecutor)
    : runtime_{hermes::makeHermesRuntime(
          ::hermes::vm::RuntimeConfig::Builder()
              .withCompilationMode(
                  ::hermes::vm::CompilationMode::ForceLazyCompilation)
              .build())},
      jsExecutor_{jsExecutor},
      runtimeTargetDelegate_{runtime_} {}

/* static */ InspectorFlagOverrides
JsiIntegrationTestHermesWithCDPAgentEngineAdapter::
    getInspectorFlagOverrides() noexcept {
  return {
      .enableHermesCDPAgent = true,
      .enableModernCDPRegistry = true,
  };
}

RuntimeTargetDelegate&
JsiIntegrationTestHermesWithCDPAgentEngineAdapter::getRuntimeTargetDelegate() {
  return runtimeTargetDelegate_;
}

jsi::Runtime& JsiIntegrationTestHermesWithCDPAgentEngineAdapter::getRuntime()
    const noexcept {
  return *runtime_;
}

RuntimeExecutor
JsiIntegrationTestHermesWithCDPAgentEngineAdapter::getRuntimeExecutor()
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

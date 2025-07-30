/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/executors/QueuedImmediateExecutor.h>
#include <hermes/hermes.h>

#include "JsiIntegrationTestGenericEngineAdapter.h"

namespace facebook::react::jsinspector_modern {

JsiIntegrationTestGenericEngineAdapter::JsiIntegrationTestGenericEngineAdapter(
    folly::Executor& jsExecutor)
    : runtime_{hermes::makeHermesRuntime()},
      jsExecutor_{jsExecutor},
      runtimeTargetDelegate_{
          "Generic engine (" + runtime_->description() + ")"} {}

/* static */ InspectorFlagOverrides
JsiIntegrationTestGenericEngineAdapter::getInspectorFlagOverrides() noexcept {
  return {};
}

RuntimeTargetDelegate&
JsiIntegrationTestGenericEngineAdapter::getRuntimeTargetDelegate() {
  return runtimeTargetDelegate_;
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

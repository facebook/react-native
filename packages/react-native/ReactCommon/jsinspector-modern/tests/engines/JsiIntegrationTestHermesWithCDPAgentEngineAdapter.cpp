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
    : JsiIntegrationTestHermesEngineAdapter(jsExecutor) {}

/* static */ InspectorFlagOverrides
JsiIntegrationTestHermesWithCDPAgentEngineAdapter::
    getInspectorFlagOverrides() noexcept {
  return {
      .enableHermesCDPAgent = true,
      .enableModernCDPRegistry = true,
  };
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "../utils/InspectorFlagOverridesGuard.h"
#include "JsiIntegrationTestHermesEngineAdapter.h"

namespace facebook::react::jsinspector_modern {

/**
 * An engine adapter for JsiIntegrationTest that uses Hermes (and Hermes's
 * new CDPAgent API).
 */
class JsiIntegrationTestHermesWithCDPAgentEngineAdapter
    : public JsiIntegrationTestHermesEngineAdapter {
 public:
  explicit JsiIntegrationTestHermesWithCDPAgentEngineAdapter(
      folly::Executor& jsExecutor);

  static InspectorFlagOverrides getInspectorFlagOverrides() noexcept;
};

} // namespace facebook::react::jsinspector_modern

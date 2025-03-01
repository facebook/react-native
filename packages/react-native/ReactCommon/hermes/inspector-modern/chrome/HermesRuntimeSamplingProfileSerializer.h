/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/hermes.h>

#include <jsinspector-modern/tracing/RuntimeSamplingProfile.h>

namespace facebook::react::jsinspector_modern::tracing {

class HermesRuntimeSamplingProfileSerializer {
 public:
  static tracing::RuntimeSamplingProfile serializeToTracingSamplingProfile(
      const hermes::sampling_profiler::Profile& hermesProfile);
};

} // namespace facebook::react::jsinspector_modern::tracing

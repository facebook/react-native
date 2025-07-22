/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "RuntimeSamplingProfile.h"

#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * A tracing profile for a single instance of an InstanceTarget.
 *
 * Captures Sampling Profiles for all RuntimeTargets associated with the owning
 * InstanceTarget during the tracing session.
 */
struct InstanceTargetTracingProfile {
 public:
  explicit InstanceTargetTracingProfile(
      std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles)
      : runtimeSamplingProfiles_(std::move(runtimeSamplingProfiles)) {}

  const std::vector<RuntimeSamplingProfile>& getRuntimeSamplingProfiles()
      const {
    return runtimeSamplingProfiles_;
  }

 private:
  /**
   * All captured Sampling Profiles during the tracing session.
   */
  std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles_;
};

} // namespace facebook::react::jsinspector_modern::tracing

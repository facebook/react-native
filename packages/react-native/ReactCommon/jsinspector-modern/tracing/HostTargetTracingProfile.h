/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InstanceTargetTracingProfile.h"

#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * A tracing profile for a single instance of an HostTarget.
 *
 * Captures Tracing Profiles for all InstanceTargets associated with the owning
 * HostTarget during the tracing session.
 */
struct HostTargetTracingProfile {
 public:
  explicit HostTargetTracingProfile(
      std::vector<InstanceTargetTracingProfile> instanceTargetTracingProfiles)
      : instanceTargetTracingProfiles_(
            std::move(instanceTargetTracingProfiles)) {}

  const std::vector<InstanceTargetTracingProfile>&
  getInstanceTargetTracingProfiles() const {
    return instanceTargetTracingProfiles_;
  }

 private:
  /**
   * All captured InstanceTarget Tracing Profiles during the tracing session.
   */
  std::vector<InstanceTargetTracingProfile> instanceTargetTracingProfiles_;
};

} // namespace facebook::react::jsinspector_modern::tracing

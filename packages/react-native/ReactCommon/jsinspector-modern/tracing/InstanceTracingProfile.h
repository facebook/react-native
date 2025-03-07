/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "RuntimeSamplingProfile.h"

#include <memory>

namespace facebook::react::jsinspector_modern::tracing {

struct InstanceTracingProfile {
 public:
  explicit InstanceTracingProfile(
      const RuntimeSamplingProfile runtimeSamplingProfile)
      : runtimeSamplingProfile_(runtimeSamplingProfile) {}

  const RuntimeSamplingProfile& getRuntimeSamplingProfile() const {
    return runtimeSamplingProfile_;
  }

 private:
  RuntimeSamplingProfile runtimeSamplingProfile_;
};

} // namespace facebook::react::jsinspector_modern::tracing

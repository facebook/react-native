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

struct TraceRecordingState {
  // All captured Runtime Sampling Profiles during this Trace Recording.
  std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles{};
};

} // namespace facebook::react::jsinspector_modern::tracing

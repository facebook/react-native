/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InstanceTracingProfile.h"
#include "RuntimeSamplingProfile.h"
#include "TracingMode.h"

#include <oscompat/OSCompat.h>
#include <react/timing/primitives.h>

#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

struct TraceRecordingState {
  // The mode of this Trace Recording.
  tracing::Mode mode;

  // The ID of the OS-level process that this Trace Recording is associated
  // with.
  ProcessId processId = oscompat::getCurrentProcessId();

  // The timestamp at which this Trace Recording started.
  HighResTimeStamp startTime;

  // All captured Runtime Sampling Profiles during this Trace Recording.
  std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles{};

  // All captures Instance Tracing Profiles during this Trace Recording.
  std::vector<InstanceTracingProfile> instanceTracingProfiles{};
};

} // namespace facebook::react::jsinspector_modern::tracing

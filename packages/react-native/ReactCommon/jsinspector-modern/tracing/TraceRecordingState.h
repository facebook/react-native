/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InstanceTracingProfile.h"
#include "RuntimeSamplingProfile.h"

#include <oscompat/OSCompat.h>
#include <react/timing/primitives.h>

#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

struct TraceRecordingState {
  bool isRecording = false;

  ProcessId processId = oscompat::getCurrentProcessId();

  HighResTimeStamp startTime = HighResTimeStamp::now();

  std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles;

  std::vector<InstanceTracingProfile> instanceTracingProfiles;
};

} // namespace facebook::react::jsinspector_modern::tracing

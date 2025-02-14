/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceTracer.h"
#include "RuntimeSamplingProfile.h"

namespace facebook::react::jsinspector_modern::tracing {

/**
 * Serializes RuntimeSamplingProfile into collection of specific Trace Events,
 * which represent Profile information on a timeline.
 */
class RuntimeSamplingProfileTraceEventSerializer {
 public:
  RuntimeSamplingProfileTraceEventSerializer() = delete;

  static void serializeAndBuffer(
      PerformanceTracer& performanceTracer,
      const RuntimeSamplingProfile& profile,
      std::chrono::steady_clock::time_point tracingStartTime,
      uint16_t profileChunkSize = 100);
};

} // namespace facebook::react::jsinspector_modern::tracing

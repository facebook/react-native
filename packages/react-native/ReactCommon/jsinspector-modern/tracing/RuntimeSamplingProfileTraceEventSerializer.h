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

  /**
   * \param performanceTracer A reference to PerformanceTracer instance.
   * \param profile What we will be serializing.
   * \param tracingStartTime A timestamp of when tracing of an
   * Instance started, will be used as a starting reference point of JavaScript
   * samples recording.
   * \param notificationCallback A callback, which is called
   * when a chunk of trace events is ready to be sent.
   * \param traceEventChunkSize The maximum number of ProfileChunk trace events
   * that can be sent in a single CDP Tracing.dataCollected message.
   * \param profileChunkSize The maximum number of ProfileChunk trace events
   * that can be sent in a single ProfileChunk trace event.
   */
  static void serializeAndNotify(
      PerformanceTracer& performanceTracer,
      const RuntimeSamplingProfile& profile,
      std::chrono::steady_clock::time_point tracingStartTime,
      const std::function<void(const folly::dynamic& traceEventsChunk)>&
          notificationCallback,
      uint16_t traceEventChunkSize,
      uint16_t profileChunkSize = 10);
};

} // namespace facebook::react::jsinspector_modern::tracing

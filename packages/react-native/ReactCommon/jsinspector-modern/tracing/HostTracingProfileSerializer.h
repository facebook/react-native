/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "FrameTimingSequence.h"
#include "HostTracingProfile.h"
#include "TraceEvent.h"

#include <folly/dynamic.h>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * A serializer for HostTracingProfile that can be used for transforming the
 * profile into sequence of serialized Trace Events.
 */
class HostTracingProfileSerializer {
 public:
  /**
   * Transforms the profile into a sequence of serialized Trace Events, which
   * is split in chunks of sizes \p traceEventsChunkSize or
   * \p profileTraceEventsChunkSize, depending on type, and sent with \p
   * chunkCallback.
   */
  static void emitAsDataCollectedChunks(
      HostTracingProfile &&hostTracingProfile,
      const std::function<void(folly::dynamic &&chunk)> &chunkCallback,
      uint16_t traceEventsChunkSize,
      uint16_t profileTraceEventsChunkSize);

  static void emitPerformanceTraceEvents(
      std::vector<TraceEvent> &&events,
      const std::function<void(folly::dynamic &&chunk)> &chunkCallback,
      uint16_t chunkSize);

  static void emitFrameTimings(
      std::vector<FrameTimingSequence> &&frameTimings,
      ProcessId processId,
      HighResTimeStamp recordingStartTimestamp,
      const std::function<void(folly::dynamic &&chunk)> &chunkCallback,
      uint16_t chunkSize);
};

} // namespace facebook::react::jsinspector_modern::tracing

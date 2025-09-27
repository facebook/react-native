/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceEvent.h"
#include "TraceRecordingState.h"

#include <folly/dynamic.h>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * A serializer for TraceRecordingState that can be used for tranforming the
 * recording into sequence of serialized Trace Events.
 */
class TraceRecordingStateSerializer {
 public:
  /**
   * Transforms the recording into a sequence of serialized Trace Events, which
   * is split in chunks of sizes \p performanceTraceEventsChunkSize or
   * \p profileTraceEventsChunkSize, depending on type, and sent with \p
   * chunkCallback.
   */
  static void emitAsDataCollectedChunks(
      TraceRecordingState&& recording,
      const std::function<void(folly::dynamic&& chunk)>& chunkCallback,
      uint16_t performanceTraceEventsChunkSize,
      uint16_t profileTraceEventsChunkSize);

  static void emitPerformanceTraceEvents(
      std::vector<TraceEvent>&& events,
      const std::function<void(folly::dynamic&& chunk)>& chunkCallback,
      uint16_t chunkSize);
};

} // namespace facebook::react::jsinspector_modern::tracing

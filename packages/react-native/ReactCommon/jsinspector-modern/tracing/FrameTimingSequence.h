/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceEvent.h"

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * A struct representing a sequence of frame timings that happened on the Host side.
 */
struct FrameTimingSequence {
  FrameTimingSequence() = delete;

  FrameTimingSequence(
      uint64_t id,
      ThreadId threadId,
      HighResTimeStamp beginDrawingTimestamp,
      HighResTimeStamp commitTimestamp,
      HighResTimeStamp endDrawingTimestamp)
      : id(id),
        threadId(threadId),
        beginDrawingTimestamp(beginDrawingTimestamp),
        commitTimestamp(commitTimestamp),
        endDrawingTimestamp(endDrawingTimestamp)
  {
  }

  /**
   * Unique ID of the sequence, used by Chrome DevTools Frontend to identify the events that form one sequence.
   */
  uint64_t id;

  /**
   * The ID of the native thread that is associated with the frame.
   */
  ThreadId threadId;

  HighResTimeStamp beginDrawingTimestamp;
  HighResTimeStamp commitTimestamp;
  HighResTimeStamp endDrawingTimestamp;
};

} // namespace facebook::react::jsinspector_modern::tracing

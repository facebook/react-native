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

using FrameSequenceId = uint64_t;

/**
 * A struct representing a sequence of frame timings that happened on the Host side.
 */
struct FrameTimingSequence {
  FrameTimingSequence() = delete;

  FrameTimingSequence(
      FrameSequenceId id,
      ThreadId threadId,
      HighResTimeStamp beginDrawingTimestamp,
      HighResTimeStamp commitTimestamp,
      HighResTimeStamp endDrawingTimestamp,
      std::optional<std::string> screenshot = std::nullopt)
      : id(id),
        threadId(threadId),
        beginDrawingTimestamp(beginDrawingTimestamp),
        commitTimestamp(commitTimestamp),
        endDrawingTimestamp(endDrawingTimestamp),
        screenshot(std::move(screenshot))
  {
  }

  /**
   * Unique ID of the sequence, used by Chrome DevTools Frontend to identify the events that form one sequence.
   */
  FrameSequenceId id;

  /**
   * The ID of the native thread that is associated with the frame.
   */
  ThreadId threadId;

  HighResTimeStamp beginDrawingTimestamp;
  HighResTimeStamp commitTimestamp;
  HighResTimeStamp endDrawingTimestamp;

  /**
   * Optional screenshot data (base64 encoded) captured during the frame.
   */
  std::optional<std::string> screenshot;
};

} // namespace facebook::react::jsinspector_modern::tracing

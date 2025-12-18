/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceEventGenerator.h"
#include "Timing.h"
#include "TracingCategory.h"

namespace facebook::react::jsinspector_modern::tracing {

/* static */ TraceEvent TraceEventGenerator::createSetLayerTreeIdEvent(
    std::string frame,
    int layerTreeId,
    ProcessId processId,
    ThreadId threadId,
    HighResTimeStamp timestamp) {
  folly::dynamic data = folly::dynamic::object("frame", std::move(frame))(
      "layerTreeId", layerTreeId);

  return TraceEvent{
      .name = "SetLayerTreeId",
      .cat = {Category::HiddenTimeline},
      .ph = 'I',
      .ts = timestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = folly::dynamic::object("data", std::move(data)),
  };
}

/* static */ std::tuple<TraceEvent, TraceEvent, TraceEvent>
TraceEventGenerator::createFrameTimingsEvents(
    uint64_t sequenceId,
    int layerTreeId,
    HighResTimeStamp beginDrawingTimestamp,
    HighResTimeStamp commitTimestamp,
    HighResTimeStamp endDrawingTimestamp,
    ProcessId processId,
    ThreadId threadId) {
  folly::dynamic args = folly::dynamic::object("frameSeqId", sequenceId)(
      "layerTreeId", layerTreeId);

  auto beginEvent = TraceEvent{
      .name = "BeginFrame",
      .cat = {Category::Frame},
      .ph = 'I',
      .ts = beginDrawingTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };
  auto commitEvent = TraceEvent{
      .name = "Commit",
      .cat = {Category::Frame},
      .ph = 'I',
      .ts = commitTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };
  auto drawEvent = TraceEvent{
      .name = "DrawFrame",
      .cat = {Category::Frame},
      .ph = 'I',
      .ts = endDrawingTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };

  return {std::move(beginEvent), std::move(commitEvent), std::move(drawEvent)};
}

/* static */ TraceEvent TraceEventGenerator::createScreenshotEvent(
    FrameSequenceId frameSequenceId,
    int sourceId,
    std::string&& snapshot,
    HighResTimeStamp expectedDisplayTime,
    ProcessId processId,
    ThreadId threadId) {
  folly::dynamic args = folly::dynamic::object("snapshot", std::move(snapshot))(
      "source_id", sourceId)("frame_sequence", frameSequenceId)(
      "expected_display_time",
      highResTimeStampToTracingClockTimeStamp(expectedDisplayTime));

  return TraceEvent{
      .name = "Screenshot",
      .cat = {Category::Screenshot},
      .ph = 'O',
      .ts = expectedDisplayTime,
      .pid = processId,
      .tid = threadId,
      .args = std::move(args),
  };
}

}; // namespace facebook::react::jsinspector_modern::tracing

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceEventGenerator.h"
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
      .cat = {Category::Timeline},
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
      .cat = {Category::Timeline},
      .ph = 'I',
      .ts = beginDrawingTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };
  auto commitEvent = TraceEvent{
      .name = "Commit",
      .cat = {Category::Timeline},
      .ph = 'I',
      .ts = commitTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };
  auto drawEvent = TraceEvent{
      .name = "DrawFrame",
      .cat = {Category::Timeline},
      .ph = 'I',
      .ts = endDrawingTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };

  return {std::move(beginEvent), std::move(commitEvent), std::move(drawEvent)};
}

}; // namespace facebook::react::jsinspector_modern::tracing

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceTracer.h"

#include <folly/json.h>

#include <mutex>
#include <unordered_set>

namespace facebook::react::jsinspector_modern {

namespace {

/** Process ID for all emitted events. */
const uint64_t PID = 1000;

/** Default/starting track ID for the "Timings" track. */
const uint64_t USER_TIMINGS_DEFAULT_TRACK = 1000;

} // namespace

PerformanceTracer& PerformanceTracer::getInstance() {
  static PerformanceTracer tracer;
  return tracer;
}

bool PerformanceTracer::startTracing() {
  std::lock_guard lock(mutex_);
  if (tracing_) {
    return false;
  }
  tracing_ = true;
  return true;
}

bool PerformanceTracer::stopTracingAndCollectEvents(
    const std::function<void(const folly::dynamic& eventsChunk)>&
        resultCallback) {
  std::lock_guard lock(mutex_);

  if (!tracing_) {
    return false;
  }

  tracing_ = false;
  if (buffer_.empty()) {
    return true;
  }

  auto traceEvents = folly::dynamic::array();
  auto savedBuffer = std::move(buffer_);
  buffer_.clear();

  // Register "Main" process
  traceEvents.push_back(folly::dynamic::object(
      "args", folly::dynamic::object("name", "Main"))("cat", "__metadata")(
      "name", "process_name")("ph", "M")("pid", PID)("tid", 0)("ts", 0));
  // Register "Timings" track
  // NOTE: This is a hack to make the trace viewer show a "Timings" track
  // adjacent to custom tracks in our current build of Chrome DevTools.
  // In future, we should align events exactly.
  traceEvents.push_back(
      folly::dynamic::object("args", folly::dynamic::object("name", "Timings"))(
          "cat", "__metadata")("name", "thread_name")("ph", "M")("pid", PID)(
          "tid", USER_TIMINGS_DEFAULT_TRACK)("ts", 0));

  auto customTrackIdMap = getCustomTracks(savedBuffer);
  for (const auto& [trackName, trackId] : customTrackIdMap) {
    // Register custom tracks
    traceEvents.push_back(folly::dynamic::object(
        "args", folly::dynamic::object("name", trackName))("cat", "__metadata")(
        "name", "thread_name")("ph", "M")("pid", PID)("tid", trackId)("ts", 0));
  }

  for (auto& event : savedBuffer) {
    // Emit trace events
    traceEvents.push_back(serializeTraceEvent(event, customTrackIdMap));

    if (traceEvents.size() >= 1000) {
      resultCallback(traceEvents);
      traceEvents = folly::dynamic::array();
    }
  }

  if (traceEvents.size() >= 1) {
    resultCallback(traceEvents);
  }
  return true;
}

void PerformanceTracer::reportMark(
    const std::string_view& name,
    uint64_t start) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracing_) {
    return;
  }
  buffer_.push_back(TraceEvent{
      .type = TraceEventType::MARK, .name = std::string(name), .start = start});
}

void PerformanceTracer::reportMeasure(
    const std::string_view& name,
    uint64_t start,
    uint64_t duration,
    const std::optional<DevToolsTrackEntryPayload>& trackMetadata) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracing_) {
    return;
  }

  std::optional<std::string> track;
  if (trackMetadata.has_value()) {
    track = trackMetadata.value().track;
  }

  buffer_.push_back(TraceEvent{
      .type = TraceEventType::MEASURE,
      .name = std::string(name),
      .start = start,
      .duration = duration,
      .track = track});
}

std::unordered_map<std::string, uint32_t> PerformanceTracer::getCustomTracks(
    std::vector<TraceEvent>& events) {
  std::unordered_map<std::string, uint32_t> trackIdMap;

  uint32_t nextTrack = USER_TIMINGS_DEFAULT_TRACK + 1;
  for (auto& event : events) {
    // Custom tracks are only supported by User Timing "measure" events
    if (event.type != TraceEventType::MEASURE) {
      continue;
    }

    if (event.track.has_value() && !trackIdMap.contains(event.track.value())) {
      auto trackId = nextTrack++;
      trackIdMap[event.track.value()] = trackId;
    }
  }

  return trackIdMap;
}

folly::dynamic PerformanceTracer::serializeTraceEvent(
    TraceEvent& event,
    std::unordered_map<std::string, uint32_t>& customTrackIdMap) const {
  folly::dynamic result = folly::dynamic::object;

  result["args"] = folly::dynamic::object();
  result["cat"] = "blink.user_timing";
  result["name"] = event.name;
  result["pid"] = PID;
  result["ts"] = event.start;

  switch (event.type) {
    case TraceEventType::MARK:
      result["ph"] = "I";
      result["tid"] = USER_TIMINGS_DEFAULT_TRACK;
      break;
    case TraceEventType::MEASURE:
      result["dur"] = event.duration;
      result["ph"] = "X";
      result["tid"] = event.track.has_value()
          ? customTrackIdMap[event.track.value()]
          : USER_TIMINGS_DEFAULT_TRACK;
      break;
  }

  return result;
}

} // namespace facebook::react::jsinspector_modern

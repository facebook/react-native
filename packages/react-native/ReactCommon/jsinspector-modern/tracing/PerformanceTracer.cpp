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
    customTrackIdMap_.clear();
    return true;
  }

  auto traceEvents = folly::dynamic::array();

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

  for (const auto& [trackName, trackId] : customTrackIdMap_) {
    // Register custom tracks
    traceEvents.push_back(folly::dynamic::object(
        "args", folly::dynamic::object("name", trackName))("cat", "__metadata")(
        "name", "thread_name")("ph", "M")("pid", PID)("tid", trackId)("ts", 0));
  }

  for (auto event : buffer_) {
    // Emit trace events
    traceEvents.push_back(serializeTraceEvent(event));

    if (traceEvents.size() >= 1000) {
      resultCallback(traceEvents);
      traceEvents = folly::dynamic::array();
    }
  }
  customTrackIdMap_.clear();
  buffer_.clear();

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

  TraceEventBase* event = new InstantTraceEvent{
      std::string(name),
      std::vector{TraceEventCategory::UserTiming},
      start,
      PID, // FIXME: This should be real process ID.
      USER_TIMINGS_DEFAULT_TRACK, // FIXME: This should be real thread ID.
  };
  buffer_.push_back(event);
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

  uint64_t threadId =
      USER_TIMINGS_DEFAULT_TRACK; // FIXME: This should be real thread ID.
  if (trackMetadata.has_value()) {
    std::string trackName = trackMetadata.value().track;

    if (!customTrackIdMap_.contains(trackName)) {
      uint64_t trackId =
          USER_TIMINGS_DEFAULT_TRACK + customTrackIdMap_.size() + 1;
      threadId = trackId;

      customTrackIdMap_.emplace(trackName, trackId);
    }
  }

  TraceEventBase* event = new CompleteTraceEvent{
      std::string(name),
      std::vector{TraceEventCategory::UserTiming},
      start,
      PID, // FIXME: This should be real process ID.
      threadId, // FIXME: This should be real thread ID.
      duration};
  buffer_.push_back(event);
}

std::string PerformanceTracer::serializeTraceEventCategories(
    TraceEventBase* event) const {
  std::string result;

  for (const auto& category : event->categories) {
    switch (category) {
      case TraceEventCategory::UserTiming:
        result += "blink.user_timing";
        break;
      case TraceEventCategory::TimelineEvent:
        result += "disabled-by-default-devtools.timeline";
        break;

      default:
        throw std::runtime_error("Unknown trace event category");
    }

    result += ",";
  }

  if (result.length() > 0) {
    result.pop_back();
  }

  return result;
}

folly::dynamic PerformanceTracer::serializeTraceEvent(
    TraceEventBase* event) const {
  folly::dynamic result = folly::dynamic::object;

  result["name"] = event->name;
  result["cat"] = serializeTraceEventCategories(event);
  result["args"] = event->args;
  result["ts"] = event->timestamp;
  result["pid"] = event->processId;
  result["tid"] = event->threadId;

  switch (event->type) {
    case TraceEventType::Instant:
      result["ph"] = "I";

      break;

    case TraceEventType::Complete: {
      result["ph"] = "X";

      auto completeEvent = static_cast<CompleteTraceEvent*>(event);
      result["dur"] = completeEvent->duration;

      break;
    }

    default:
      throw std::runtime_error("Unknown trace event type");
  }

  return result;
}

} // namespace facebook::react::jsinspector_modern

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

  // Register "Main" process
  buffer_.push_back(TraceEvent{
      .name = "process_name",
      .cat = "__metadata",
      .ph = 'M',
      .ts = 0,
      .pid = PID,
      .tid = 0,
      .args = folly::dynamic::object("name", "Main"),
  });
  // Register "Timings" track
  // NOTE: This is a hack to make the Trace Viewer show a "Timings" track
  // adjacent to custom tracks in our current build of Chrome DevTools.
  // In future, we should align events exactly.
  buffer_.push_back(TraceEvent{
      .name = "thread_name",
      .cat = "__metadata",
      .ph = 'M',
      .ts = 0,
      .pid = PID,
      .tid = USER_TIMINGS_DEFAULT_TRACK,
      .args = folly::dynamic::object("name", "Timings"),
  });

  for (const auto& [trackName, trackId] : customTrackIdMap_) {
    // Register custom tracks
    buffer_.push_back(TraceEvent{
        .name = "thread_name",
        .cat = "__metadata",
        .ph = 'M',
        .ts = 0,
        .pid = PID,
        .tid = trackId,
        .args = folly::dynamic::object("name", trackName),
    });
  }

  auto traceEvents = folly::dynamic::array();

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

  buffer_.push_back(TraceEvent{
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'I',
      .ts = start,
      .pid = PID, // FIXME: This should be the real process ID.
      .tid = USER_TIMINGS_DEFAULT_TRACK, // FIXME: This should be the real
                                         // thread ID.
  });
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

  // NOTE: We synthetically create custom tracks as a hack to render them in
  // our current build of Chrome DevTools frontend.
  // TODO: Remove and align with web.
  uint64_t threadId = USER_TIMINGS_DEFAULT_TRACK;
  if (trackMetadata.has_value()) {
    std::string trackName = trackMetadata.value().track;

    if (!customTrackIdMap_.contains(trackName)) {
      uint64_t trackId =
          USER_TIMINGS_DEFAULT_TRACK + customTrackIdMap_.size() + 1;
      threadId = trackId;

      customTrackIdMap_.emplace(trackName, trackId);
    }
  }

  buffer_.push_back(TraceEvent{
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'X',
      .ts = start,
      .pid = PID, // FIXME: This should be the real process ID.
      .tid = threadId, // FIXME: This should be the real thread ID.
      .dur = duration,
  });
}

folly::dynamic PerformanceTracer::serializeTraceEvent(TraceEvent event) const {
  folly::dynamic result = folly::dynamic::object;

  result["name"] = event.name;
  result["cat"] = event.cat;
  result["ph"] = std::string(1, event.ph);
  result["ts"] = event.ts;
  result["pid"] = event.pid;
  result["tid"] = event.tid;
  result["args"] = event.args;
  if (event.dur.has_value()) {
    result["dur"] = event.dur.value();
  }

  return result;
}

} // namespace facebook::react::jsinspector_modern

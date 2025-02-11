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

uint64_t getUnixTimestampOfNow() {
  return std::chrono::duration_cast<std::chrono::microseconds>(
             std::chrono::steady_clock::now().time_since_epoch())
      .count();
}

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

  buffer_.push_back(TraceEvent{
      .name = "TracingStartedInPage",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'I',
      .ts = getUnixTimestampOfNow(),
      .pid = PID, // FIXME: This should be the real process ID.
      .tid = 0, // FIXME: This should be the real thread ID.
      .args = folly::dynamic::object("data", folly::dynamic::object()),
  });

  tracing_ = true;
  return true;
}

bool PerformanceTracer::stopTracing() {
  std::lock_guard lock(mutex_);
  if (!tracing_) {
    return false;
  }

  performanceMeasureCount_ = 0;
  tracing_ = false;
  return true;
}

void PerformanceTracer::collectEvents(
    const std::function<void(const folly::dynamic& eventsChunk)>&
        resultCallback,
    uint16_t chunkSize) {
  std::lock_guard lock(mutex_);

  if (buffer_.empty()) {
    return;
  }

  auto traceEvents = folly::dynamic::array();
  for (auto event : buffer_) {
    // Emit trace events
    traceEvents.push_back(serializeTraceEvent(event));

    if (traceEvents.size() == chunkSize) {
      resultCallback(traceEvents);
      traceEvents = folly::dynamic::array();
    }
  }
  if (!traceEvents.empty()) {
    resultCallback(traceEvents);
  }

  buffer_.clear();
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

  folly::dynamic beginEventArgs = folly::dynamic::object();
  if (trackMetadata.has_value()) {
    folly::dynamic devtoolsObject = folly::dynamic::object(
        "devtools",
        folly::dynamic::object("track", trackMetadata.value().track));
    beginEventArgs =
        folly::dynamic::object("detail", folly::toJson(devtoolsObject));
  }

  ++performanceMeasureCount_;
  buffer_.push_back(TraceEvent{
      .id = performanceMeasureCount_,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'b',
      .ts = start,
      .pid = PID, // FIXME: This should be the real process ID.
      .tid = USER_TIMINGS_DEFAULT_TRACK, // FIXME: This should be the real
                                         // thread ID.
      .args = beginEventArgs,
  });
  buffer_.push_back(TraceEvent{
      .id = performanceMeasureCount_,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'e',
      .ts = start + duration,
      .pid = PID, // FIXME: This should be the real process ID.
      .tid = USER_TIMINGS_DEFAULT_TRACK, // FIXME: This should be the real
                                         // thread ID.
  });
}

folly::dynamic PerformanceTracer::serializeTraceEvent(TraceEvent event) const {
  folly::dynamic result = folly::dynamic::object;

  if (event.id.has_value()) {
    result["id"] = folly::sformat("0x{:X}", event.id.value());
  }
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

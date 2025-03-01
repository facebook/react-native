/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceTracer.h"

#include <oscompat/OSCompat.h>

#include <folly/json.h>

#include <mutex>

namespace facebook::react::jsinspector_modern {

namespace {

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

PerformanceTracer::PerformanceTracer()
    : processId_(oscompat::getCurrentProcessId()) {}

bool PerformanceTracer::startTracing() {
  {
    std::lock_guard lock(mutex_);
    if (tracing_) {
      return false;
    }

    tracing_ = true;
  }

  reportProcess(processId_, "React Native");

  {
    std::lock_guard lock(mutex_);
    buffer_.push_back(TraceEvent{
        .name = "TracingStartedInPage",
        .cat = "disabled-by-default-devtools.timeline",
        .ph = 'I',
        .ts = getUnixTimestampOfNow(),
        .pid = processId_,
        .tid = oscompat::getCurrentThreadId(),
        .args = folly::dynamic::object("data", folly::dynamic::object()),
    });

    return true;
  }
}

bool PerformanceTracer::stopTracing() {
  std::lock_guard lock(mutex_);
  if (!tracing_) {
    return false;
  }

  // This is synthetic Trace Event, which should not be represented on a
  // timeline. CDT is not using Profile or ProfileChunk events for determining
  // trace timeline window, this is why trace that only contains JavaScript
  // samples will be displayed as empty. We use this event to avoid that.
  // This could happen for non-bridgeless apps, where Performance interface is
  // not supported and no spec-compliant Event Loop implementation.
  buffer_.push_back(TraceEvent{
      .name = "ReactNative-TracingStopped",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'I',
      .ts = getUnixTimestampOfNow(),
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
  });

  performanceMeasureCount_ = 0;
  profileCount_ = 0;
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
  if (!tracing_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracing_) {
    return;
  }

  buffer_.push_back(TraceEvent{
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'I',
      .ts = start,
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
  });
}

void PerformanceTracer::reportMeasure(
    const std::string_view& name,
    uint64_t start,
    uint64_t duration,
    const std::optional<DevToolsTrackEntryPayload>& trackMetadata) {
  if (!tracing_) {
    return;
  }

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
  auto currentThreadId = oscompat::getCurrentThreadId();
  buffer_.push_back(TraceEvent{
      .id = performanceMeasureCount_,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'b',
      .ts = start,
      .pid = processId_,
      .tid = currentThreadId,
      .args = beginEventArgs,
  });
  buffer_.push_back(TraceEvent{
      .id = performanceMeasureCount_,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'e',
      .ts = start + duration,
      .pid = processId_,
      .tid = currentThreadId,
  });
}

void PerformanceTracer::reportProcess(uint64_t id, const std::string& name) {
  if (!tracing_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracing_) {
    return;
  }

  buffer_.push_back(TraceEvent{
      .name = "process_name",
      .cat = "__metadata",
      .ph = 'M',
      .ts = 0,
      .pid = id,
      .tid = 0,
      .args = folly::dynamic::object("name", name),
  });
}

void PerformanceTracer::reportJavaScriptThread() {
  reportThread(oscompat::getCurrentThreadId(), "JavaScript");
}

void PerformanceTracer::reportThread(uint64_t id, const std::string& name) {
  if (!tracing_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracing_) {
    return;
  }

  buffer_.push_back(TraceEvent{
      .name = "thread_name",
      .cat = "__metadata",
      .ph = 'M',
      .ts = 0,
      .pid = processId_,
      .tid = id,
      .args = folly::dynamic::object("name", name),
  });

  // This is synthetic Trace Event, which should not be represented on a
  // timeline. CDT will filter out threads that only have JavaScript samples and
  // no timeline events or user timings. We use this event to avoid that.
  // This could happen for non-bridgeless apps, where Performance interface is
  // not supported and no spec-compliant Event Loop implementation.
  buffer_.push_back(TraceEvent{
      .name = "ReactNative-ThreadRegistered",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'I',
      .ts = 0,
      .pid = processId_,
      .tid = id,
  });
}

uint16_t PerformanceTracer::reportRuntimeProfile(
    uint64_t threadId,
    uint64_t eventUnixTimestamp) {
  std::lock_guard lock(mutex_);
  if (!tracing_) {
    throw std::runtime_error(
        "Runtime Profile should only be reported when Tracing is enabled");
  }

  ++profileCount_;
  // CDT prioritizes event timestamp over startTime metadata field.
  // https://fburl.com/lo764pf4
  buffer_.push_back(TraceEvent{
      .id = profileCount_,
      .name = "Profile",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = eventUnixTimestamp,
      .pid = processId_,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data", folly ::dynamic::object("startTime", eventUnixTimestamp)),
  });

  return profileCount_;
}

void PerformanceTracer::reportRuntimeProfileChunk(
    uint16_t profileId,
    uint64_t threadId,
    uint64_t eventUnixTimestamp,
    const tracing::TraceEventProfileChunk& traceEventProfileChunk) {
  std::lock_guard lock(mutex_);
  if (!tracing_) {
    return;
  }

  buffer_.push_back(TraceEvent{
      .id = profileId,
      .name = "ProfileChunk",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = eventUnixTimestamp,
      .pid = processId_,
      .tid = threadId,
      .args =
          folly::dynamic::object("data", traceEventProfileChunk.asDynamic()),
  });
}

void PerformanceTracer::reportEventLoopTask(uint64_t start, uint64_t end) {
  if (!tracing_) {
    return;
  }

  std::lock_guard lock(mutex_);
  if (!tracing_) {
    return;
  }

  buffer_.push_back(TraceEvent{
      .name = "RunTask",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'X',
      .ts = start,
      .pid = oscompat::getCurrentProcessId(),
      .tid = oscompat::getCurrentThreadId(),
      .dur = end - start,
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

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceTracer.h"
#include "Timing.h"

#include <oscompat/OSCompat.h>

#include <folly/json.h>

#include <array>
#include <mutex>

namespace facebook::react::jsinspector_modern::tracing {

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
        .ts = HighResTimeStamp::now(),
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
      .ts = HighResTimeStamp::now(),
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
  });

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
    HighResTimeStamp start) {
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
    HighResTimeStamp start,
    HighResDuration duration,
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
      .ts = TRACING_TIME_ORIGIN,
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
      .ts = TRACING_TIME_ORIGIN,
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
      .ts = TRACING_TIME_ORIGIN,
      .pid = processId_,
      .tid = id,
  });
}

void PerformanceTracer::reportEventLoopTask(
    HighResTimeStamp start,
    HighResTimeStamp end) {
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

void PerformanceTracer::reportEventLoopMicrotasks(
    HighResTimeStamp start,
    HighResTimeStamp end) {
  if (!tracing_) {
    return;
  }

  std::lock_guard lock(mutex_);
  if (!tracing_) {
    return;
  }

  buffer_.push_back(TraceEvent{
      .name = "RunMicrotasks",
      .cat = "v8.execute",
      .ph = 'X',
      .ts = start,
      .pid = oscompat::getCurrentProcessId(),
      .tid = oscompat::getCurrentThreadId(),
      .dur = end - start,
  });
}

folly::dynamic PerformanceTracer::getSerializedRuntimeProfileTraceEvent(
    uint64_t threadId,
    uint16_t profileId,
    HighResTimeStamp profileTimestamp) {
  // CDT prioritizes event timestamp over startTime metadata field.
  // https://fburl.com/lo764pf4
  return serializeTraceEvent(TraceEvent{
      .id = profileId,
      .name = "Profile",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = profileTimestamp,
      .pid = processId_,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          folly ::dynamic::object(
              "startTime",
              highResTimeStampToTracingClockTimeStamp(profileTimestamp))),
  });
}

folly::dynamic PerformanceTracer::getSerializedRuntimeProfileChunkTraceEvent(
    uint16_t profileId,
    uint64_t threadId,
    HighResTimeStamp chunkTimestamp,
    const tracing::TraceEventProfileChunk& traceEventProfileChunk) {
  return serializeTraceEvent(TraceEvent{
      .id = profileId,
      .name = "ProfileChunk",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = chunkTimestamp,
      .pid = processId_,
      .tid = threadId,
      .args =
          folly::dynamic::object("data", traceEventProfileChunk.toDynamic()),
  });
}

folly::dynamic PerformanceTracer::serializeTraceEvent(
    const TraceEvent& event) const {
  folly::dynamic result = folly::dynamic::object;

  if (event.id.has_value()) {
    std::array<char, 16> buffer{};
    snprintf(buffer.data(), buffer.size(), "0x%x", event.id.value());
    result["id"] = buffer.data();
  }
  result["name"] = event.name;
  result["cat"] = event.cat;
  result["ph"] = std::string(1, event.ph);
  result["ts"] = highResTimeStampToTracingClockTimeStamp(event.ts);
  result["pid"] = event.pid;
  result["tid"] = event.tid;
  result["args"] = event.args;
  if (event.dur.has_value()) {
    result["dur"] = highResDurationToTracingClockDuration(event.dur.value());
  }

  return result;
}

} // namespace facebook::react::jsinspector_modern::tracing

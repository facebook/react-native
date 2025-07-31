/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceTracer.h"
#include "Timing.h"
#include "TraceEventSerializer.h"

#include <oscompat/OSCompat.h>
#include <react/timing/primitives.h>

#include <folly/json.h>

#include <mutex>

namespace facebook::react::jsinspector_modern::tracing {

PerformanceTracer& PerformanceTracer::getInstance() {
  static PerformanceTracer tracer;
  return tracer;
}

PerformanceTracer::PerformanceTracer()
    : processId_(oscompat::getCurrentProcessId()) {}

bool PerformanceTracer::startTracing() {
  std::lock_guard lock(mutex_);
  if (tracingAtomic_) {
    return false;
  }
  tracingAtomic_ = true;

  buffer_.emplace_back(TraceEvent{
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

bool PerformanceTracer::stopTracing() {
  std::lock_guard lock(mutex_);
  if (!tracingAtomic_) {
    return false;
  }
  tracingAtomic_ = false;

  // This is synthetic Trace Event, which should not be represented on a
  // timeline. CDT is not using Profile or ProfileChunk events for determining
  // trace timeline window, this is why trace that only contains JavaScript
  // samples will be displayed as empty. We use this event to avoid that.
  // This could happen for non-bridgeless apps, where Performance interface is
  // not supported and no spec-compliant Event Loop implementation.
  buffer_.emplace_back(TraceEvent{
      .name = "ReactNative-TracingStopped",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'I',
      .ts = HighResTimeStamp::now(),
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
  });

  performanceMeasureCount_ = 0;
  return true;
}

void PerformanceTracer::collectEvents(
    const std::function<void(folly::dynamic&& eventsChunk)>& resultCallback,
    uint16_t chunkSize) {
  std::vector<TraceEvent> localBuffer;
  {
    std::lock_guard lock(mutex_);
    buffer_.swap(localBuffer);
  }

  if (localBuffer.empty()) {
    return;
  }

  auto serializedTraceEvents = folly::dynamic::array();
  for (auto&& event : localBuffer) {
    // Emit trace events
    serializedTraceEvents.push_back(
        TraceEventSerializer::serialize(std::move(event)));

    if (serializedTraceEvents.size() == chunkSize) {
      resultCallback(std::move(serializedTraceEvents));
      serializedTraceEvents = folly::dynamic::array();
    }
  }
  if (!serializedTraceEvents.empty()) {
    resultCallback(std::move(serializedTraceEvents));
  }
}

std::vector<TraceEvent> PerformanceTracer::collectTraceEvents() {
  std::vector<TraceEvent> events;
  {
    std::lock_guard lock(mutex_);
    buffer_.swap(events);
  }
  return events;
}

void PerformanceTracer::reportMark(
    const std::string_view& name,
    HighResTimeStamp start,
    folly::dynamic&& detail) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  folly::dynamic eventArgs = folly::dynamic::object();
  if (detail != nullptr) {
    eventArgs = folly::dynamic::object(
        "data", folly::dynamic::object("detail", folly::toJson(detail)));
  }

  buffer_.emplace_back(TraceEvent{
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'I',
      .ts = start,
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
      .args = eventArgs,
  });
}

void PerformanceTracer::reportMeasure(
    const std::string_view& name,
    HighResTimeStamp start,
    HighResDuration duration,
    folly::dynamic&& detail) {
  if (!tracingAtomic_) {
    return;
  }

  folly::dynamic beginEventArgs = folly::dynamic::object();
  if (detail != nullptr) {
    beginEventArgs = folly::dynamic::object("detail", folly::toJson(detail));
  }

  auto currentThreadId = oscompat::getCurrentThreadId();

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }
  auto eventId = ++performanceMeasureCount_;

  buffer_.emplace_back(TraceEvent{
      .id = eventId,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'b',
      .ts = start,
      .pid = processId_,
      .tid = currentThreadId,
      .args = beginEventArgs,
  });
  buffer_.emplace_back(TraceEvent{
      .id = eventId,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'e',
      .ts = start + duration,
      .pid = processId_,
      .tid = currentThreadId,
  });
}

void PerformanceTracer::reportTimeStamp(
    std::string name,
    std::optional<ConsoleTimeStampEntry> start,
    std::optional<ConsoleTimeStampEntry> end,
    std::optional<std::string> trackName,
    std::optional<std::string> trackGroup,
    std::optional<ConsoleTimeStampColor> color) {
  if (!tracingAtomic_) {
    return;
  }

  // `name` takes precedence over `message` in Chrome DevTools Frontend, no need
  // to record both.
  folly::dynamic data = folly::dynamic::object("name", std::move(name));
  if (start) {
    if (std::holds_alternative<HighResTimeStamp>(*start)) {
      data["start"] = highResTimeStampToTracingClockTimeStamp(
          std::get<HighResTimeStamp>(*start));
    } else {
      data["start"] = std::move(std::get<std::string>(*start));
    }
  }
  if (end) {
    if (std::holds_alternative<HighResTimeStamp>(*end)) {
      data["end"] = highResTimeStampToTracingClockTimeStamp(
          std::get<HighResTimeStamp>(*end));
    } else {
      data["end"] = std::move(std::get<std::string>(*end));
    }
  }
  if (trackName) {
    data["track"] = std::move(*trackName);
  }
  if (trackGroup) {
    data["trackGroup"] = std::move(*trackGroup);
  }
  if (color) {
    data["color"] = consoleTimeStampColorToString(*color);
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }
  buffer_.emplace_back(TraceEvent{
      .name = "TimeStamp",
      .cat = "devtools.timeline",
      .ph = 'I',
      .ts = HighResTimeStamp::now(),
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
      .args = folly::dynamic::object("data", std::move(data)),
  });
}

void PerformanceTracer::reportEventLoopTask(
    HighResTimeStamp start,
    HighResTimeStamp end) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  buffer_.emplace_back(TraceEvent{
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
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  buffer_.emplace_back(TraceEvent{
      .name = "RunMicrotasks",
      .cat = "v8.execute",
      .ph = 'X',
      .ts = start,
      .pid = oscompat::getCurrentProcessId(),
      .tid = oscompat::getCurrentThreadId(),
      .dur = end - start,
  });
}

/* static */ TraceEvent PerformanceTracer::constructRuntimeProfileTraceEvent(
    RuntimeProfileId profileId,
    ProcessId processId,
    ThreadId threadId,
    HighResTimeStamp profileTimestamp) {
  // CDT prioritizes event timestamp over startTime metadata field.
  // https://fburl.com/lo764pf4
  return TraceEvent{
      .id = profileId,
      .name = "Profile",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = profileTimestamp,
      .pid = processId,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          folly::dynamic::object(
              "startTime",
              highResTimeStampToTracingClockTimeStamp(profileTimestamp))),
  };
}

/* static */ TraceEvent
PerformanceTracer::constructRuntimeProfileChunkTraceEvent(
    RuntimeProfileId profileId,
    ProcessId processId,
    ProcessId threadId,
    HighResTimeStamp chunkTimestamp,
    TraceEventProfileChunk&& traceEventProfileChunk) {
  return TraceEvent{
      .id = profileId,
      .name = "ProfileChunk",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = chunkTimestamp,
      .pid = processId,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          TraceEventSerializer::serializeProfileChunk(
              std::move(traceEventProfileChunk))),
  };
}

} // namespace facebook::react::jsinspector_modern::tracing

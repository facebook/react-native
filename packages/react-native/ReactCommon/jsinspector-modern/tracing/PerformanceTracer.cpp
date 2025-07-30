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
  {
    std::lock_guard lock(mutex_);
    if (tracingAtomic_) {
      return false;
    }
    tracingAtomic_ = true;
  }

  reportProcess(processId_, "React Native");

  {
    std::lock_guard lock(mutex_);
    if (!tracingAtomic_) {
      return false;
    }
    buffer_.emplace_back(TraceEvent{
        .name = "TracingStartedInPage",
        .cat = "disabled-by-default-devtools.timeline",
        .ph = 'I',
        .ts = HighResTimeStamp::now(),
        .pid = processId_,
        .tid = oscompat::getCurrentThreadId(),
        .args = folly::dynamic::object("data", folly::dynamic::object()),
    });
  }

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

folly::dynamic PerformanceTracer::collectEvents(uint16_t chunkSize) {
  std::vector<TraceEvent> localBuffer;
  {
    std::lock_guard lock(mutex_);
    buffer_.swap(localBuffer);
  }

  auto chunks = folly::dynamic::array();
  if (localBuffer.empty()) {
    return chunks;
  }

  auto chunk = folly::dynamic::array();
  chunk.reserve(chunkSize);
  for (auto&& event : localBuffer) {
    chunk.push_back(TraceEventSerializer::serialize(std::move(event)));

    if (chunk.size() == chunkSize) {
      chunks.push_back(std::move(chunk));
      chunk = folly::dynamic::array();
      chunk.reserve(chunkSize);
    }
  }

  if (!chunk.empty()) {
    chunks.push_back(std::move(chunk));
  }
  return chunks;
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

void PerformanceTracer::reportProcess(uint64_t id, const std::string& name) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  buffer_.emplace_back(TraceEvent{
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
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  buffer_.emplace_back(TraceEvent{
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
  buffer_.emplace_back(TraceEvent{
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

folly::dynamic PerformanceTracer::getSerializedRuntimeProfileTraceEvent(
    uint64_t threadId,
    uint16_t profileId,
    HighResTimeStamp profileTimestamp) {
  // CDT prioritizes event timestamp over startTime metadata field.
  // https://fburl.com/lo764pf4
  return TraceEventSerializer::serialize(TraceEvent{
      .id = profileId,
      .name = "Profile",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = profileTimestamp,
      .pid = processId_,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          folly::dynamic::object(
              "startTime",
              highResTimeStampToTracingClockTimeStamp(profileTimestamp))),
  });
}

folly::dynamic PerformanceTracer::getSerializedRuntimeProfileChunkTraceEvent(
    uint16_t profileId,
    uint64_t threadId,
    HighResTimeStamp chunkTimestamp,
    tracing::TraceEventProfileChunk&& traceEventProfileChunk) {
  return TraceEventSerializer::serialize(TraceEvent{
      .id = profileId,
      .name = "ProfileChunk",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = chunkTimestamp,
      .pid = processId_,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          TraceEventSerializer::serializeProfileChunk(
              std::move(traceEventProfileChunk))),
  });
}

} // namespace facebook::react::jsinspector_modern::tracing

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

namespace {
/**
 * Instead of validating that the indicated duration is positive, we can ensure
 * the value is sensible (less than 1 seccond doesn't make much sense).
 */
const HighResDuration MIN_VALUE_FOR_MAX_TRACE_DURATION_OPTION =
    HighResDuration::fromMilliseconds(1000); // 1 second
} // namespace

PerformanceTracer& PerformanceTracer::getInstance() {
  static PerformanceTracer tracer;
  return tracer;
}

PerformanceTracer::PerformanceTracer()
    : processId_(oscompat::getCurrentProcessId()) {}

bool PerformanceTracer::startTracing() {
  return startTracingImpl();
}

bool PerformanceTracer::startTracing(HighResDuration maxDuration) {
  return startTracingImpl(maxDuration);
}

bool PerformanceTracer::startTracingImpl(
    std::optional<HighResDuration> maxDuration) {
  std::lock_guard lock(mutex_);

  if (tracingAtomic_) {
    return false;
  }

  tracingAtomic_ = true;

  if (maxDuration && *maxDuration < MIN_VALUE_FOR_MAX_TRACE_DURATION_OPTION) {
    throw std::invalid_argument("maxDuration should be at least 1 second");
  }

  currentTraceStartTime_ = HighResTimeStamp::now();
  currentTraceMaxDuration_ = maxDuration;

  return true;
}

std::optional<std::vector<TraceEvent>> PerformanceTracer::stopTracing() {
  std::vector<TraceEvent> events;

  auto currentTraceEndTime = HighResTimeStamp::now();

  {
    std::lock_guard lock(mutex_);

    if (!tracingAtomic_) {
      return std::nullopt;
    }

    tracingAtomic_ = false;
    performanceMeasureCount_ = 0;

    events = collectEventsAndClearBuffers(currentTraceEndTime);
  }

  auto currentTraceStartTime = currentTraceStartTime_;
  if (currentTraceMaxDuration_ &&
      currentTraceEndTime - *currentTraceMaxDuration_ > currentTraceStartTime) {
    currentTraceStartTime = currentTraceEndTime - *currentTraceMaxDuration_;
  }

  // This is synthetic Trace Event, which should not be represented on a
  // timeline. CDT is not using Profile or ProfileChunk events for determining
  // trace timeline window, this is why trace that only contains JavaScript
  // samples will be displayed as empty. We use these events to avoid that.
  // This could happen for non-bridgeless apps, where Performance interface is
  // not supported and no spec-compliant Event Loop implementation.

  events.emplace_back(TraceEvent{
      .name = "TracingStartedInPage",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'I',
      .ts = currentTraceStartTime,
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
      .args = folly::dynamic::object("data", folly::dynamic::object()),
  });

  events.emplace_back(TraceEvent{
      .name = "ReactNative-TracingStopped",
      .cat = "disabled-by-default-devtools.timeline",
      .ph = 'I',
      .ts = currentTraceEndTime,
      .pid = processId_,
      .tid = oscompat::getCurrentThreadId(),
  });

  currentTraceMaxDuration_ = std::nullopt;
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

  enqueueEvent(TraceEvent{
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

  enqueueEvent(TraceEvent{
      .id = eventId,
      .name = std::string(name),
      .cat = "blink.user_timing",
      .ph = 'b',
      .ts = start,
      .pid = processId_,
      .tid = currentThreadId,
      .args = beginEventArgs,
  });
  enqueueEvent(TraceEvent{
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
  enqueueEvent(TraceEvent{
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

  enqueueEvent(TraceEvent{
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

  enqueueEvent(TraceEvent{
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

#pragma mark - Tracing window methods

/**
 * If a `maxDuration` value is set when starting a trace, we use 2 buffers
 * for events. Each buffer can contain entries for a range up to `maxDuration`.
 * When the current buffer is full, we clear the previous one and we start
 * collecting events in a new buffer, which becomes current.
 *
 * Example:
 *   - Start:
 *     previousBuffer: null, currentBuffer: []
 *   - As entries are added:
 *     previousBuffer: null, currentBuffer: [a, b, c...]
 *   - When now - currentBuffer start time > maxDuration:
 *     previousBuffer: [a, b, c...], currentBuffer: []
 *   - As entries are added:
 *     previousbuffer: [a, b, c...], currentBuffer: [x, y, z...]
 *   - When now - currentBuffer start time > maxDuration:
 *     previousBuffer: [x, y, z...], currentBuffer: []
 *   - When the trace finishes:
 *     We collect all events in both buffers that are still within
 *     `maxDuration`.
 *
 * This way, we ensure we keep all events in the `maxDuration` window, and
 * clearing expired events is trivial (just clearing a vector).
 */

std::vector<TraceEvent> PerformanceTracer::collectEventsAndClearBuffers(
    HighResTimeStamp currentTraceEndTime) {
  std::vector<TraceEvent> events;

  if (currentTraceMaxDuration_) {
    // Collect non-expired entries from the previous buffer
    if (previousBuffer_ != nullptr) {
      collectEventsAndClearBuffer(
          events, *previousBuffer_, currentTraceEndTime);
    }

    collectEventsAndClearBuffer(events, *currentBuffer_, currentTraceEndTime);

    // Reset state.
    currentBuffer_ = &buffer_;
    previousBuffer_ = nullptr;
  } else {
    // Trivial case.
    currentBuffer_->swap(events);
  }

  return events;
}

void PerformanceTracer::collectEventsAndClearBuffer(
    std::vector<TraceEvent>& events,
    std::vector<TraceEvent>& buffer,
    HighResTimeStamp currentTraceEndTime) {
  for (auto&& event : buffer) {
    if (isInTracingWindow(currentTraceEndTime, event.createdAt_)) {
      events.emplace_back(std::move(event));
    }
  }

  buffer.clear();
  buffer.shrink_to_fit();
}

bool PerformanceTracer::isInTracingWindow(
    HighResTimeStamp now,
    HighResTimeStamp timeStampToCheck) const {
  if (!currentTraceMaxDuration_) {
    return true;
  }

  return timeStampToCheck > now - *currentTraceMaxDuration_;
}

void PerformanceTracer::enqueueEvent(TraceEvent&& traceEvent) {
  if (currentTraceMaxDuration_) {
    // Check if the current buffer is "full"
    if (traceEvent.createdAt_ >
        currentBufferStartTime_ + *currentTraceMaxDuration_) {
      // We moved past the current buffer. We need to switch the other buffer as
      // current.
      previousBuffer_ = currentBuffer_;
      currentBuffer_ = currentBuffer_ == &buffer_ ? &altBuffer_ : &buffer_;
      currentBuffer_->clear();
      currentBufferStartTime_ = traceEvent.createdAt_;
    }
  }

  currentBuffer_->emplace_back(std::move(traceEvent));
}

} // namespace facebook::react::jsinspector_modern::tracing

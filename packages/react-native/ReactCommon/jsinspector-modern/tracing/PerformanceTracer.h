/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ConsoleTimeStamp.h"
#include "TraceEvent.h"
#include "TraceEventProfile.h"

#include <react/timing/primitives.h>

#include <folly/dynamic.h>
#include <atomic>
#include <mutex>
#include <optional>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

// TODO: Review how this API is integrated into jsinspector_modern (singleton
// design is copied from earlier FuseboxTracer prototype).

/**
 * [Experimental] An interface for logging performance trace events to the
 * modern debugger server.
 */
class PerformanceTracer {
 public:
  static PerformanceTracer& getInstance();

  /**
   * Starts a tracing session. Returns `false` if already tracing.
   */
  bool startTracing();

  /**
   * Starts a tracing session with a maximum duration (events older than this
   * duration are dropped). Returns `false` if already tracing.
   */
  bool startTracing(HighResDuration maxDuration);

  /**
   * If there is a current tracing session, it stops tracing and returns all
   * collected events. Otherwise, it returns empty.
   */
  std::optional<std::vector<TraceEvent>> stopTracing();

  /**
   * Returns whether the tracer is currently tracing. This can be useful to
   * avoid doing expensive work (like formatting strings) if tracing is not
   * enabled.
   */
  inline bool isTracing() const {
    return tracingAtomic_;
  }

  /**
   * Record a `Performance.mark()` event - a labelled timestamp. If not
   * currently tracing, this is a no-op.
   *
   * See https://w3c.github.io/user-timing/#mark-method.
   */
  void reportMark(
      const std::string_view& name,
      HighResTimeStamp start,
      folly::dynamic&& detail = nullptr);

  /**
   * Record a `Performance.measure()` event - a labelled duration. If not
   * currently tracing, this is a no-op.
   *
   * See https://w3c.github.io/user-timing/#measure-method.
   */
  void reportMeasure(
      const std::string_view& name,
      HighResTimeStamp start,
      HighResDuration duration,
      folly::dynamic&& detail = nullptr);

  /**
   * Record a "TimeStamp" Trace Event - a labelled entry on Performance
   * timeline. The only required argument is `name`. Optional arguments, if not
   * provided, won't be recorded in the serialized Trace Event.
   * @see
   https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp
   */
  void reportTimeStamp(
      std::string name,
      std::optional<ConsoleTimeStampEntry> start = std::nullopt,
      std::optional<ConsoleTimeStampEntry> end = std::nullopt,
      std::optional<std::string> trackName = std::nullopt,
      std::optional<std::string> trackGroup = std::nullopt,
      std::optional<ConsoleTimeStampColor> color = std::nullopt);

  /**
   * Record an Event Loop tick, which will be represented as an Event Loop task
   * on a timeline view and grouped with JavaScript samples.
   */
  void reportEventLoopTask(HighResTimeStamp start, HighResTimeStamp end);

  /**
   * Record Microtasks phase of the Event Loop tick. Will be represented as a
   * "Run Microtasks" block under a task.
   */
  void reportEventLoopMicrotasks(HighResTimeStamp start, HighResTimeStamp end);

  /**
   * Creates "Profile" Trace Event.
   *
   * Can be serialized to JSON with TraceEventSerializer::serialize.
   */
  static TraceEvent constructRuntimeProfileTraceEvent(
      RuntimeProfileId profileId,
      ProcessId processId,
      ThreadId threadId,
      HighResTimeStamp profileTimestamp);

  /**
   * Creates "ProfileChunk" Trace Event.
   *
   * Can be serialized to JSON with TraceEventSerializer::serialize.
   */
  static TraceEvent constructRuntimeProfileChunkTraceEvent(
      RuntimeProfileId profileId,
      ProcessId processId,
      ProcessId threadId,
      HighResTimeStamp chunkTimestamp,
      TraceEventProfileChunk&& traceEventProfileChunk);

 private:
  PerformanceTracer();
  PerformanceTracer(const PerformanceTracer&) = delete;
  PerformanceTracer& operator=(const PerformanceTracer&) = delete;
  ~PerformanceTracer() = default;

#pragma mark - Internal trace event types

  struct PerformanceTracerEventEventLoopTask {
    HighResTimeStamp start;
    HighResTimeStamp end;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventEventLoopMicrotask {
    HighResTimeStamp start;
    HighResTimeStamp end;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventMark {
    std::string name;
    HighResTimeStamp start;
    folly::dynamic detail;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventMeasure {
    std::string name;
    HighResTimeStamp start;
    HighResDuration duration;
    folly::dynamic detail;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventTimeStamp {
    std::string name;
    std::optional<ConsoleTimeStampEntry> start;
    std::optional<ConsoleTimeStampEntry> end;
    std::optional<std::string> trackName;
    std::optional<std::string> trackGroup;
    std::optional<ConsoleTimeStampColor> color;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  using PerformanceTracerEvent = std::variant<
      PerformanceTracerEventTimeStamp,
      PerformanceTracerEventEventLoopTask,
      PerformanceTracerEventEventLoopMicrotask,
      PerformanceTracerEventMark,
      PerformanceTracerEventMeasure>;

#pragma mark - Private fields and methods

  const ProcessId processId_;

  /**
   * The flag is atomic in order to enable any thread to read it (via
   * isTracing()) without holding the mutex.
   * Within this class, both reads and writes MUST be protected by the mutex to
   * avoid false positives and data races.
   */
  std::atomic<bool> tracingAtomic_{false};
  /**
   * The counter for recorded User Timing "measure" events.
   * Used for generating unique IDs for each measure event inside a specific
   * Trace.
   * Does not need to be atomic, because it is always accessed within the mutex
   * lock.
   */
  uint32_t performanceMeasureCount_{0};

  HighResTimeStamp currentTraceStartTime_;

  std::optional<HighResDuration> currentTraceMaxDuration_;

  std::vector<PerformanceTracerEvent> buffer_;

  // These fields are only used when setting a max duration on the trace.
  std::vector<PerformanceTracerEvent> altBuffer_;
  std::vector<PerformanceTracerEvent>* currentBuffer_ = &buffer_;
  std::vector<PerformanceTracerEvent>* previousBuffer_{};
  HighResTimeStamp currentBufferStartTime_;

  /**
   * Protects data members of this class for concurrent access, including
   * the tracingAtomic_, in order to eliminate potential "logic" races.
   */
  std::mutex mutex_;

  bool startTracingImpl(
      std::optional<HighResDuration> maxDuration = std::nullopt);

  std::vector<TraceEvent> collectEventsAndClearBuffers(
      HighResTimeStamp currentTraceEndTime);
  void collectEventsAndClearBuffer(
      std::vector<TraceEvent>& events,
      std::vector<PerformanceTracerEvent>& buffer,
      HighResTimeStamp currentTraceEndTime);
  bool isInTracingWindow(
      HighResTimeStamp now,
      HighResTimeStamp timeStampToCheck) const;
  void enqueueEvent(PerformanceTracerEvent&& event);

  HighResTimeStamp getCreatedAt(const PerformanceTracerEvent& event) const;

  void enqueueTraceEventsFromPerformanceTracerEvent(
      std::vector<TraceEvent>& events,
      PerformanceTracerEvent&& event);
};

} // namespace facebook::react::jsinspector_modern::tracing

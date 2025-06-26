/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CdpTracing.h"
#include "ConsoleTimeStamp.h"
#include "TraceEvent.h"
#include "TraceEventProfile.h"

#include <react/timing/primitives.h>

#include <folly/dynamic.h>
#include <atomic>
#include <functional>
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
   * Mark trace session as started. Returns `false` if already tracing.
   */
  bool startTracing();

  /**
   * Mark trace session as stopped. Returns `false` if wasn't tracing.
   */
  bool stopTracing();

  /**
   * Returns whether the tracer is currently tracing. This can be useful to
   * avoid doing expensive work (like formatting strings) if tracing is not
   * enabled.
   */
  inline bool isTracing() const {
    return tracingAtomic_;
  }

  /**
   * Flush out buffered CDP Trace Events using the given callback.
   */
  void collectEvents(
      const std::function<void(const folly::dynamic& eventsChunk)>&
          resultCallback,
      uint16_t chunkSize);
  /**
   * Record a `Performance.mark()` event - a labelled timestamp. If not
   * currently tracing, this is a no-op.
   *
   * See https://w3c.github.io/user-timing/#mark-method.
   */
  void reportMark(const std::string_view& name, HighResTimeStamp start);

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
      const std::optional<DevToolsTrackEntryPayload>& trackMetadata);

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
   * Record a corresponding Trace Event for OS-level process.
   */
  void reportProcess(uint64_t id, const std::string& name);

  /**
   * Record a corresponding Trace Event for OS-level thread.
   */
  void reportThread(uint64_t id, const std::string& name);

  /**
   * Should only be called from the JavaScript thread, will buffer metadata
   * Trace Event.
   */
  void reportJavaScriptThread();

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
   * Create and serialize Profile Trace Event.
   * \return serialized Trace Event that represents a Profile for CDT.
   */
  folly::dynamic getSerializedRuntimeProfileTraceEvent(
      uint64_t threadId,
      uint16_t profileId,
      HighResTimeStamp profileTimestamp);

  /**
   * Create and serialize ProfileChunk Trace Event.
   * \return serialized Trace Event that represents a Profile Chunk for CDT.
   */
  folly::dynamic getSerializedRuntimeProfileChunkTraceEvent(
      uint16_t profileId,
      uint64_t threadId,
      HighResTimeStamp chunkTimestamp,
      const TraceEventProfileChunk& traceEventProfileChunk);

 private:
  PerformanceTracer();
  PerformanceTracer(const PerformanceTracer&) = delete;
  PerformanceTracer& operator=(const PerformanceTracer&) = delete;
  ~PerformanceTracer() = default;

  /**
   * Serialize a TraceEvent into a folly::dynamic object.
   * \param event rvalue reference to the TraceEvent object.
   * \return folly::dynamic object that represents a serialized into JSON Trace
   * Event for CDP.
   */
  folly::dynamic serializeTraceEvent(TraceEvent&& event) const;

  const uint64_t processId_;

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

  std::vector<TraceEvent> buffer_;
  /**
   * Protects data members of this class for concurrent access, including
   * the tracingAtomic_, in order to eliminate potential "logic" races.
   */
  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern::tracing

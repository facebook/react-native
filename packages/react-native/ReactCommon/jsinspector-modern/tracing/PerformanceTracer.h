/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CdpTracing.h"
#include "TraceEvent.h"
#include "TraceEventProfile.h"

#include <folly/dynamic.h>

#include <functional>
#include <mutex>
#include <optional>
#include <vector>

namespace facebook::react::jsinspector_modern {

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
  bool isTracing() const {
    // This is not thread safe but it's only a performance optimization. The
    // call to report marks and measures is already thread safe.
    return tracing_;
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
  void reportMark(const std::string_view& name, uint64_t start);

  /**
   * Record a `Performance.measure()` event - a labelled duration. If not
   * currently tracing, this is a no-op.
   *
   * See https://w3c.github.io/user-timing/#measure-method.
   */
  void reportMeasure(
      const std::string_view& name,
      uint64_t start,
      uint64_t duration,
      const std::optional<DevToolsTrackEntryPayload>& trackMetadata);

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
  void reportEventLoopTask(uint64_t start, uint64_t end);

  /**
   * Record Microtasks phase of the Event Loop tick. Will be represented as a
   * "Run Microtasks" block under a task.
   */
  void reportEventLoopMicrotasks(uint64_t start, uint64_t end);

  /**
   * Create and serialize Profile Trace Event.
   * \return serialized Trace Event that represents a Profile for CDT.
   */
  folly::dynamic getSerializedRuntimeProfileTraceEvent(
      uint64_t threadId,
      uint16_t profileId,
      uint64_t eventUnixTimestamp);

  /**
   * Create and serialize ProfileChunk Trace Event.
   * \return serialized Trace Event that represents a Profile Chunk for CDT.
   */
  folly::dynamic getSerializedRuntimeProfileChunkTraceEvent(
      uint16_t profileId,
      uint64_t threadId,
      uint64_t eventUnixTimestamp,
      const tracing::TraceEventProfileChunk& traceEventProfileChunk);

 private:
  PerformanceTracer();
  PerformanceTracer(const PerformanceTracer&) = delete;
  PerformanceTracer& operator=(const PerformanceTracer&) = delete;
  ~PerformanceTracer() = default;

  folly::dynamic serializeTraceEvent(const TraceEvent& event) const;

  bool tracing_{false};
  uint64_t processId_;
  uint32_t performanceMeasureCount_{0};
  std::vector<TraceEvent> buffer_;
  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CdpTracing.h"

#include <folly/dynamic.h>

#include <functional>
#include <optional>
#include <unordered_map>
#include <vector>

namespace facebook::react::jsinspector_modern {

// TODO: Review how this API is integrated into jsinspector_modern (singleton
// design is copied from earlier FuseboxTracer prototype).

namespace {

/**
 * A trace event to send to the debugger frontend, as defined by the Trace Event
 * Format.
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview?pli=1&tab=t.0#heading=h.yr4qxyxotyw
 */
struct TraceEvent {
  /** The name of the event, as displayed in the Trace Viewer. */
  std::string name;

  /**
   * A comma separated list of categories for the event, configuring how
   * events are shown in the Trace Viewer UI.
   */
  std::string cat;

  /**
   * The event type. This is a single character which changes depending on the
   * type of event being output. See
   * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview?pli=1&tab=t.0#heading=h.puwqg050lyuy
   */
  char ph;

  /** The tracing clock timestamp of the event, in microseconds (µs). */
  uint64_t ts;

  /** The process ID for the process that output this event. */
  uint64_t pid;

  /** The thread ID for the process that output this event. */
  uint64_t tid;

  /** Any arguments provided for the event. */
  folly::dynamic args = folly::dynamic::object();

  /**
   * The duration of the event, in microseconds (µs). Only applicable to
   * complete events ("ph": "X").
   */
  std::optional<uint64_t> dur;
};

} // namespace

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
   * End tracing, and output chunked CDP trace events using the given
   * callback.
   *
   * Returns `false` if tracing was not started.
   */
  bool stopTracingAndCollectEvents(
      const std::function<void(const folly::dynamic& eventsChunk)>&
          resultCallback);

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

 private:
  PerformanceTracer() = default;
  PerformanceTracer(const PerformanceTracer&) = delete;
  PerformanceTracer& operator=(const PerformanceTracer&) = delete;
  ~PerformanceTracer() = default;

  folly::dynamic serializeTraceEvent(TraceEvent event) const;

  bool tracing_{false};
  std::unordered_map<std::string, uint64_t> customTrackIdMap_;
  std::vector<TraceEvent> buffer_;
  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern

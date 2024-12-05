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
#include <vector>

namespace facebook::react::jsinspector_modern {

// TODO: Review how this API is integrated into jsinspector_modern (singleton
// design is copied from earlier FuseboxTracer prototype).

enum class TraceEventType {
  MARK = 1,
  MEASURE = 2,
};

struct TraceEvent {
  TraceEventType type;
  std::string name;
  uint64_t start;
  uint64_t end;
  std::string track;
};

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
   * Record a new trace event. If not currently tracing, this is a no-op.
   */
  void addEvent(
      const std::string_view& name,
      uint64_t start,
      uint64_t end,
      const std::optional<DevToolsTrackEntryPayload>& trackMetadata);

 private:
  PerformanceTracer() = default;
  PerformanceTracer(const PerformanceTracer&) = delete;
  PerformanceTracer& operator=(const PerformanceTracer&) = delete;
  ~PerformanceTracer() = default;

  bool tracing_{false};
  std::vector<TraceEvent> buffer_;
  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern

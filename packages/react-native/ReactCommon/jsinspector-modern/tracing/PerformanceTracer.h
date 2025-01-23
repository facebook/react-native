/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CdpTracing.h"
#include "TraceEvent.h"

#include <folly/dynamic.h>

#include <functional>
#include <optional>
#include <unordered_map>
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

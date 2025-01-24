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
   * Mark trace session as stopped. Returns `false` if wasn't tracing.
   */
  bool stopTracing();

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

 private:
  PerformanceTracer() = default;
  PerformanceTracer(const PerformanceTracer&) = delete;
  PerformanceTracer& operator=(const PerformanceTracer&) = delete;
  ~PerformanceTracer() = default;

  folly::dynamic serializeTraceEvent(TraceEvent event) const;

  bool tracing_{false};
  uint32_t performanceMeasureCount_{0};
  std::vector<TraceEvent> buffer_;
  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern

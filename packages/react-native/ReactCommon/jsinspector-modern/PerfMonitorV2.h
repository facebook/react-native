/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern {

class HostTargetDelegate;

/**
 * See https://web.dev/articles/inp#good-score.
 */
enum class InteractionResponsivenessScore : int32_t {
  Good = 0,
  NeedsImprovement = 1,
  Poor = 2
};

struct LongTaskPayload {
  uint16_t startTime;
  uint16_t duration;
  InteractionResponsivenessScore responsivenessScore;
  uint16_t ttl;
};

struct PerfMonitorUpdateRequest {
  LongTaskPayload activeInteraction;
};

/**
 * [Experimental] Utility to handle performance metrics updates received from
 * the runtime and forward update events to the V2 Perf Monitor UI.
 */
class PerfMonitorUpdateHandler {
 public:
  explicit PerfMonitorUpdateHandler(HostTargetDelegate& delegate)
      : delegate_(delegate) {}

  /**
   * Handle a new "__chromium_devtools_metrics_reporter" message.
   */
  void handlePerfMetricsUpdate(const std::string& message);

 private:
  HostTargetDelegate& delegate_;
  std::optional<LongTaskPayload> lastEvent_;

  bool shouldOverrideLastEvent(const LongTaskPayload& newInteraction);
};

} // namespace facebook::react::jsinspector_modern

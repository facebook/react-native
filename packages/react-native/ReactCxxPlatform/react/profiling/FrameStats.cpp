/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FrameStats.h"
#include "TimeSeries.h"

#include <iomanip>

#include <glog/logging.h>

namespace facebook::react {

static constexpr double FRAME_STATS_LOGGING_INTERVAL_MS = 1000.0;
static constexpr int FRAME_STATS_SERIES_CAPACITY = 256;

struct FrameStatsLogger {
  bool enablePrinting{false};
  double lastLoggedTimeMs{0.0};
  TimeSeries frameTimeSeries{FRAME_STATS_SERIES_CAPACITY};
};

static FrameStatsLogger& getFrameStatsLogger() {
  static FrameStatsLogger s_FrameStatsLogger;
  return s_FrameStatsLogger;
}

void enableFrameStatsPrinting(bool enable) {
  getFrameStatsLogger().enablePrinting = enable;
}
void logFrameStats(double timeStampMs, double durationMs) {
  auto& logger = getFrameStatsLogger();
  logger.frameTimeSeries.appendValue(timeStampMs, durationMs);

  if (logger.lastLoggedTimeMs == 0.0) {
    logger.lastLoggedTimeMs = timeStampMs;
  }

  if (logger.enablePrinting &&
      timeStampMs >=
          logger.lastLoggedTimeMs + FRAME_STATS_LOGGING_INTERVAL_MS) {
    const auto& timeSeries = logger.frameTimeSeries;
    const auto startTime = timeStampMs - FRAME_STATS_LOGGING_INTERVAL_MS;
    const auto endTime = timeStampMs;

    const int fps = timeSeries.getCount(startTime, endTime) * 1000.0 /
        FRAME_STATS_LOGGING_INTERVAL_MS;

    const auto frameTimeAvg = timeSeries.getAverage(startTime, endTime);
    const auto frameTimeMax = timeSeries.getMax(startTime, endTime);
    const auto frameTimeMin = timeSeries.getMin(startTime, endTime);
    const auto frameTimeP50 = timeSeries.getPercentile(50, startTime, endTime);
    const auto frameTimeP75 = timeSeries.getPercentile(75, startTime, endTime);
    const auto frameTimeP95 = timeSeries.getPercentile(95, startTime, endTime);

    LOG(INFO) << std::fixed << std::setprecision(2) << std::setfill(' ')
              << std::left << "[FRAME STATS] FPS=" << std::setw(2) << fps
              << " frame(ms): avg=" << std::setw(5) << std::left << frameTimeAvg
              << " min=" << std::setw(5) << std::left << frameTimeMin
              << " p50=" << std::setw(5) << std::left << frameTimeP50
              << " p75=" << std::setw(5) << std::left << frameTimeP75
              << " p95=" << std::setw(5) << std::left << frameTimeP95
              << " max=" << std::setw(5) << std::left << frameTimeMax;

    logger.lastLoggedTimeMs = timeStampMs;
  }
}

} // namespace facebook::react

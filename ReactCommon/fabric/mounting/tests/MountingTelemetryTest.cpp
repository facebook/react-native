/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <chrono>
#include <thread>

#include <gtest/gtest.h>

#include <react/mounting/MountingTelemetry.h>
#include <react/utils/Telemetry.h>

using namespace facebook::react;

#define EXPECT_EQ_WITH_THRESHOLD(a, b, threshold) \
  EXPECT_TRUE((a >= b - threshold) && (a <= b + threshold))

TEST(MountingTelemetryTest, timepoints) {
  auto threshold = int64_t{100};

  auto timepointA = telemetryTimePointNow();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  auto timepointB = telemetryTimePointNow();

  auto duration = telemetryDurationToMilliseconds(timepointB - timepointA);

  EXPECT_EQ_WITH_THRESHOLD(duration, 100, threshold);
}

TEST(MountingTelemetryTest, normalUseCase) {
  auto threshold = int64_t{100};
  auto telemetry = MountingTelemetry{};

  telemetry.willCommit();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  telemetry.willLayout();
  std::this_thread::sleep_for(std::chrono::milliseconds(200));
  telemetry.didLayout();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  telemetry.didCommit();

  std::this_thread::sleep_for(std::chrono::milliseconds(300));

  telemetry.willMount();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  telemetry.didMount();

  auto commitDuration = telemetryDurationToMilliseconds(
      telemetry.getCommitEndTime() - telemetry.getCommitStartTime());
  auto layoutDuration = telemetryDurationToMilliseconds(
      telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime());
  auto mountDuration = telemetryDurationToMilliseconds(
      telemetry.getMountEndTime() - telemetry.getMountStartTime());

  EXPECT_EQ_WITH_THRESHOLD(commitDuration, 400, threshold * 2);
  EXPECT_EQ_WITH_THRESHOLD(layoutDuration, 200, threshold);
  EXPECT_EQ_WITH_THRESHOLD(mountDuration, 100, threshold);
}

TEST(MountingTelemetryTest, abnormalUseCases) {
  // Calling `did` before `will` should crash.
  EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.didDiff();
      },
      "diffStartTime_");

  EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.didCommit();
      },
      "commitStartTime_");

  EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.didMount();
      },
      "mountStartTime_");

  // Getting `start` *or* `end` timepoints before a pair of `will` and `did`
  // should crash.
  EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitStartTime();
      },
      "commitEndTime_");

  EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitEndTime();
      },
      "commitEndTime_");
}

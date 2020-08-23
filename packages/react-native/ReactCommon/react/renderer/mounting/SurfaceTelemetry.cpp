/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceTelemetry.h"

#include <algorithm>

namespace facebook {
namespace react {

void SurfaceTelemetry::incorporate(
    MountingTelemetry const &telemetry,
    int numberOfMutations) {
  layoutTime_ += telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime();
  commitTime_ += telemetry.getCommitEndTime() - telemetry.getCommitStartTime();
  diffTime_ += telemetry.getDiffEndTime() - telemetry.getDiffStartTime();
  mountTime_ += telemetry.getMountEndTime() - telemetry.getMountStartTime();

  numberOfTransactions_++;
  numberOfMutations_ += numberOfMutations;

  while (recentCommitTelemetries_.size() >=
         kMaxNumberOfRecordedCommitTelemetries) {
    recentCommitTelemetries_.erase(recentCommitTelemetries_.begin());
  }

  recentCommitTelemetries_.push_back(telemetry);
}

TelemetryDuration SurfaceTelemetry::getLayoutTime() const {
  return layoutTime_;
}

TelemetryDuration SurfaceTelemetry::getCommitTime() const {
  return commitTime_;
}

TelemetryDuration SurfaceTelemetry::getDiffTime() const {
  return diffTime_;
}

TelemetryDuration SurfaceTelemetry::getMountTime() const {
  return mountTime_;
}

int SurfaceTelemetry::getNumberOfTransactions() const {
  return numberOfTransactions_;
}

int SurfaceTelemetry::getNumberOfMutations() const {
  return numberOfMutations_;
}

std::vector<MountingTelemetry> SurfaceTelemetry::getRecentCommitTelemetries()
    const {
  auto result = std::vector<MountingTelemetry>{};
  result.reserve(recentCommitTelemetries_.size());
  std::copy(
      recentCommitTelemetries_.begin(),
      recentCommitTelemetries_.end(),
      std::back_inserter(result));
  return result;
}

} // namespace react
} // namespace facebook

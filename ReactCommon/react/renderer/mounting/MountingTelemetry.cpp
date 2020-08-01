/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingTelemetry.h"

#include <cassert>

namespace facebook {
namespace react {

void MountingTelemetry::willCommit() {
  assert(commitStartTime_ == kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ == kTelemetryUndefinedTimePoint);
  commitStartTime_ = telemetryTimePointNow();
  commitNumber_++;
}

void MountingTelemetry::didCommit() {
  assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ == kTelemetryUndefinedTimePoint);
  commitEndTime_ = telemetryTimePointNow();
}

void MountingTelemetry::willDiff() {
  assert(diffStartTime_ == kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ == kTelemetryUndefinedTimePoint);
  diffStartTime_ = telemetryTimePointNow();
}

void MountingTelemetry::didDiff() {
  assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ == kTelemetryUndefinedTimePoint);
  diffEndTime_ = telemetryTimePointNow();
}

void MountingTelemetry::willLayout() {
  assert(layoutStartTime_ == kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ == kTelemetryUndefinedTimePoint);
  layoutStartTime_ = telemetryTimePointNow();
}

void MountingTelemetry::didLayout() {
  assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ == kTelemetryUndefinedTimePoint);
  layoutEndTime_ = telemetryTimePointNow();
}

void MountingTelemetry::willMount() {
  assert(mountStartTime_ == kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ == kTelemetryUndefinedTimePoint);
  mountStartTime_ = telemetryTimePointNow();
}

void MountingTelemetry::didMount() {
  assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ == kTelemetryUndefinedTimePoint);
  mountEndTime_ = telemetryTimePointNow();
}

TelemetryTimePoint MountingTelemetry::getDiffStartTime() const {
  assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ != kTelemetryUndefinedTimePoint);
  return diffStartTime_;
}

TelemetryTimePoint MountingTelemetry::getDiffEndTime() const {
  assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ != kTelemetryUndefinedTimePoint);
  return diffEndTime_;
}

TelemetryTimePoint MountingTelemetry::getCommitStartTime() const {
  assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ != kTelemetryUndefinedTimePoint);
  return commitStartTime_;
}

TelemetryTimePoint MountingTelemetry::getCommitEndTime() const {
  assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ != kTelemetryUndefinedTimePoint);
  return commitEndTime_;
}

TelemetryTimePoint MountingTelemetry::getLayoutStartTime() const {
  assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ != kTelemetryUndefinedTimePoint);
  return layoutStartTime_;
}

TelemetryTimePoint MountingTelemetry::getLayoutEndTime() const {
  assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ != kTelemetryUndefinedTimePoint);
  return layoutEndTime_;
}

TelemetryTimePoint MountingTelemetry::getMountStartTime() const {
  assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ != kTelemetryUndefinedTimePoint);
  return mountStartTime_;
}

TelemetryTimePoint MountingTelemetry::getMountEndTime() const {
  assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ != kTelemetryUndefinedTimePoint);
  return mountEndTime_;
}

int MountingTelemetry::getCommitNumber() const {
  return commitNumber_;
}

} // namespace react
} // namespace facebook

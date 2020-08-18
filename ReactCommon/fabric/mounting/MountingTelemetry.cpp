/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingTelemetry.h"

#include <cassert>

#include <react/utils/TimeUtils.h>

namespace facebook {
namespace react {

void MountingTelemetry::willCommit() {
  assert(commitStartTime_ == kUndefinedTime);
  assert(commitEndTime_ == kUndefinedTime);
  commitStartTime_ = monotonicTimeInMilliseconds();
  commitNumber_++;
}

void MountingTelemetry::didCommit() {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ == kUndefinedTime);
  commitEndTime_ = monotonicTimeInMilliseconds();
}

void MountingTelemetry::willDiff() {
  assert(diffStartTime_ == kUndefinedTime);
  assert(diffEndTime_ == kUndefinedTime);
  diffStartTime_ = monotonicTimeInMilliseconds();
}

void MountingTelemetry::didDiff() {
  assert(diffStartTime_ != kUndefinedTime);
  assert(diffEndTime_ == kUndefinedTime);
  diffEndTime_ = monotonicTimeInMilliseconds();
}

void MountingTelemetry::willLayout() {
  assert(layoutStartTime_ == kUndefinedTime);
  assert(layoutEndTime_ == kUndefinedTime);
  layoutStartTime_ = monotonicTimeInMilliseconds();
}

void MountingTelemetry::didLayout() {
  assert(layoutStartTime_ != kUndefinedTime);
  assert(layoutEndTime_ == kUndefinedTime);
  layoutEndTime_ = monotonicTimeInMilliseconds();
}

void MountingTelemetry::willMount() {
  assert(mountStartTime_ == kUndefinedTime);
  assert(mountEndTime_ == kUndefinedTime);
  mountStartTime_ = monotonicTimeInMilliseconds();
}

void MountingTelemetry::didMount() {
  assert(mountStartTime_ != kUndefinedTime);
  assert(mountEndTime_ == kUndefinedTime);
  mountEndTime_ = monotonicTimeInMilliseconds();
}

int64_t MountingTelemetry::getDiffStartTime() const {
  assert(diffStartTime_ != kUndefinedTime);
  assert(diffEndTime_ != kUndefinedTime);
  return diffStartTime_;
}

int64_t MountingTelemetry::getDiffEndTime() const {
  assert(diffStartTime_ != kUndefinedTime);
  assert(diffEndTime_ != kUndefinedTime);
  return diffEndTime_;
}

int64_t MountingTelemetry::getCommitNumber() const {
  return commitNumber_;
}

int64_t MountingTelemetry::getCommitStartTime() const {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ != kUndefinedTime);
  return commitStartTime_;
}

int64_t MountingTelemetry::getCommitEndTime() const {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ != kUndefinedTime);
  return commitEndTime_;
}

int64_t MountingTelemetry::getLayoutStartTime() const {
  assert(layoutStartTime_ != kUndefinedTime);
  assert(layoutEndTime_ != kUndefinedTime);
  return layoutStartTime_;
}

int64_t MountingTelemetry::getLayoutEndTime() const {
  assert(layoutStartTime_ != kUndefinedTime);
  assert(layoutEndTime_ != kUndefinedTime);
  return layoutEndTime_;
}

int64_t MountingTelemetry::getMountStartTime() const {
  assert(mountStartTime_ != kUndefinedTime);
  assert(mountEndTime_ != kUndefinedTime);
  return mountStartTime_;
}

int64_t MountingTelemetry::getMountEndTime() const {
  assert(mountStartTime_ != kUndefinedTime);
  assert(mountEndTime_ != kUndefinedTime);
  return mountEndTime_;
}

} // namespace react
} // namespace facebook

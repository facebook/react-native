/**
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
  commitStartTime_ = getTime();
  commitNumber_++;
}

void MountingTelemetry::didCommit() {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ == kUndefinedTime);
  commitEndTime_ = getTime();
}

void MountingTelemetry::willDiff() {
  assert(diffStartTime_ == kUndefinedTime);
  assert(diffEndTime_ == kUndefinedTime);
  diffStartTime_ = getTime();
}

void MountingTelemetry::didDiff() {
  assert(diffStartTime_ != kUndefinedTime);
  assert(diffEndTime_ == kUndefinedTime);
  diffEndTime_ = getTime();
}

void MountingTelemetry::willLayout() {
  assert(layoutStartTime_ == kUndefinedTime);
  assert(layoutEndTime_ == kUndefinedTime);
  layoutStartTime_ = getTime();
}

void MountingTelemetry::didLayout() {
  assert(layoutStartTime_ != kUndefinedTime);
  assert(layoutEndTime_ == kUndefinedTime);
  layoutEndTime_ = getTime();
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

} // namespace react
} // namespace facebook

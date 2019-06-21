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
}

void MountingTelemetry::didCommit() {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ == kUndefinedTime);
  commitEndTime_ = getTime();
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

int64_t MountingTelemetry::getCommitTime() const {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ != kUndefinedTime);
  return commitEndTime_ - commitStartTime_;
}

int64_t MountingTelemetry::getLayoutTime() const {
  assert(layoutStartTime_ != kUndefinedTime);
  assert(layoutEndTime_ != kUndefinedTime);
  return layoutEndTime_ - layoutStartTime_;
}

int64_t MountingTelemetry::getCommitStartTime() const {
  assert(commitStartTime_ != kUndefinedTime);
  assert(commitEndTime_ != kUndefinedTime);
  return commitStartTime_;
}

} // namespace react
} // namespace facebook

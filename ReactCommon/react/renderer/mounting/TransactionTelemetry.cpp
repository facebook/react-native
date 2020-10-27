/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TransactionTelemetry.h"

#include <cassert>

namespace facebook {
namespace react {

thread_local TransactionTelemetry *threadLocalTransactionTelemetry = nullptr;

TransactionTelemetry *TransactionTelemetry::threadLocalTelemetry() {
  return threadLocalTransactionTelemetry;
}

void TransactionTelemetry::setAsThreadLocal() {
  threadLocalTransactionTelemetry = this;
}

void TransactionTelemetry::unsetAsThreadLocal() {
  threadLocalTransactionTelemetry = nullptr;
}

void TransactionTelemetry::willCommit() {
  assert(commitStartTime_ == kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ == kTelemetryUndefinedTimePoint);
  commitStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didCommit() {
  assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ == kTelemetryUndefinedTimePoint);
  commitEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willDiff() {
  assert(diffStartTime_ == kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ == kTelemetryUndefinedTimePoint);
  diffStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didDiff() {
  assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ == kTelemetryUndefinedTimePoint);
  diffEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willLayout() {
  assert(layoutStartTime_ == kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ == kTelemetryUndefinedTimePoint);
  layoutStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didMeasureText() {
  numberOfTextMeasurements_++;
}

void TransactionTelemetry::didLayout() {
  assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ == kTelemetryUndefinedTimePoint);
  layoutEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willMount() {
  assert(mountStartTime_ == kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ == kTelemetryUndefinedTimePoint);
  mountStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didMount() {
  assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ == kTelemetryUndefinedTimePoint);
  mountEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::setRevisionNumber(int revisionNumber) {
  revisionNumber_ = revisionNumber;
}

TelemetryTimePoint TransactionTelemetry::getDiffStartTime() const {
  assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ != kTelemetryUndefinedTimePoint);
  return diffStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getDiffEndTime() const {
  assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  assert(diffEndTime_ != kTelemetryUndefinedTimePoint);
  return diffEndTime_;
}

TelemetryTimePoint TransactionTelemetry::getCommitStartTime() const {
  assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ != kTelemetryUndefinedTimePoint);
  return commitStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getCommitEndTime() const {
  assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  assert(commitEndTime_ != kTelemetryUndefinedTimePoint);
  return commitEndTime_;
}

TelemetryTimePoint TransactionTelemetry::getLayoutStartTime() const {
  assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ != kTelemetryUndefinedTimePoint);
  return layoutStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getLayoutEndTime() const {
  assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  assert(layoutEndTime_ != kTelemetryUndefinedTimePoint);
  return layoutEndTime_;
}

TelemetryTimePoint TransactionTelemetry::getMountStartTime() const {
  assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ != kTelemetryUndefinedTimePoint);
  return mountStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getMountEndTime() const {
  assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  assert(mountEndTime_ != kTelemetryUndefinedTimePoint);
  return mountEndTime_;
}

int TransactionTelemetry::getNumberOfTextMeasurements() const {
  return numberOfTextMeasurements_;
}

int TransactionTelemetry::getRevisionNumber() const {
  return revisionNumber_;
}

} // namespace react
} // namespace facebook

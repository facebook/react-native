/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TransactionTelemetry.h"

#include <react/debug/react_native_assert.h>

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
  react_native_assert(commitStartTime_ == kTelemetryUndefinedTimePoint);
  react_native_assert(commitEndTime_ == kTelemetryUndefinedTimePoint);
  commitStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didCommit() {
  react_native_assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(commitEndTime_ == kTelemetryUndefinedTimePoint);
  commitEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willDiff() {
  react_native_assert(diffStartTime_ == kTelemetryUndefinedTimePoint);
  react_native_assert(diffEndTime_ == kTelemetryUndefinedTimePoint);
  diffStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didDiff() {
  react_native_assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(diffEndTime_ == kTelemetryUndefinedTimePoint);
  diffEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willLayout() {
  react_native_assert(layoutStartTime_ == kTelemetryUndefinedTimePoint);
  react_native_assert(layoutEndTime_ == kTelemetryUndefinedTimePoint);
  layoutStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willMeasureText() {
  react_native_assert(
      lastTextMeasureStartTime_ == kTelemetryUndefinedTimePoint);
  lastTextMeasureStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didMeasureText() {
  numberOfTextMeasurements_++;
  react_native_assert(
      lastTextMeasureStartTime_ != kTelemetryUndefinedTimePoint);
  textMeasureTime_ += telemetryTimePointNow() - lastTextMeasureStartTime_;
  lastTextMeasureStartTime_ = kTelemetryUndefinedTimePoint;
}

void TransactionTelemetry::didLayout() {
  react_native_assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(layoutEndTime_ == kTelemetryUndefinedTimePoint);
  layoutEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::willMount() {
  react_native_assert(mountStartTime_ == kTelemetryUndefinedTimePoint);
  react_native_assert(mountEndTime_ == kTelemetryUndefinedTimePoint);
  mountStartTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::didMount() {
  react_native_assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(mountEndTime_ == kTelemetryUndefinedTimePoint);
  mountEndTime_ = telemetryTimePointNow();
}

void TransactionTelemetry::setRevisionNumber(int revisionNumber) {
  revisionNumber_ = revisionNumber;
}

TelemetryTimePoint TransactionTelemetry::getDiffStartTime() const {
  react_native_assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(diffEndTime_ != kTelemetryUndefinedTimePoint);
  return diffStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getDiffEndTime() const {
  react_native_assert(diffStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(diffEndTime_ != kTelemetryUndefinedTimePoint);
  return diffEndTime_;
}

TelemetryTimePoint TransactionTelemetry::getCommitStartTime() const {
  react_native_assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(commitEndTime_ != kTelemetryUndefinedTimePoint);
  return commitStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getCommitEndTime() const {
  react_native_assert(commitStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(commitEndTime_ != kTelemetryUndefinedTimePoint);
  return commitEndTime_;
}

TelemetryTimePoint TransactionTelemetry::getLayoutStartTime() const {
  react_native_assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(layoutEndTime_ != kTelemetryUndefinedTimePoint);
  return layoutStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getLayoutEndTime() const {
  react_native_assert(layoutStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(layoutEndTime_ != kTelemetryUndefinedTimePoint);
  return layoutEndTime_;
}

TelemetryTimePoint TransactionTelemetry::getMountStartTime() const {
  react_native_assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(mountEndTime_ != kTelemetryUndefinedTimePoint);
  return mountStartTime_;
}

TelemetryTimePoint TransactionTelemetry::getMountEndTime() const {
  react_native_assert(mountStartTime_ != kTelemetryUndefinedTimePoint);
  react_native_assert(mountEndTime_ != kTelemetryUndefinedTimePoint);
  return mountEndTime_;
}

TelemetryDuration TransactionTelemetry::getTextMeasureTime() const {
  return textMeasureTime_;
}

int TransactionTelemetry::getNumberOfTextMeasurements() const {
  return numberOfTextMeasurements_;
}

int TransactionTelemetry::getRevisionNumber() const {
  return revisionNumber_;
}

} // namespace react
} // namespace facebook

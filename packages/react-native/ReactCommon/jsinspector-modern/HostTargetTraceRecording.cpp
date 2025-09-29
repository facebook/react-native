/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTargetTraceRecording.h"
#include "HostTarget.h"

namespace facebook::react::jsinspector_modern {

HostTargetTraceRecording::HostTargetTraceRecording(
    tracing::Mode tracingMode,
    HostTarget& hostTarget)
    : tracingMode_(tracingMode), hostTarget_(hostTarget) {}

void HostTargetTraceRecording::setTracedInstance(
    InstanceTarget* instanceTarget) {
  // If HostTracingAgent is allocated, it means that there is an active tracing
  // recording session.
  if (hostTracingAgent_ != nullptr) {
    hostTracingAgent_->setTracedInstance(instanceTarget);
  }
}

void HostTargetTraceRecording::start() {
  assert(
      hostTracingAgent_ == nullptr &&
      "Tracing Agent for the HostTarget was already initialized.");

  state_ = tracing::TraceRecordingState{
      .mode = tracingMode_,
      .startTime = HighResTimeStamp::now(),
  };
  hostTracingAgent_ = hostTarget_.createTracingAgent(*state_);
}

tracing::TraceRecordingState HostTargetTraceRecording::stop() {
  assert(
      hostTracingAgent_ != nullptr &&
      "TracingAgent for the HostTarget has not been initialized.");
  hostTracingAgent_.reset();

  assert(
      state_.has_value() &&
      "The state for this tracing session has not been initialized.");
  auto state = std::move(*state_);
  state_.reset();

  return state;
}

} // namespace facebook::react::jsinspector_modern

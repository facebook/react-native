/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTargetTraceRecording.h"
#include "HostTarget.h"

namespace facebook::react::jsinspector_modern {

HostTargetTraceRecording::HostTargetTraceRecording(HostTarget& hostTarget)
    : hostTracingAgent_(hostTarget.createTracingAgent(state_)) {
  (void)state_;
}

void HostTargetTraceRecording::setTracedInstance(
    InstanceTarget* instanceTarget) {
  hostTracingAgent_->setTracedInstance(instanceTarget);
}

void HostTargetTraceRecording::enable() {
  if (state_.isRecording) {
    return;
  }

  state_.isRecording = true;
  hostTracingAgent_->enable();
}

void HostTargetTraceRecording::disable() {
  if (!state_.isRecording) {
    return;
  }

  state_.isRecording = false;
  hostTracingAgent_->disable();
}

tracing::TraceRecordingState HostTargetTraceRecording::extractState() {
  assert(!state_.isRecording && "Recording is still in progress");

  auto previousState = std::move(state_);
  state_ = tracing::TraceRecordingState{};

  return previousState;
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTarget.h"
#include "HostTargetTraceRecording.h"

namespace facebook::react::jsinspector_modern {

bool HostTargetController::startTracing(tracing::Mode tracingMode) {
  return target_.startTracing(tracingMode);
}

tracing::TraceRecordingState HostTargetController::stopTracing() {
  return target_.stopTracing();
}

std::shared_ptr<HostTracingAgent> HostTarget::createTracingAgent(
    tracing::TraceRecordingState& state) {
  auto agent = std::make_shared<HostTracingAgent>(state);
  agent->setTracedInstance(currentInstance_.get());
  return agent;
}

bool HostTarget::startTracing(tracing::Mode tracingMode) {
  if (traceRecording_ != nullptr) {
    if (traceRecording_->isBackgroundInitiated() &&
        tracingMode == tracing::Mode::CDP) {
      traceRecording_.reset();
    } else {
      return false;
    }
  }

  traceRecording_ =
      std::make_unique<HostTargetTraceRecording>(tracingMode, *this);
  traceRecording_->setTracedInstance(currentInstance_.get());
  traceRecording_->start();

  return true;
}

tracing::TraceRecordingState HostTarget::stopTracing() {
  assert(traceRecording_ != nullptr && "No tracing in progress");

  auto state = traceRecording_->stop();
  traceRecording_.reset();

  return state;
}

} // namespace facebook::react::jsinspector_modern

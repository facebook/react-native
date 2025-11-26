/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTarget.h"
#include "HostTargetTraceRecording.h"

namespace facebook::react::jsinspector_modern {

bool HostTargetController::startTracing(
    tracing::Mode tracingMode,
    std::set<tracing::Category> enabledCategories) {
  return target_.startTracing(tracingMode, std::move(enabledCategories));
}

tracing::HostTracingProfile HostTargetController::stopTracing() {
  return target_.stopTracing();
}

std::shared_ptr<HostTracingAgent> HostTarget::createTracingAgent(
    tracing::TraceRecordingState& state) {
  auto agent = std::make_shared<HostTracingAgent>(state);
  agent->setTracedInstance(currentInstance_.get());
  return agent;
}

bool HostTarget::startTracing(
    tracing::Mode tracingMode,
    std::set<tracing::Category> enabledCategories) {
  if (traceRecording_ != nullptr) {
    if (traceRecording_->isBackgroundInitiated() &&
        tracingMode == tracing::Mode::CDP) {
      stopTracing();
    } else {
      return false;
    }
  }

  auto screenshotsCategoryEnabled =
      enabledCategories.contains(tracing::Category::Screenshot);

  traceRecording_ = std::make_unique<HostTargetTraceRecording>(
      *this, tracingMode, std::move(enabledCategories));
  traceRecording_->setTracedInstance(currentInstance_.get());
  traceRecording_->start();

  if (auto tracingDelegate = delegate_.getTracingDelegate()) {
    tracingDelegate->onTracingStarted(tracingMode, screenshotsCategoryEnabled);
  }

  return true;
}

tracing::HostTracingProfile HostTarget::stopTracing() {
  assert(traceRecording_ != nullptr && "No tracing in progress");

  if (auto tracingDelegate = delegate_.getTracingDelegate()) {
    tracingDelegate->onTracingStopped();
  }

  auto profile = traceRecording_->stop();
  traceRecording_.reset();

  return profile;
}

} // namespace facebook::react::jsinspector_modern

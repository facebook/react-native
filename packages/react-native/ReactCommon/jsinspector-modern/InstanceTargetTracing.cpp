/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InstanceTarget.h"

namespace facebook::react::jsinspector_modern {

void InstanceTarget::startTracing() {
  if (isTracing_) {
    throw std::runtime_error(
        "HostTarget already has a pending tracing session.");
  }

  isTracing_ = true;
  /**
   * In case if \c InstanceTarget::collectTracingProfile was never called.
   */
  storedRuntimeTargetSamplingProfiles_.clear();

  if (currentRuntime_) {
    return startTracingRuntimeTarget(currentRuntime_.get());
  }
}

void InstanceTarget::stopTracing() {
  if (!isTracing_) {
    throw std::runtime_error("HostTarget has no pending tracing session.");
  }

  isTracing_ = false;
  if (currentRuntime_) {
    return stopTracingRuntimeTarget(currentRuntime_.get());
  }
}

tracing::InstanceTargetTracingProfile InstanceTarget::collectTracingProfile() {
  if (isTracing_) {
    throw std::runtime_error(
        "Attempted to collect InstanceTargetTracingProfile before stopping the tracing session.");
  }

  auto profiles = std::move(storedRuntimeTargetSamplingProfiles_);
  storedRuntimeTargetSamplingProfiles_.clear();

  return tracing::InstanceTargetTracingProfile{std::move(profiles)};
}

void InstanceTarget::startTracingRuntimeTarget(RuntimeTarget* runtimeTarget) {
  assert(
      runtimeTarget != nullptr &&
      "Attempted to start tracing a null RuntimeTarget");

  runtimeTarget->registerForTracing();
  return runtimeTarget->enableSamplingProfiler();
}

void InstanceTarget::stopTracingRuntimeTarget(RuntimeTarget* runtimeTarget) {
  assert(
      runtimeTarget != nullptr &&
      "Attempted to stop tracing a null RuntimeTarget");

  runtimeTarget->disableSamplingProfiler();
  storedRuntimeTargetSamplingProfiles_.emplace_back(
      runtimeTarget->collectSamplingProfile());
}

} // namespace facebook::react::jsinspector_modern

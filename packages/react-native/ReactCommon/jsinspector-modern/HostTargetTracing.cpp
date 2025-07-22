/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTarget.h"

namespace facebook::react::jsinspector_modern {

void HostTargetController::startTracing() {
  return target_.startTracing();
}

void HostTargetController::stopTracing() {
  return target_.stopTracing();
}

tracing::HostTargetTracingProfile
HostTargetController::collectTracingProfile() {
  return target_.collectTracingProfile();
}

void HostTarget::startTracing() {
  if (isTracing_) {
    throw std::runtime_error(
        "HostTarget already has a pending tracing session.");
  }

  isTracing_ = true;
  /**
   * In case if \c HostTarget::collectTracingProfile was never called.
   */
  storedInstanceTargetTracingProfiles_.clear();

  if (currentInstance_) {
    return startTracingInstanceTarget(currentInstance_.get());
  }
}

void HostTarget::stopTracing() {
  if (!isTracing_) {
    throw std::runtime_error("HostTarget has no pending tracing session.");
  }

  isTracing_ = false;
  if (currentInstance_) {
    return stopTracingInstanceTarget(currentInstance_.get());
  }
}

tracing::HostTargetTracingProfile HostTarget::collectTracingProfile() {
  if (isTracing_) {
    throw std::runtime_error(
        "Attempted to collect HostTargetTracingProfile before stopping the tracing session.");
  }

  auto profiles = std::move(storedInstanceTargetTracingProfiles_);
  storedInstanceTargetTracingProfiles_.clear();

  return tracing::HostTargetTracingProfile{std::move(profiles)};
}

void HostTarget::startTracingInstanceTarget(InstanceTarget* instanceTarget) {
  assert(
      instanceTarget != nullptr &&
      "Attempted to start tracing a null InstanceTarget");
  return instanceTarget->startTracing();
}

void HostTarget::stopTracingInstanceTarget(InstanceTarget* instanceTarget) {
  assert(
      instanceTarget != nullptr &&
      "Attempted to stop tracing a null InstanceTarget");

  instanceTarget->stopTracing();
  storedInstanceTargetTracingProfiles_.emplace_back(
      instanceTarget->collectTracingProfile());
}

} // namespace facebook::react::jsinspector_modern

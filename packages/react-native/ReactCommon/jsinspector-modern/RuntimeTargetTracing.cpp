/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeTarget.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>

namespace facebook::react::jsinspector_modern {

void RuntimeTargetController::registerForTracing() {
  return target_.registerForTracing();
}

void RuntimeTargetController::enableSamplingProfiler() {
  return target_.enableSamplingProfiler();
}

void RuntimeTargetController::disableSamplingProfiler() {
  return target_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile
RuntimeTargetController::collectSamplingProfile() {
  return target_.collectSamplingProfile();
}

void RuntimeTarget::registerForTracing() {
  jsExecutor_([](auto& /*runtime*/) {
    tracing::PerformanceTracer::getInstance().reportJavaScriptThread();
  });
}

void RuntimeTarget::enableSamplingProfiler() {
  delegate_.enableSamplingProfiler();
}

void RuntimeTarget::disableSamplingProfiler() {
  delegate_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile RuntimeTarget::collectSamplingProfile() {
  return delegate_.collectSamplingProfile();
}

} // namespace facebook::react::jsinspector_modern

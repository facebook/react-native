/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JFrameTiming.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern {

void JFrameTiming::reportFrameTiming(
    jni::alias_ref<jclass> /*unused*/,
    jint frameNumber,
    jlong paintStartNanos,
    jlong paintEndNanos) {
  auto& performanceTracer = tracing::PerformanceTracer::getInstance();

  auto startTime = HighResTimeStamp::fromDOMHighResTimeStamp(
      static_cast<double>(paintStartNanos) / 1e6);
  auto endTime = HighResTimeStamp::fromDOMHighResTimeStamp(
      static_cast<double>(paintEndNanos) / 1e6);

  performanceTracer.reportFrameTiming(frameNumber, startTime, endTime);
}

void JFrameTiming::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("reportFrameTiming", JFrameTiming::reportFrameTiming),
  });
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react::jsinspector_modern {

/**
 * JNI wrapper for reporting frame timing to PerformanceTracer.
 */
class JFrameTiming : public jni::JavaClass<JFrameTiming> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/FrameTiming;";

  static void
  reportFrameTiming(jni::alias_ref<jclass> /*unused*/, jint frame, jlong paintStartNanos, jlong paintEndNanos);

  static void registerNatives();

 private:
  JFrameTiming() = delete;
};

} // namespace facebook::react::jsinspector_modern

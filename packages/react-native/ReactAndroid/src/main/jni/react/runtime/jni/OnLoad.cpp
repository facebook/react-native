/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>
#include <react/jni/JReactMarker.h>

#include "JJSTimerExecutor.h"
#include "JReactInstance.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*unused*/) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::JReactMarker::setLogPerfMarkerIfNeeded();
    facebook::react::JReactInstance::registerNatives();
    facebook::react::JJSTimerExecutor::registerNatives();
  });
}

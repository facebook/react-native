/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/TurboModulePerfLogger.h>
#include <fbjni/fbjni.h>
#include <reactperflogger/JNativeModulePerfLogger.h>

#include "CompositeTurboModuleManagerDelegate.h"
#include "TurboModuleManager.h"

void jniEnableCppLogging(
    facebook::jni::alias_ref<jclass> cls,
    facebook::jni::alias_ref<
        facebook::react::JNativeModulePerfLogger::javaobject> perfLogger) {
  facebook::react::TurboModulePerfLogger::enableLogging(
      perfLogger->cthis()->get());
}

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    // TODO: dvacca ramanpreet unify this with the way
    // "ComponentDescriptorFactory" is defined in Fabric
    facebook::react::TurboModuleManager::registerNatives();

    facebook::react::CompositeTurboModuleManagerDelegate::registerNatives();

    facebook::jni::registerNatives(
        "com/facebook/react/internal/turbomodule/core/TurboModulePerfLogger",
        {makeNativeMethod("jniEnableCppLogging", jniEnableCppLogging)});
  });
}

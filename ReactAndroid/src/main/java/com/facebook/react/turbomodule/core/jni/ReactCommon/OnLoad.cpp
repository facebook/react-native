/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/TurboModulePerfLogger.h>
#include <fb/xplat_init.h>
#include <fbjni/fbjni.h>
#include <reactperflogger/JNativeModulePerfLogger.h>

#include "TurboModuleManager.h"

void jniEnableCppLogging(
    jni::alias_ref<jclass> cls,
    jni::alias_ref<facebook::react::JNativeModulePerfLogger::javaobject>
        perfLogger) {
  facebook::react::TurboModulePerfLogger::enableLogging(
      perfLogger->cthis()->get());
}

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::xplat::initialize(vm, [] {
    // TODO: dvacca ramanpreet unify this with the way
    // "ComponentDescriptorFactory" is defined in Fabric
    facebook::react::TurboModuleManager::registerNatives();

    facebook::jni::registerNatives(
        "com/facebook/react/turbomodule/core/TurboModulePerfLogger",
        {makeNativeMethod("jniEnableCppLogging", jniEnableCppLogging)});
  });
}

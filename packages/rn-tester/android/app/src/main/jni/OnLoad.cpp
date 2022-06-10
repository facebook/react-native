/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>

#include "RNTesterComponentsRegistry.h"
#include "RNTesterTurboModuleManagerDelegate.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    // TODO: dvacca ramanpreet unify this with the way
    // "ComponentDescriptorFactory" is defined in Fabric
    facebook::react::RNTesterTurboModuleManagerDelegate::registerNatives();
    facebook::react::RNTesterComponentsRegistry::registerNatives();
  });
}

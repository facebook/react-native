// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/fbjni.h>
#include <fb/xplat_init.h>

#include "TurboModuleManager.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::xplat::initialize(vm, [] {
    // TODO: dvacca ramanpreet unify this with the way "ComponentDescriptorFactory" is defined in Fabric
    facebook::react::TurboModuleManager::registerNatives();
  });
}

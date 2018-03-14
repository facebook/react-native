// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/fbjni.h>
#include <fb/xplat_init.h>

#include "FabricJSCBinding.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::xplat::initialize(vm, [] {
    facebook::react::FabricJSCBinding::registerNatives();
  });
}

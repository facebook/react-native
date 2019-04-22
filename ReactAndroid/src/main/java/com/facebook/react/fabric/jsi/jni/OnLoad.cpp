// Copyright 2004-present Facebook. All Rights Reserved.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <fb/fbjni.h>
#include <fb/xplat_init.h>

#include "Binding.h"
#include "EventBeatManager.h"
#include "EventEmitterWrapper.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::xplat::initialize(vm, [] {
    facebook::react::Binding::registerNatives();
    facebook::react::EventBeatManager::registerNatives();
    facebook::react::EventEmitterWrapper::registerNatives();
    facebook::react::ComponentFactoryDelegate::registerNatives();
  });
}

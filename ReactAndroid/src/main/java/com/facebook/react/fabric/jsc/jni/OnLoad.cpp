/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fb/fbjni.h>
#include <fb/xplat_init.h>

#include "FabricJSCBinding.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::xplat::initialize(vm, [] {
    facebook::react::FabricJSCBinding::registerNatives();
  });
}

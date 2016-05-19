/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <jni.h>
#include <fb/fbjni.h>

using namespace facebook::jni;

void initialize_xplatinit();
void initialize_fbjni();

JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(vm, [] {
    initialize_fbjni();
#ifndef DISABLE_XPLAT
    initialize_xplatinit();
#endif
  });
}

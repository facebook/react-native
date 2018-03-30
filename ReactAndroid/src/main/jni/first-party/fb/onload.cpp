/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jni.h>
#ifndef DISABLE_CPUCAP
#include <fb/CpuCapabilities.h>
#endif
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
#ifndef DISABLE_CPUCAP
    initialize_cpucapabilities();
#endif
  });
}

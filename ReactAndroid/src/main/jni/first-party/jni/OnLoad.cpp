/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <jni.h>
#include <fb/assert.h>
#include <jni/Countable.h>
#include <jni/Environment.h>
#include <jni/fbjni.h>

using namespace facebook::jni;

JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(vm, [] {
      CountableOnLoad(Environment::current());
      HybridDataOnLoad();
    });
}

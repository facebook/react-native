/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <jni.h>
#include <initializer_list>
#include <fb/assert.h>

namespace facebook {
namespace jni {

static inline void registerNatives(JNIEnv* env, jclass cls, std::initializer_list<JNINativeMethod> methods) {
  auto result = env->RegisterNatives(cls, methods.begin(), methods.size());
  FBASSERT(result == 0);
}

static inline void registerNatives(JNIEnv* env, const char* cls, std::initializer_list<JNINativeMethod> list) {
  registerNatives(env, env->FindClass(cls), list);
}

} }

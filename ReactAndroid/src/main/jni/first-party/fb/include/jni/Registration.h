/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <fb/assert.h>
#include <jni.h>
#include <initializer_list>

namespace facebook {
namespace jni {

static inline void registerNatives(
    JNIEnv *env,
    jclass cls,
    std::initializer_list<JNINativeMethod> methods) {
  auto result = env->RegisterNatives(cls, methods.begin(), methods.size());
  FBASSERT(result == 0);
}

static inline void registerNatives(
    JNIEnv *env,
    const char *cls,
    std::initializer_list<JNINativeMethod> list) {
  registerNatives(env, env->FindClass(cls), list);
}

} // namespace jni
} // namespace facebook

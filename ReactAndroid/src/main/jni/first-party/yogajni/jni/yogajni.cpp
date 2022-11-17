/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGJNIVanilla.h"
#include "common.h"

using namespace facebook::yoga;

jint JNI_OnLoad(JavaVM* vm, void*) {
  JNIEnv* env;
  jint ret = vanillajni::ensureInitialized(&env, vm);
  YGJNIVanilla::registerNatives(env);
  return ret;
}

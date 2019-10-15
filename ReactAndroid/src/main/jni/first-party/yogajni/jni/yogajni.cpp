/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "yogajni.h"
#include "YGJNIVanilla.h"
#include <fbjni/fbjni.h>
#include "common.h"

using namespace facebook::jni;
using namespace facebook::yoga;

jint JNI_OnLoad(JavaVM* vm, void*) {
  jint ret = YGJNI::registerNativeMethods(vm);

  JNIEnv* env;
  vanillajni::ensureInitialized(&env, vm);
  YGJNIVanilla::registerNatives(env);
  return ret;
}

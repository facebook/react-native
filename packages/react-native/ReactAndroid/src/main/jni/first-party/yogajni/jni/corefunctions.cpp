/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "corefunctions.h"
#include "YogaJniException.h"
#include "macros.h"

namespace facebook::yoga::vanillajni {

namespace {
JavaVM* globalVm = nullptr;
struct JavaVMInitializer {
  explicit JavaVMInitializer(JavaVM* vm) {
    if (vm == nullptr) {
      logErrorMessageAndDie(
          "You cannot pass a NULL JavaVM to ensureInitialized");
    }
    globalVm = vm;
  }
};
} // namespace

jint ensureInitialized(JNIEnv** env, JavaVM* vm) {
  static JavaVMInitializer init(vm);

  if (env == nullptr) {
    logErrorMessageAndDie(
        "Need to pass a valid JNIEnv pointer to vanillajni initialization "
        "routine");
  }

  if (vm->GetEnv(reinterpret_cast<void**>(env), JNI_VERSION_1_6) != JNI_OK) {
    logErrorMessageAndDie(
        "Error retrieving JNIEnv during initialization of vanillajni");
  }

  return JNI_VERSION_1_6;
}

// TODO why we need JNIEXPORT for getCurrentEnv ?
JNIEXPORT JNIEnv* getCurrentEnv() {
  JNIEnv* env = nullptr;
  jint ret = globalVm->GetEnv((void**)&env, JNI_VERSION_1_6);
  if (ret != JNI_OK) {
    logErrorMessageAndDie(
        "There was an error retrieving the current JNIEnv. Make sure the "
        "current thread is attached");
  }
  return env;
}

void logErrorMessageAndDie(const char* message) {
  (void)message;
  VANILLAJNI_LOG_ERROR(
      "VanillaJni",
      "Aborting due to error detected in native code: %s",
      message);
  VANILLAJNI_DIE();
}

void assertNoPendingJniException(JNIEnv* env) {
  if (env->ExceptionCheck() == JNI_FALSE) {
    return;
  }

  auto throwable = env->ExceptionOccurred();
  if (throwable == nullptr) {
    logErrorMessageAndDie("Unable to get pending JNI exception.");
  }
  env->ExceptionClear();
  throw YogaJniException(throwable);
}

void assertNoPendingJniExceptionIf(JNIEnv* env, bool condition) {
  if (!condition) {
    return;
  }

  if (env->ExceptionCheck() == JNI_TRUE) {
    assertNoPendingJniException(env);
    return;
  }

  throw YogaJniException();
}

} // namespace facebook::yoga::vanillajni

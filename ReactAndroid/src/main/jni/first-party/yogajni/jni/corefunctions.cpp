/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "corefunctions.h"
#include "macros.h"

namespace facebook {
namespace yoga {
namespace vanillajni {

namespace {
JavaVM* globalVm = NULL;
struct JavaVMInitializer {
  JavaVMInitializer(JavaVM* vm) {
    if (!vm) {
      logErrorMessageAndDie(
          "You cannot pass a NULL JavaVM to ensureInitialized");
    }
    globalVm = vm;
  }
};
} // namespace

jint ensureInitialized(JNIEnv** env, JavaVM* vm) {
  static JavaVMInitializer init(vm);

  if (!env) {
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

JNIEnv* getCurrentEnv() {
  JNIEnv* env;
  jint ret = globalVm->GetEnv((void**) &env, JNI_VERSION_1_6);
  if (ret != JNI_OK) {
    logErrorMessageAndDie(
        "There was an error retrieving the current JNIEnv. Make sure the "
        "current thread is attached");
  }
  return env;
}

void logErrorMessageAndDie(const char* message) {
  VANILLAJNI_LOG_ERROR(
      "VanillaJni",
      "Aborting due to error detected in native code: %s",
      message);
  VANILLAJNI_DIE();
}

void assertNoPendingJniException(JNIEnv* env) {
  // This method cannot call any other method of the library, since other
  // methods of the library use it to check for exceptions too
  if (env->ExceptionCheck()) {
    env->ExceptionDescribe();
    logErrorMessageAndDie("Aborting due to pending Java exception in JNI");
  }
}

} // namespace vanillajni
} // namespace yoga
} // namespace facebook

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "jni.h"
#include "YGJNIVanilla.h"
#include <yoga/YGNode.h>

static inline YGNodeRef _jlong2YGNodeRef(jlong addr) {
  return reinterpret_cast<YGNodeRef>(static_cast<intptr_t>(addr));
}

void jni_YGNodeStyleSetFlexJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jfloat value) {
  YGNodeStyleSetFlex(
      _jlong2YGNodeRef(nativePointer), static_cast<float>(value));
}

void assertNoPendingJniException(JNIEnv* env) {
  // This method cannot call any other method of the library, since other
  // methods of the library use it to check for exceptions too
  if (env->ExceptionCheck()) {
    env->ExceptionDescribe();
  }
}

void registerNativeMethods(
    JNIEnv* env,
    const char* className,
    JNINativeMethod methods[],
    size_t numMethods) {
  jclass clazz = env->FindClass(className);

  assertNoPendingJniException(env);

  env->RegisterNatives(clazz, methods, numMethods);

  assertNoPendingJniException(env);
}

static JNINativeMethod methods[] = {
    {"jni_YGNodeStyleSetFlexJNI", "(JF)V", (void*) jni_YGNodeStyleSetFlexJNI}};

void YGJNIVanilla::registerNatives(JNIEnv* env) {
  registerNativeMethods(
      env,
      "com/facebook/yoga/YogaNative",
      methods,
      sizeof(methods) / sizeof(JNINativeMethod));
}

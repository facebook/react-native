/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "common.h"

namespace facebook {
namespace yoga {
namespace vanillajni {

void registerNatives(
    JNIEnv* env,
    const char* className,
    const JNINativeMethod methods[],
    size_t numMethods) {
  jclass clazz = env->FindClass(className);

  assertNoPendingJniExceptionIf(env, !clazz);

  auto result = env->RegisterNatives(clazz, methods, numMethods);

  assertNoPendingJniExceptionIf(env, result != JNI_OK);
}

jmethodID getStaticMethodId(
    JNIEnv* env,
    jclass clazz,
    const char* methodName,
    const char* methodDescriptor) {
  jmethodID methodId =
      env->GetStaticMethodID(clazz, methodName, methodDescriptor);
  assertNoPendingJniExceptionIf(env, !methodId);
  return methodId;
}

jmethodID getMethodId(
    JNIEnv* env,
    jclass clazz,
    const char* methodName,
    const char* methodDescriptor) {
  jmethodID methodId = env->GetMethodID(clazz, methodName, methodDescriptor);
  assertNoPendingJniExceptionIf(env, !methodId);
  return methodId;
}

jfieldID getFieldId(
    JNIEnv* env,
    jclass clazz,
    const char* fieldName,
    const char* fieldSignature) {
  jfieldID fieldId = env->GetFieldID(clazz, fieldName, fieldSignature);
  assertNoPendingJniExceptionIf(env, !fieldId);
  return fieldId;
}

#define DEFINE_CALL_METHOD_FOR_PRIMITIVE_IMPLEMENTATION(jnitype, readableType) \
  DEFINE_CALL_METHOD_FOR_PRIMITIVE_INTERFACE(jnitype, readableType) {          \
    va_list args;                                                              \
    va_start(args, methodId);                                                  \
    jnitype result = env->Call##readableType##MethodV(obj, methodId, args);    \
    va_end(args);                                                              \
    assertNoPendingJniException(env);                                          \
    return result;                                                             \
  }

DEFINE_CALL_METHOD_FOR_PRIMITIVE_IMPLEMENTATION(jlong, Long);
DEFINE_CALL_METHOD_FOR_PRIMITIVE_IMPLEMENTATION(jfloat, Float);

DEFINE_CALL_METHOD_FOR_PRIMITIVE_INTERFACE(void, Void) {
  va_list args;
  va_start(args, methodId);
  env->CallVoidMethodV(obj, methodId, args);
  va_end(args);
  assertNoPendingJniException(env);
}

ScopedLocalRef<jobject> callStaticObjectMethod(
    JNIEnv* env,
    jclass clazz,
    jmethodID methodId,
    ...) {
  va_list args;
  va_start(args, methodId);
  jobject result = env->CallStaticObjectMethodV(clazz, methodId, args);
  va_end(args);
  assertNoPendingJniExceptionIf(env, !result);
  return make_local_ref(env, result);
}

ScopedGlobalRef<jobject> newGlobalRef(JNIEnv* env, jobject obj) {
  jobject result = env->NewGlobalRef(obj);

  if (!result) {
    logErrorMessageAndDie("Could not obtain global reference from object");
  }

  return make_global_ref(result);
}

ScopedGlobalRef<jthrowable> newGlobalRef(JNIEnv* env, jthrowable obj) {
  jthrowable result = static_cast<jthrowable>(env->NewGlobalRef(obj));

  if (!result) {
    logErrorMessageAndDie("Could not obtain global reference from object");
  }

  return make_global_ref(result);
}
} // namespace vanillajni
} // namespace yoga
} // namespace facebook

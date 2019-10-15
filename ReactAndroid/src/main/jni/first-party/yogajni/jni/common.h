/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ScopedGlobalRef.h"
#include "ScopedLocalRef.h"

namespace facebook {
namespace yoga {
namespace vanillajni {

/**
 * Registers a set of methods for a JNI class. Aborts if registration fails.
 */
void registerNatives(
    JNIEnv* env,
    const char* className,
    const JNINativeMethod methods[],
    size_t numMethods);

/**
 * Returns a jmethodID for a class static method. Aborts if any error happens.
 */
jmethodID getStaticMethodId(
    JNIEnv* env,
    jclass clazz,
    const char* methodName,
    const char* methodDescriptor);

/**
 * Returns a jmethodID for a class non-static method. Aborts if any error
 * happens.
 */
jmethodID getMethodId(
    JNIEnv* env,
    jclass clazz,
    const char* methodName,
    const char* methodDescriptor);

/**
 * Returns a class non-static field ID. Aborts if any error happens.
 */
jfieldID getFieldId(
    JNIEnv* env,
    jclass clazz,
    const char* fieldName,
    const char* fieldSignature);

// Helper methods to call a non-static method on an object depending on the
// return type. Each method will abort the execution if an error
// (such as a Java pending exception) is detected after invoking the
// Java method.
#define DEFINE_CALL_METHOD_FOR_PRIMITIVE_INTERFACE(jnitype, readableType) \
  jnitype call##readableType##Method(                                     \
      JNIEnv* env, jobject obj, jmethodID methodId, ...)
DEFINE_CALL_METHOD_FOR_PRIMITIVE_INTERFACE(void, Void);
DEFINE_CALL_METHOD_FOR_PRIMITIVE_INTERFACE(jlong, Long);
DEFINE_CALL_METHOD_FOR_PRIMITIVE_INTERFACE(jfloat, Float);

ScopedLocalRef<jobject>
callStaticObjectMethod(JNIEnv* env, jclass clazz, jmethodID methodId, ...);

/**
 * Given a local or a global reference, this method creates a new global
 * reference out of it. If any error happens, aborts the process.
 */
ScopedGlobalRef<jobject> newGlobalRef(JNIEnv* env, jobject obj);
} // namespace vanillajni
} // namespace yoga
} // namespace facebook

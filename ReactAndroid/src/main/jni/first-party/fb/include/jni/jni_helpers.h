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

#include <fb/visibility.h>

namespace facebook {

/**
 * Instructs the JNI environment to throw an exception.
 *
 * @param pEnv JNI environment
 * @param szClassName class name to throw
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwException(JNIEnv* pEnv, const char* szClassName, const char* szFmt, va_list va_args);

/**
 * Instructs the JNI environment to throw a NoClassDefFoundError.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwNoClassDefError(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Instructs the JNI environment to throw a RuntimeException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwRuntimeException(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Instructs the JNI environment to throw a IllegalArgumentException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwIllegalArgumentException(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Instructs the JNI environment to throw a IllegalStateException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwIllegalStateException(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Instructs the JNI environment to throw an IOException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwIOException(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Instructs the JNI environment to throw an AssertionError.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwAssertionError(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Instructs the JNI environment to throw an OutOfMemoryError.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
FBEXPORT jint throwOutOfMemoryError(JNIEnv* pEnv, const char* szFmt, ...);

/**
 * Finds the specified class. If it's not found, instructs the JNI environment to throw an
 * exception.
 *
 * @param pEnv JNI environment
 * @param szClassName the classname to find in JNI format (e.g. "java/lang/String")
 * @return the class or NULL if not found (in which case a pending exception will be queued). This
 *     returns a global reference (JNIEnv::NewGlobalRef).
 */
FBEXPORT jclass findClassOrThrow(JNIEnv *pEnv, const char* szClassName);

/**
 * Finds the specified field of the specified class. If it's not found, instructs the JNI
 * environment to throw an exception.
 *
 * @param pEnv JNI environment
 * @param clazz the class to lookup the field in
 * @param szFieldName the name of the field to find
 * @param szSig the signature of the field
 * @return the field or NULL if not found (in which case a pending exception will be queued)
 */
FBEXPORT jfieldID getFieldIdOrThrow(JNIEnv* pEnv, jclass clazz, const char* szFieldName, const char* szSig);

/**
 * Finds the specified method of the specified class. If it's not found, instructs the JNI
 * environment to throw an exception.
 *
 * @param pEnv JNI environment
 * @param clazz the class to lookup the method in
 * @param szMethodName the name of the method to find
 * @param szSig the signature of the method
 * @return the method or NULL if not found (in which case a pending exception will be queued)
 */
FBEXPORT jmethodID getMethodIdOrThrow(
    JNIEnv* pEnv,
    jclass clazz,
    const char* szMethodName,
    const char* szSig);

} // namespace facebook


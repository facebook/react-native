/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <jni.h>
#include <stddef.h>
#include <cstdio>

#include <jni/jni_helpers.h>

#define MSG_SIZE 1024

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
jint throwException(JNIEnv* pEnv, const char* szClassName, const char* szFmt, va_list va_args) {
  char szMsg[MSG_SIZE];
  vsnprintf(szMsg, MSG_SIZE, szFmt, va_args);
  jclass exClass = pEnv->FindClass(szClassName);
  return pEnv->ThrowNew(exClass, szMsg);
}

/**
 * Instructs the JNI environment to throw a NoClassDefFoundError.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwNoClassDefError(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/lang/NoClassDefFoundError", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Instructs the JNI environment to throw a RuntimeException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwRuntimeException(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/lang/RuntimeException", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Instructs the JNI environment to throw an IllegalArgumentException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwIllegalArgumentException(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/lang/IllegalArgumentException", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Instructs the JNI environment to throw an IllegalStateException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwIllegalStateException(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/lang/IllegalStateException", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Instructs the JNI environment to throw an OutOfMemoryError.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwOutOfMemoryError(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/lang/OutOfMemoryError", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Instructs the JNI environment to throw an AssertionError.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwAssertionError(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/lang/AssertionError", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Instructs the JNI environment to throw an IOException.
 *
 * @param pEnv JNI environment
 * @param szFmt sprintf-style format string
 * @param ... sprintf-style args
 * @return 0 on success; a negative value on failure
 */
jint throwIOException(JNIEnv* pEnv, const char* szFmt, ...) {
  va_list va_args;
  va_start(va_args, szFmt);
  jint ret = throwException(pEnv, "java/io/IOException", szFmt, va_args);
  va_end(va_args);
  return ret;
}

/**
 * Finds the specified class. If it's not found, instructs the JNI environment to throw an
 * exception.
 *
 * @param pEnv JNI environment
 * @param szClassName the classname to find in JNI format (e.g. "java/lang/String")
 * @return the class or NULL if not found (in which case a pending exception will be queued). This
 *     returns a global reference (JNIEnv::NewGlobalRef).
 */
jclass findClassOrThrow(JNIEnv* pEnv, const char* szClassName) {
  jclass clazz = pEnv->FindClass(szClassName);
  if (!clazz) {
    return NULL;
  }
  return (jclass) pEnv->NewGlobalRef(clazz);
}

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
jfieldID getFieldIdOrThrow(JNIEnv* pEnv, jclass clazz, const char* szFieldName, const char* szSig) {
  return pEnv->GetFieldID(clazz, szFieldName, szSig);
}

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
jmethodID getMethodIdOrThrow(
    JNIEnv* pEnv,
    jclass clazz,
    const char* szMethodName,
    const char* szSig) {
  return pEnv->GetMethodID(clazz, szMethodName, szSig);
}

} // namespace facebook

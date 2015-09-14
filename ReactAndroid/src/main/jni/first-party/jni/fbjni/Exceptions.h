/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * @file Exceptions.h
 *
 * After invoking a JNI function that can throw a Java exception, the macro
 * @ref FACEBOOK_JNI_THROW_PENDING_EXCEPTION() or @ref FACEBOOK_JNI_THROW_EXCEPTION_IF()
 * should be invoked.
 *
 * IMPORTANT! IMPORTANT! IMPORTANT! IMPORTANT! IMPORTANT! IMPORTANT! IMPORTANT! IMPORTANT!
 * To use these methods you MUST call initExceptionHelpers() when your library is loaded.
 */

#pragma once

#include <alloca.h>
#include <stdexcept>
#include <string>

#include <jni.h>

#include "Common.h"

// If a pending JNI Java exception is found, wraps it in a JniException object and throws it as
// a C++ exception.
#define FACEBOOK_JNI_THROW_PENDING_EXCEPTION() \
  ::facebook::jni::throwPendingJniExceptionAsCppException()

// If the condition is true, throws a JniException object, which wraps the pending JNI Java
// exception if any. If no pending exception is found, throws a JniException object that wraps a
// RuntimeException throwable. 
#define FACEBOOK_JNI_THROW_EXCEPTION_IF(CONDITION) \
  ::facebook::jni::throwCppExceptionIf(CONDITION)

namespace facebook {
namespace jni {

namespace internal {
  void initExceptionHelpers();
}

/**
 * Before using any of the state initialized above, call this.  It
 * will assert if initialization has not yet occurred.
 */
void assertIfExceptionsNotInitialized();

// JniException ////////////////////////////////////////////////////////////////////////////////////

/**
 * This class wraps a Java exception into a C++ exception; if the exception is routed back
 * to the Java side, it can be unwrapped and just look like a pure Java interaction. The class
 * is resilient to errors while creating the exception, falling back to some pre-allocated
 * exceptions if a new one cannot be allocated or populated.
 *
 * Note: the what() method of this class is not thread-safe (t6900503).
 */
class JniException : public std::exception {
 public:
  JniException();

  explicit JniException(jthrowable throwable);

  JniException(JniException &&rhs);

  JniException(const JniException &other);

  ~JniException() noexcept;

  jthrowable getThrowable() const noexcept;

  virtual const char* what() const noexcept;

  void setJavaException() const noexcept;

 private:
  jthrowable throwableGlobalRef_;
  mutable std::string what_;
  mutable bool isMessageExtracted_;
  const static std::string kExceptionMessageFailure_;

  void populateWhat() const noexcept;
};

// Exception throwing & translating functions //////////////////////////////////////////////////////

// Functions that throw C++ exceptions

void throwPendingJniExceptionAsCppException();

void throwCppExceptionIf(bool condition);

static const int kMaxExceptionMessageBufferSize = 512;

[[noreturn]] void throwNewJavaException(jthrowable);

[[noreturn]] void throwNewJavaException(const char* throwableName, const char* msg);

// These methods are the preferred way to throw a Java exception from
// a C++ function.  They create and throw a C++ exception which wraps
// a Java exception, so the C++ flow is interrupted. Then, when
// translatePendingCppExceptionToJavaException is called at the
// topmost level of the native stack, the wrapped Java exception is
// thrown to the java caller.
template<typename... Args>
[[noreturn]] void throwNewJavaException(const char* throwableName, const char* fmt, Args... args) {
  assertIfExceptionsNotInitialized();
  int msgSize = snprintf(nullptr, 0, fmt, args...);

  char *msg = (char*) alloca(msgSize);
  snprintf(msg, kMaxExceptionMessageBufferSize, fmt, args...);
  throwNewJavaException(throwableName, msg);
}

// Identifies any pending C++ exception and throws it as a Java exception. If the exception can't
// be thrown, it aborts the program. This is a noexcept function at C++ level.
void translatePendingCppExceptionToJavaException() noexcept;

// For convenience, some exception names in java.lang are available here.

const char* const gJavaLangIllegalArgumentException = "java/lang/IllegalArgumentException";

}}

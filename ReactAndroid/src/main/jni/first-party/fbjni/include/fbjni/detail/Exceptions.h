/**
 * Copyright 2018-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
#include "References.h"
#include "CoreClasses.h"

#if defined(__ANDROID__) && defined(__ARM_ARCH_5TE__) && !defined(FBJNI_NO_EXCEPTION_PTR)
// ARMv5 NDK does not support exception_ptr so we cannot use that when building for it.
#define FBJNI_NO_EXCEPTION_PTR
#endif

namespace facebook {
namespace jni {

class JThrowable;

class JCppException : public JavaClass<JCppException, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/jni/CppException;";

  static local_ref<JCppException> create(const char* str) {
    return newInstance(make_jstring(str));
  }

  static local_ref<JCppException> create(const std::exception& ex) {
    return newInstance(make_jstring(ex.what()));
  }
};

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
  ~JniException() override;

  explicit JniException(alias_ref<jthrowable> throwable);

  JniException(JniException &&rhs);

  JniException(const JniException &other);

  local_ref<JThrowable> getThrowable() const noexcept;

  const char* what() const noexcept override;

  void setJavaException() const noexcept;

 private:
  global_ref<JThrowable> throwable_;
  mutable std::string what_;
  mutable bool isMessageExtracted_;
  const static std::string kExceptionMessageFailure_;

  void populateWhat() const noexcept;
};

// Exception throwing & translating functions //////////////////////////////////////////////////////

// Functions that throw C++ exceptions

static const int kMaxExceptionMessageBufferSize = 512;

// These methods are the preferred way to throw a Java exception from
// a C++ function.  They create and throw a C++ exception which wraps
// a Java exception, so the C++ flow is interrupted. Then, when
// translatePendingCppExceptionToJavaException is called at the
// topmost level of the native stack, the wrapped Java exception is
// thrown to the java caller.
template<typename... Args>
[[noreturn]] void throwNewJavaException(const char* throwableName, const char* fmt, Args... args) {
  int msgSize = snprintf(nullptr, 0, fmt, args...);

  char *msg = (char*) alloca(msgSize + 1);
  snprintf(msg, kMaxExceptionMessageBufferSize, fmt, args...);
  throwNewJavaException(throwableName, msg);
}

// Identifies any pending C++ exception and throws it as a Java exception. If the exception can't
// be thrown, it aborts the program.
void translatePendingCppExceptionToJavaException();

#ifndef FBJNI_NO_EXCEPTION_PTR
local_ref<JThrowable> getJavaExceptionForCppException(std::exception_ptr ptr);
#endif

/***
 * The stack returned may include build ids.  It may be beneficial to
 * call lyra::setLibraryIdentifierFunction before calling this if
 * build ids are desirable.
 */
local_ref<JThrowable> getJavaExceptionForCppBackTrace();

local_ref<JThrowable> getJavaExceptionForCppBackTrace(const char* msg);

// For convenience, some exception names in java.lang are available here.
const char* const gJavaLangIllegalArgumentException = "java/lang/IllegalArgumentException";

}}

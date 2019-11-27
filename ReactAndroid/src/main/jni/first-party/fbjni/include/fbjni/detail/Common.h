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

/** @file Common.h
 *
 * Defining the stuff that don't deserve headers of their own...
 */

#pragma once

#include <functional>

#include <jni.h>

#ifdef FBJNI_DEBUG_REFS
# ifdef __ANDROID__
#  include <android/log.h>
# else
#  include <cstdio>
# endif
#endif

// If a pending JNI Java exception is found, wraps it in a JniException object and throws it as
// a C++ exception.
#define FACEBOOK_JNI_THROW_PENDING_EXCEPTION() \
  ::facebook::jni::throwPendingJniExceptionAsCppException()

// If the condition is true, throws a JniException object, which wraps the pending JNI Java
// exception if any. If no pending exception is found, throws a JniException object that wraps a
// RuntimeException throwable. 
#define FACEBOOK_JNI_THROW_EXCEPTION_IF(CONDITION) \
  ::facebook::jni::throwCppExceptionIf(CONDITION)

/// @cond INTERNAL

namespace facebook {
namespace jni {

void throwPendingJniExceptionAsCppException();
void throwCppExceptionIf(bool condition);

[[noreturn]] void throwNewJavaException(jthrowable);
[[noreturn]] void throwNewJavaException(const char* throwableName, const char* msg);
template<typename... Args>
[[noreturn]] void throwNewJavaException(const char* throwableName, const char* fmt, Args... args);


/**
 * This needs to be called at library load time, typically in your JNI_OnLoad method.
 *
 * The intended use is to return the result of initialize() directly
 * from JNI_OnLoad and to do nothing else there. Library specific
 * initialization code should go in the function passed to initialize
 * (which can be, and probably should be, a C++ lambda). This approach
 * provides correct error handling and translation errors during
 * initialization into Java exceptions when appropriate.
 *
 * Failure to call this will cause your code to crash in a remarkably
 * unhelpful way (typically a segfault) while trying to handle an exception
 * which occurs later.
 */
jint initialize(JavaVM*, std::function<void()>&&) noexcept;

namespace internal {

// Define to get extremely verbose logging of references and to enable reference stats
#ifdef FBJNI_DEBUG_LOG_REFS
template<typename... Args>
inline void dbglog(const char* msg, Args... args) {
# ifdef __ANDROID__
  __android_log_print(ANDROID_LOG_VERBOSE, "fbjni_dbg", msg, args...);
# else
  std::fprintf(stderr, msg, args...);
# endif
}

#else

template<typename... Args>
inline void dbglog(const char*, Args...) {
}

#endif

}}}

/// @endcond

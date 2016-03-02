/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/** @file Common.h
 *
 * Defining the stuff that don't deserve headers of their own...
 */

#pragma once

#include <functional>

#include <jni.h>

#include <jni/Environment.h>

#ifdef FBJNI_DEBUG_REFS
# ifdef __ANDROID__
#  include <android/log.h>
# else
#  include <cstdio>
# endif
#endif

/// @cond INTERNAL

namespace facebook {
namespace jni {

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

/**
 * Retrieve a pointer the JNI environment of the current thread.
 *
 * @pre The current thread must be attached to the VM
 */
inline JNIEnv* getEnv() noexcept {
  // TODO(T6594868) Benchmark against raw JNI access
  return Environment::current();
}

// Define to get extremely verbose logging of references and to enable reference stats
#ifdef FBJNI_DEBUG_REFS
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

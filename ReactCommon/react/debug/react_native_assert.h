/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// No header guards since it is legitimately possible to include this file more
// than once with and without REACT_NATIVE_DEBUG.

// react_native_assert allows us to opt-in to specific asserts on Android and
// test before moving on. When all issues have been found, maybe we can use
// `UNDEBUG` flag to disable NDEBUG in debug builds on Android.

#include "flags.h"

#undef react_native_assert

#ifndef REACT_NATIVE_DEBUG

#define react_native_assert(e) ((void)0)

#else // REACT_NATIVE_DEBUG

#ifdef __ANDROID__

#include <android/log.h>

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus
void react_native_assert_fail(
    const char *func,
    const char *file,
    int line,
    const char *expr);
#ifdef __cplusplus
}
#endif // __cpusplus

#define react_native_assert(e) \
  ((e) ? (void)0 : react_native_assert_fail(__func__, __FILE__, __LINE__, #e))

#else // __ANDROID__

#include <cassert>

#define react_native_assert(e) assert(e)

#endif // platforms besides __ANDROID__

#endif // NDEBUG

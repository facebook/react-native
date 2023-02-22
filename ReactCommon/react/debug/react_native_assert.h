/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// No header guards since it is legitimately possible to include this file more
// than once with and without REACT_NATIVE_DEBUG.

// react_native_assert allows us to opt-in to specific asserts on Android and
// test before moving on. When all issues have been found, maybe we can use
// `UNDEBUG` flag to disable NDEBUG in debug builds on Android.

// Asserting is appropriate for conditions that:
//   1. May or may not be recoverable, and
//   2. imply there is a bug in React Native when violated.
// For recoverable conditions that can be violated by user mistake (e.g. JS
// code passes an unexpected prop value), consider react_native_expect instead.

#include "flags.h"

#undef react_native_assert

#ifndef REACT_NATIVE_DEBUG

#define react_native_assert(e) ((void)0)

#else // REACT_NATIVE_DEBUG

#define react_native_assert(e) \
  ((e) ? (void)0 : react_native_assert_fail(__func__, __FILE__, __LINE__, #e))

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

#endif // REACT_NATIVE_DEBUG

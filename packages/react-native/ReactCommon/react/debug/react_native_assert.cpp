/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef __ANDROID__

#include <android/log.h>

// Provide a prototype to silence missing prototype warning in release
// mode.
extern "C" void react_native_assert_fail(
    const char* func,
    const char* file,
    int line,
    const char* expr);

extern "C" void react_native_assert_fail(
    const char* func,
    const char* file,
    int line,
    const char* expr) {
  // Print as an error so it shows up in logcat before crash...
  __android_log_print(
      ANDROID_LOG_ERROR,
      "ReactNative",
      "%s:%d: function %s: assertion failed (%s)",
      file,
      line,
      func,
      expr);
  // ...and trigger an abort so it crashes and shows up in uploaded logs.
  __android_log_assert(
      nullptr,
      "ReactNative",
      "%s:%d: function %s: assertion failed (%s)",
      file,
      line,
      func,
      expr);
}

#endif // __ANDROID__

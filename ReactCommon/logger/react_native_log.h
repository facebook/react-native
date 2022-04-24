/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

enum ReactNativeLogLevel {
  ReactNativeLogLevelInfo = 1,
  ReactNativeLogLevelWarning = 2,
  ReactNativeLogLevelError = 3,
  ReactNativeLogLevelFatal = 4
};

typedef void (*reactnativelogfunctype)(ReactNativeLogLevel, const char *);

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus
void set_react_native_logfunc(reactnativelogfunctype newlogfunc);

void react_native_log_info(const char *text);
void react_native_log_warn(const char *text);
void react_native_log_error(const char *text);
void react_native_log_fatal(const char *text);

void _react_native_log(ReactNativeLogLevel level, const char *text);
void _react_native_log_default(ReactNativeLogLevel level, const char *text);
#ifdef __cplusplus
}
#endif // __cpusplus

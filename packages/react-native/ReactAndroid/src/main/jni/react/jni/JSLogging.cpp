/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSLogging.h"

#include <android/log.h>

namespace facebook::react {

void reactAndroidLoggingHook(
    const std::string& message,
    unsigned int logLevel) {
  auto logPriority =
      static_cast<android_LogPriority>(logLevel + ANDROID_LOG_DEBUG);
  __android_log_write(logPriority, "ReactNativeJS", message.c_str());
}

} // namespace facebook::react

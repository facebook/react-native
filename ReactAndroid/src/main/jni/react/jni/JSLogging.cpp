// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSLogging.h"

#include <fb/log.h>

namespace facebook {
namespace react {

void reactAndroidLoggingHook(
    const std::string& message,
    android_LogPriority logLevel) {
  FBLOG_PRI(logLevel, "ReactNativeJS", "%s", message.c_str());
}

void reactAndroidLoggingHook(
    const std::string& message,
    unsigned int logLevel) {
  reactAndroidLoggingHook(
      message, static_cast<android_LogPriority>(logLevel + ANDROID_LOG_DEBUG));
}

} // namespace react
} // namespace facebook

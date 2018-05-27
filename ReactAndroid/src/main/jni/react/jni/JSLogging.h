// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <android/log.h>
#include <string>

namespace facebook {
namespace react {

void reactAndroidLoggingHook(
    const std::string& message,
    android_LogPriority logLevel);
void reactAndroidLoggingHook(
    const std::string& message,
    unsigned int logLevel);

} // namespace react
} // namespace facebook

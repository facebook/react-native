// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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

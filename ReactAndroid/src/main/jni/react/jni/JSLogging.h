// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <android/log.h>
#include <string>

#include <JavaScriptCore/JSContextRef.h>

namespace facebook {
namespace react {

JSValueRef nativeLoggingHook(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception);

void reactAndroidLoggingHook(
    const std::string& message,
    android_LogPriority logLevel);
void reactAndroidLoggingHook(
    const std::string& message,
    unsigned int logLevel);

} // namespace react
} // namespace facebook

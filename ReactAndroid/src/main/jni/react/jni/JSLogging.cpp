// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSLogging.h"

#include <fb/log.h>
#include <algorithm>

#include <jschelpers/Value.h>

namespace facebook {
namespace react {

JSValueRef nativeLoggingHook(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  android_LogPriority logLevel = ANDROID_LOG_DEBUG;
  if (argumentCount > 1) {
    int level = (int)Value(ctx, arguments[1]).asNumber();
    // The lowest log level we get from JS is 0. We shift and cap it to be
    // in the range the Android logging method expects.
    logLevel = std::min(
        static_cast<android_LogPriority>(level + ANDROID_LOG_DEBUG),
        ANDROID_LOG_FATAL);
  }
  if (argumentCount > 0) {
    String message = Value(ctx, arguments[0]).toString();
    reactAndroidLoggingHook(message.str(), logLevel);
  }
  return Value::makeUndefined(ctx);
}

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

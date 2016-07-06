// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSLogging.h"

#include <android/log.h>
#include <algorithm>
#include <fb/log.h>

#include <cxxreact/Value.h>

namespace facebook {
namespace react {

JSValueRef nativeLoggingHook(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  android_LogPriority logLevel = ANDROID_LOG_DEBUG;
  if (argumentCount > 1) {
    int level = (int) JSValueToNumber(ctx, arguments[1], NULL);
    // The lowest log level we get from JS is 0. We shift and cap it to be
    // in the range the Android logging method expects.
    logLevel = std::min(
        static_cast<android_LogPriority>(level + ANDROID_LOG_DEBUG),
        ANDROID_LOG_FATAL);
  }
  if (argumentCount > 0) {
    JSStringRef jsString = JSValueToStringCopy(ctx, arguments[0], NULL);
    String message = String::adopt(jsString);
    FBLOG_PRI(logLevel, "ReactNativeJS", "%s", message.str().c_str());
  }
  return JSValueMakeUndefined(ctx);
}

}};

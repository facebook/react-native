// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef WITH_JSC_EXTRA_TRACING

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/JavaScript.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jsc_legacy_profiler.h>
#include "JSCHelpers.h"
#include "JSCLegacyProfiler.h"
#include "Value.h"

static JSValueRef nativeProfilerStart(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (argumentCount < 1) {
    if (exception) {
      *exception = facebook::react::makeJSCException(
        ctx,
        "nativeProfilerStart: requires at least 1 argument");
    }
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef title = JSValueToStringCopy(ctx, arguments[0], exception);
  #if WITH_REACT_INTERNAL_SETTINGS
  JSStartProfiling(ctx, title, false);
  #else
  JSStartProfiling(ctx, title);
  #endif
  JSStringRelease(title);
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeProfilerEnd(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (argumentCount < 1) {
    if (exception) {
      *exception = facebook::react::makeJSCException(
        ctx,
        "nativeProfilerEnd: requires at least 1 argument");
    }
    return JSValueMakeUndefined(ctx);
  }

  std::string writeLocation("/sdcard/");
  if (argumentCount > 1) {
    JSStringRef fileName = JSValueToStringCopy(ctx, arguments[1], exception);
    writeLocation += facebook::react::String::ref(fileName).str();
    JSStringRelease(fileName);
  } else {
    writeLocation += "profile.json";
  }
  JSStringRef title = JSValueToStringCopy(ctx, arguments[0], exception);
  JSEndProfilingAndRender(ctx, title, writeLocation.c_str());
  JSStringRelease(title);
  return JSValueMakeUndefined(ctx);
}

namespace facebook {
namespace react {

void stopAndOutputProfilingFile(
  JSContextRef ctx,
  JSStringRef title,
  const char *filename) {
  JSEndProfilingAndRender(ctx, title, filename);
}

void addNativeProfilingHooks(JSGlobalContextRef ctx) {
  JSEnableByteCodeProfiling();
  installGlobalFunction(ctx, "nativeProfilerStart", nativeProfilerStart);
  installGlobalFunction(ctx, "nativeProfilerEnd", nativeProfilerEnd);
}

} }

#endif

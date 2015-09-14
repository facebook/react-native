// Copyright 2004-present Facebook. All Rights Reserved.

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/JavaScript.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jsc_legacy_profiler.h>
#include "JSCHelpers.h"
#include "JSCLegacyProfiler.h"

static JSValueRef nativeProfilerStart(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (argumentCount < 1) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef title = JSValueToStringCopy(ctx, arguments[0], NULL);
  JSStartProfiling(ctx, title);
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
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef title = JSValueToStringCopy(ctx, arguments[0], NULL);
  JSEndProfilingAndRender(ctx, title, "/sdcard/profile.json");
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

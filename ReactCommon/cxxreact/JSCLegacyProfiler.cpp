// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef WITH_JSC_EXTRA_TRACING

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jsc_legacy_profiler.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>
#include "JSCLegacyProfiler.h"

using namespace facebook::react;

static JSValueRef nativeProfilerStart(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (argumentCount < 1) {
    if (exception) {
      *exception = Value::makeError(
        ctx,
        "nativeProfilerStart: requires at least 1 argument");
    }
    return Value::makeUndefined(ctx);
  }

  auto title = String::adopt(ctx, JSValueToStringCopy(ctx, arguments[0], exception));
  #if WITH_REACT_INTERNAL_SETTINGS
  JSStartProfiling(ctx, title, false);
  #else
  JSStartProfiling(ctx, title);
  #endif
  return Value::makeUndefined(ctx);
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
      *exception = Value::makeError(
        ctx,
        "nativeProfilerEnd: requires at least 1 argument");
    }
    return Value::makeUndefined(ctx);
  }

  std::string writeLocation("/sdcard/");
  if (argumentCount > 1) {
    auto fileName = String::adopt(
      ctx, JSC_JSValueToStringCopy(ctx, arguments[1], exception));
    writeLocation += fileName.str();
  } else {
    writeLocation += "profile.json";
  }
  auto title = String::adopt(
    ctx, JSC_JSValueToStringCopy(ctx, arguments[0], exception));
  JSEndProfilingAndRender(ctx, title, writeLocation.c_str());
  return Value::makeUndefined(ctx);
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
  // JSEnableByteCodeProfiling();
  installGlobalFunction(ctx, "nativeProfilerStart", nativeProfilerStart);
  installGlobalFunction(ctx, "nativeProfilerEnd", nativeProfilerEnd);
}

} }

#endif

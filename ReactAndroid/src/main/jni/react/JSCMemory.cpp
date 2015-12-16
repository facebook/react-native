// Copyright 2004-present Facebook. All Rights Reserved.

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/JavaScript.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include "JSCHelpers.h"

#include "Value.h"

#ifdef WITH_FB_MEMORY_PROFILING

static JSValueRef nativeEnableAllocationTag(
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
        "nativeEnableAllocationTag requires a single boolean argument");
    }
    return JSValueMakeUndefined(ctx);
  }

  JSEnableAllocationTag(ctx, JSValueToBoolean(ctx, arguments[0]));
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeAllocationPushTag(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  std::string marker;

  if (argumentCount < 1) {
    if (exception) {
      *exception = facebook::react::makeJSCException(
        ctx,
        "nativeAllocationPushTag requires at least 1 argument");
    }
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef tag = JSValueToStringCopy(ctx, arguments[0], exception);
  JSPushAllocationTag(ctx, facebook::react::String::ref(tag).str().c_str());
  JSStringRelease(tag);
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeAllocationPopTag(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  JSPopAllocationTag(ctx);
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeForceSyncGC(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  JSSynchronousGarbageCollectForDebugging(ctx);
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeCaptureStart(
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
        "nativeCaptureStart requires at least 1 argument");
    }
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef outputFilename = JSValueToStringCopy(ctx, arguments[0], exception);
  std::string finalFilename =
    std::string("/sdcard/") +
    facebook::react::String::ref(outputFilename).str();
  JSHeapCaptureStart(ctx, finalFilename.c_str());
  JSStringRelease(outputFilename);
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeCaptureEnd(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  JSHeapCaptureEnd(ctx);
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeHeapDump(
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
        "nativeHeapDump requires at least 1 argument");
    }
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef outputFilename = JSValueToStringCopy(ctx, arguments[0], exception);
  std::string finalFilename =
    std::string("/sdcard/") +
    facebook::react::String::ref(outputFilename).str();
  JSHeapDump(ctx, finalFilename.c_str());
  JSStringRelease(outputFilename);
  return JSValueMakeUndefined(ctx);
}
#endif

namespace facebook {
namespace react {

void addNativeMemoryHooks(JSGlobalContextRef ctx) {
#ifdef WITH_FB_MEMORY_PROFILING
  installGlobalFunction(ctx, "nativeEnableAllocationTag", nativeEnableAllocationTag);
  installGlobalFunction(ctx, "nativeAllocationPushTag", nativeAllocationPushTag);
  installGlobalFunction(ctx, "nativeAllocationPopTag", nativeAllocationPopTag);
  installGlobalFunction(ctx, "nativeForceSyncGC", nativeForceSyncGC);
  installGlobalFunction(ctx, "nativeCaptureStart", nativeCaptureStart);
  installGlobalFunction(ctx, "nativeCaptureEnd", nativeCaptureEnd);
  installGlobalFunction(ctx, "nativeHeapDump", nativeHeapDump);
#endif
}

} }

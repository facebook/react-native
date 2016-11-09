// Copyright 2004-present Facebook. All Rights Reserved.

#include <JavaScriptCore/JavaScript.h>

#ifdef WITH_FB_MEMORY_PROFILING

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

static JSValueRef nativeCaptureHeap(
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
            "nativeCaptureHeap requires the path to save the capture");
      }
      return JSValueMakeUndefined(ctx);
  }

  JSStringRef outputFilename = JSValueToStringCopy(ctx, arguments[0], exception);
  std::string finalFilename = facebook::react::String::ref(outputFilename).str();
  JSCaptureHeap(ctx, finalFilename.c_str(), exception);
  JSStringRelease(outputFilename);
  return JSValueMakeUndefined(ctx);
}

#endif // WITH_FB_MEMORY_PROFILING

namespace facebook {
namespace react {

void addNativeMemoryHooks(JSGlobalContextRef ctx) {
#ifdef WITH_FB_MEMORY_PROFILING
  installGlobalFunction(ctx, "nativeCaptureHeap", nativeCaptureHeap);
#endif // WITH_FB_MEMORY_PROFILING

}

} }

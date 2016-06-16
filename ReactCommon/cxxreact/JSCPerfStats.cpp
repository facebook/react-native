// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCPerfStats.h"

#ifdef JSC_HAS_PERF_STATS_API

#include <JavaScriptCore/JSPerfStats.h>
#include <JavaScriptCore/JSValueRef.h>

#include "JSCHelpers.h"
#include "Value.h"

static JSValueRef nativeGetHeapStats(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  JSHeapStats heapStats = {0};
  JSGetHeapStats(ctx, &heapStats);

  auto result = facebook::react::Object::create(ctx);
  result.setProperty("size", {ctx, JSValueMakeNumber(ctx, heapStats.size)});
  result.setProperty("extra_size", {ctx, JSValueMakeNumber(ctx, heapStats.extraSize)});
  result.setProperty("capacity", {ctx, JSValueMakeNumber(ctx, heapStats.capacity)});
  result.setProperty("object_count", {ctx, JSValueMakeNumber(ctx, heapStats.objectCount)});

  return (JSObjectRef) result;
}

static JSValueRef nativeGetGCStats(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  JSGCStats gcStats = {0};
  JSGetGCStats(ctx, &gcStats);

  auto result = facebook::react::Object::create(ctx);
  result.setProperty(
      "last_full_gc_length",
      {ctx, JSValueMakeNumber(ctx, gcStats.lastFullGCLength)});
  result.setProperty(
      "last_eden_gc_length",
      {ctx, JSValueMakeNumber(ctx, gcStats.lastEdenGCLength)});

  return (JSObjectRef) result;
}

#endif

namespace facebook {
namespace react {

void addJSCPerfStatsHooks(JSGlobalContextRef ctx) {
#ifdef JSC_HAS_PERF_STATS_API
  installGlobalFunction(ctx, "nativeGetHeapStats", nativeGetHeapStats);
  installGlobalFunction(ctx, "nativeGetGCStats", nativeGetGCStats);
#endif
}

} }

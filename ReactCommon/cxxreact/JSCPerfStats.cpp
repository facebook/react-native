// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCPerfStats.h"

#ifdef JSC_HAS_PERF_STATS_API

#include <JavaScriptCore/JSPerfStats.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

using namespace facebook::react;

static JSValueRef nativeGetHeapStats(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  JSHeapStats heapStats = {0};
  JSGetHeapStats(ctx, &heapStats);

  auto result = Object::create(ctx);
  result.setProperty("size", Value::makeNumber(ctx, heapStats.size));
  result.setProperty("extra_size", Value::makeNumber(ctx, heapStats.extraSize));
  result.setProperty("capacity", Value::makeNumber(ctx, heapStats.capacity));
  result.setProperty("object_count", Value::makeNumber(ctx, heapStats.objectCount));
  result.setProperty("object_size", Value::makeNumber(ctx, heapStats.objectSizeAfterLastCollect));
  result.setProperty("object_capacity", Value::makeNumber(ctx, heapStats.objectCapacityAfterLastCollect));
  result.setProperty("block_size", Value::makeNumber(ctx, heapStats.blockSize));
  result.setProperty("malloc_size", Value::makeNumber(ctx, heapStats.mallocSize));
  return static_cast<JSObjectRef>(result);
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

  auto result = Object::create(ctx);
  result.setProperty("last_full_gc_length", Value::makeNumber(ctx, gcStats.lastFullGCLength));
  result.setProperty("last_eden_gc_length", Value::makeNumber(ctx, gcStats.lastEdenGCLength));
  return static_cast<JSObjectRef>(result);
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

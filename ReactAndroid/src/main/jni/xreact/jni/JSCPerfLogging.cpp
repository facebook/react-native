// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCPerfLogging.h"

#include <fb/log.h>
#include <fb/fbjni.h>
#include <react/JSCHelpers.h>

using namespace facebook::jni;

struct _jqplProvider : _jobject {};
using jqplProvider = _jqplProvider*;

struct _jqpl : _jobject {};
using jqpl = _jqpl*;

namespace facebook { namespace jni {


template<>
class JObjectWrapper<jqpl> : public JObjectWrapper<jobject> {

 public:
  static constexpr const char* kJavaDescriptor = "Lcom/facebook/quicklog/QuickPerformanceLogger;";

  using JObjectWrapper<jobject>::JObjectWrapper;

  void markerStart(int markerId, int instanceKey, long timestamp) {
    static auto markerStartMethod =
      qplClass()->getMethod<void(int32_t, int32_t, int64_t)>("markerStart");
    markerStartMethod(this_, markerId, instanceKey, timestamp);
  }

  void markerEnd(int markerId, int instanceKey, short actionId, long timestamp) {
    static auto markerEndMethod =
      qplClass()->getMethod<void(int32_t, int32_t, int16_t, int64_t)>("markerEnd");
    markerEndMethod(this_, markerId, instanceKey, actionId, timestamp);
  }

  void markerNote(int markerId, int instanceKey, short actionId, long timestamp) {
    static auto markerNoteMethod =
      qplClass()->getMethod<void(int32_t, int32_t, int16_t, int64_t)>("markerNote");
    markerNoteMethod(this_, markerId, instanceKey, actionId, timestamp);
  }

  void markerCancel(int markerId, int instanceKey) {
    static auto markerCancelMethod =
      qplClass()->getMethod<void(int32_t, int32_t)>("markerCancel");
    markerCancelMethod(this_, markerId, instanceKey);
  }

  int64_t currentMonotonicTimestamp() {
    static auto currentTimestampMethod =
      qplClass()->getMethod<int64_t()>("currentMonotonicTimestamp");
    return currentTimestampMethod(this_);
  }

 private:

  static alias_ref<jclass> qplClass() {
    static auto cls = findClassStatic("com/facebook/quicklog/QuickPerformanceLogger");
    return cls;
  }

};
using JQuickPerformanceLogger = JObjectWrapper<jqpl>;


template<>
class JObjectWrapper<jqplProvider> : public JObjectWrapper<jobject> {
 public:
  static constexpr const char* kJavaDescriptor =
    "Lcom/facebook/quicklog/QuickPerformanceLoggerProvider;";

  using JObjectWrapper<jobject>::JObjectWrapper;

  static global_ref<jqpl> get() {
    static auto getQPLInstMethod = qplProviderClass()->getStaticMethod<jqpl()>("getQPLInstance");
    static global_ref<jqpl> theQpl = make_global(getQPLInstMethod(qplProviderClass().get()));
    return theQpl;
  }

  static bool check() {
    static auto getQPLInstMethod = qplProviderClass()->getStaticMethod<jqpl()>("getQPLInstance");
    auto theQpl = getQPLInstMethod(qplProviderClass().get());
    return (theQpl.get() != nullptr);
  }

 private:

  static alias_ref<jclass> qplProviderClass() {
    static auto cls = findClassStatic("com/facebook/quicklog/QuickPerformanceLoggerProvider");
    return cls;
  }
};
using JQuickPerformanceLoggerProvider = JObjectWrapper<jqplProvider>;

}}

static bool isReady() {
  static bool ready = false;
  if (!ready) {
    try {
      findClassStatic("com/facebook/quicklog/QuickPerformanceLoggerProvider");
    } catch(...) {
      // Swallow this exception - we don't want to crash the app, an error is enough.
      FBLOGE("Calling QPL from JS before class has been loaded in Java. Ignored.");
      return false;
    }
    if (JQuickPerformanceLoggerProvider::check()) {
      ready = true;
    } else {
      FBLOGE("Calling QPL from JS before it has been initialized in Java. Ignored.");
      return false;
    }
  }
  return ready;
}

// After having read the implementation of PNaN that is returned from JSValueToNumber, and some
// more material on how NaNs are constructed, I think this is the most consistent way to verify
// NaN with how we generate it.
// Once the integration completes, I'll play around with it some more and potentially change this
// implementation to use std::isnan() if it is exactly commensurate with our usage.
static bool isNan(double value) {
  return (value != value);
}

// Safely translates JSValues to an array of doubles.
static bool grabDoubles(
    size_t targetsCount,
    double targets[],
    JSContextRef ctx,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (argumentCount < targetsCount) {
    return false;
  }
  for (size_t i = 0 ; i < targetsCount ; i++) {
    targets[i] = JSValueToNumber(ctx, arguments[i], exception);
    if (isNan(targets[i])) {
      return false;
    }
  }
  return true;
}

static JSValueRef nativeQPLMarkerStart(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  double targets[3];
  if (isReady() && grabDoubles(3, targets, ctx, argumentCount, arguments, exception)) {
    int32_t markerId = (int32_t) targets[0];
    int32_t instanceKey = (int32_t) targets[1];
    int64_t timestamp = (int64_t) targets[2];
    JQuickPerformanceLoggerProvider::get()->markerStart(markerId, instanceKey, timestamp);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeQPLMarkerEnd(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  double targets[4];
  if (isReady() && grabDoubles(4, targets, ctx, argumentCount, arguments, exception)) {
    int32_t markerId = (int32_t) targets[0];
    int32_t instanceKey = (int32_t) targets[1];
    int16_t actionId = (int16_t) targets[2];
    int64_t timestamp = (int64_t) targets[3];
    JQuickPerformanceLoggerProvider::get()->markerEnd(markerId, instanceKey, actionId, timestamp);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeQPLMarkerNote(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  double targets[4];
  if (isReady() && grabDoubles(4, targets, ctx, argumentCount, arguments, exception)) {
    int32_t markerId = (int32_t) targets[0];
    int32_t instanceKey = (int32_t) targets[1];
    int16_t actionId = (int16_t) targets[2];
    int64_t timestamp = (int64_t) targets[3];
    JQuickPerformanceLoggerProvider::get()->markerNote(markerId, instanceKey, actionId, timestamp);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeQPLMarkerCancel(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  double targets[2];
  if (isReady() && grabDoubles(2, targets, ctx, argumentCount, arguments, exception)) {
    int32_t markerId = (int32_t) targets[0];
    int32_t instanceKey = (int32_t) targets[1];
    JQuickPerformanceLoggerProvider::get()->markerCancel(markerId, instanceKey);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeQPLTimestamp(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (!isReady()) {
    return JSValueMakeNumber(ctx, 0);
  }
  int64_t timestamp = JQuickPerformanceLoggerProvider::get()->currentMonotonicTimestamp();
  // Since this is monotonic time, I assume the 52 bits of mantissa are enough in the double value.
  return JSValueMakeNumber(ctx, timestamp);
}

namespace facebook {
namespace react {

void addNativePerfLoggingHooks(JSGlobalContextRef ctx) {
  installGlobalFunction(ctx, "nativeQPLMarkerStart", nativeQPLMarkerStart);
  installGlobalFunction(ctx, "nativeQPLMarkerEnd", nativeQPLMarkerEnd);
  installGlobalFunction(ctx, "nativeQPLMarkerNote", nativeQPLMarkerNote);
  installGlobalFunction(ctx, "nativeQPLMarkerCancel", nativeQPLMarkerCancel);
  installGlobalFunction(ctx, "nativeQPLTimestamp", nativeQPLTimestamp);
}

} }

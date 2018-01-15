// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCPerfLogging.h"

#include <jschelpers/JSCHelpers.h>

#include <fb/log.h>
#include <fb/fbjni.h>

using namespace facebook::jni;

namespace facebook { namespace react {

struct JQuickPerformanceLogger : JavaClass<JQuickPerformanceLogger> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/quicklog/QuickPerformanceLogger;";

  void markerStart(int markerId, int instanceKey, long timestamp) {
    static auto markerStartMethod =
      javaClassStatic()->getMethod<void(jint, jint, jlong)>("markerStart");
    markerStartMethod(self(), markerId, instanceKey, timestamp);
  }

  void markerEnd(int markerId, int instanceKey, short actionId, long timestamp) {
    static auto markerEndMethod =
      javaClassStatic()->getMethod<void(jint, jint, jshort, jlong)>("markerEnd");
    markerEndMethod(self(), markerId, instanceKey, actionId, timestamp);
  }

  void markerTag(int markerId, int instanceKey, alias_ref<jstring> tag) {
    static auto markerTagMethod =
      javaClassStatic()->getMethod<void(jint, jint, alias_ref<jstring>)>("markerTag");
    markerTagMethod(self(), markerId, instanceKey, tag);
  }

  void markerAnnotate(
      int markerId,
      int instanceKey,
      alias_ref<jstring> key,
      alias_ref<jstring> value) {
    static auto markerAnnotateMethod = javaClassStatic()->
      getMethod<void(jint, jint, alias_ref<jstring>, alias_ref<jstring>)>("markerAnnotate");
    markerAnnotateMethod(self(), markerId, instanceKey, key, value);
  }

  void markerNote(int markerId, int instanceKey, short actionId, long timestamp) {
    static auto markerNoteMethod =
      javaClassStatic()->getMethod<void(jint, jint, jshort, jlong)>("markerNote");
    markerNoteMethod(self(), markerId, instanceKey, actionId, timestamp);
  }

  void markerCancel(int markerId, int instanceKey) {
    static auto markerCancelMethod =
      javaClassStatic()->getMethod<void(jint, jint)>("markerCancel");
    markerCancelMethod(self(), markerId, instanceKey);
  }

  int64_t currentMonotonicTimestamp() {
    static auto currentTimestampMethod =
      javaClassStatic()->getMethod<jlong()>("currentMonotonicTimestamp");
    return currentTimestampMethod(self());
  }
};

struct JQuickPerformanceLoggerProvider : JavaClass<JQuickPerformanceLoggerProvider> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/quicklog/QuickPerformanceLoggerProvider;";

  static alias_ref<JQuickPerformanceLogger::javaobject> get() {
    static auto getQPLInstMethod =
      javaClassStatic()->getStaticMethod<JQuickPerformanceLogger::javaobject()>("getQPLInstance");
    static auto logger = make_global(getQPLInstMethod(javaClassStatic()));
    return logger;
  }
};

static bool isReady() {
  static bool ready = false;
  if (!ready) {
    try {
      // TODO: findClassStatic only does the lookup once. If we can't find
      // QuickPerformanceLoggerProvider the first time we call this, we will always fail here.
      findClassStatic("com/facebook/quicklog/QuickPerformanceLoggerProvider");
    } catch(...) {
      // Swallow this exception - we don't want to crash the app, an error is enough.
      FBLOGE("Calling QPL from JS before class has been loaded in Java. Ignored.");
      return false;
    }
    if (JQuickPerformanceLoggerProvider::get()) {
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

static local_ref<jstring> getJStringFromJSValueRef(JSContextRef ctx, JSValueRef ref) {
    JSStringRef jsStringRef = JSValueToStringCopy(ctx, ref, nullptr);
    const JSChar* chars = JSStringGetCharactersPtr(jsStringRef);
    const size_t length = JSStringGetLength(jsStringRef);
    local_ref<jstring> returnStr = adopt_local(Environment::current()->NewString(chars, length));
    JSStringRelease(jsStringRef);
    return returnStr;
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

static JSValueRef nativeQPLMarkerTag(
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
    local_ref<jstring> tag = getJStringFromJSValueRef(ctx, arguments[2]);
    JQuickPerformanceLoggerProvider::get()->markerTag(markerId, instanceKey, tag);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeQPLMarkerAnnotate(
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
    local_ref<jstring> key = getJStringFromJSValueRef(ctx, arguments[2]);
    local_ref<jstring> value = getJStringFromJSValueRef(ctx, arguments[3]);
    JQuickPerformanceLoggerProvider::get()->markerAnnotate(markerId, instanceKey, key, value);
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

void addNativePerfLoggingHooks(JSGlobalContextRef ctx) {
  installGlobalFunction(ctx, "nativeQPLMarkerStart", nativeQPLMarkerStart);
  installGlobalFunction(ctx, "nativeQPLMarkerEnd", nativeQPLMarkerEnd);
  installGlobalFunction(ctx, "nativeQPLMarkerTag", nativeQPLMarkerTag);
  installGlobalFunction(ctx, "nativeQPLMarkerAnnotate", nativeQPLMarkerAnnotate);
  installGlobalFunction(ctx, "nativeQPLMarkerNote", nativeQPLMarkerNote);
  installGlobalFunction(ctx, "nativeQPLMarkerCancel", nativeQPLMarkerCancel);
  installGlobalFunction(ctx, "nativeQPLTimestamp", nativeQPLTimestamp);
}

} }

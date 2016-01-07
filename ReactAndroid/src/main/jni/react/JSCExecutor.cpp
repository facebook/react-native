// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCExecutor.h"

#include <algorithm>
#include <sstream>
#include <string>
#include <fb/log.h>
#include <folly/json.h>
#include <folly/String.h>
#include <jni/fbjni/Exceptions.h>
#include <sys/time.h>
#include "Value.h"
#include "jni/OnLoad.h"

#ifdef WITH_JSC_EXTRA_TRACING
#include <react/JSCTracing.h>
#include <react/JSCLegacyProfiler.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

#ifdef WITH_JSC_MEMORY_PRESSURE
#include <jsc_memory.h>
#endif

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

// Add native performance markers support
#include <react/JSCPerfLogging.h>

#ifdef WITH_FB_MEMORY_PROFILING
#include <react/JSCMemory.h>
#endif

#ifdef WITH_FB_JSC_TUNING
#include <jsc_config_android.h>
#endif

static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

using namespace facebook::jni;

namespace facebook {
namespace react {

static std::unordered_map<JSContextRef, JSCExecutor*> s_globalContextRefToJSCExecutor;
static JSValueRef nativeFlushQueueImmediate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);
static JSValueRef nativeLoggingHook(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);
static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);

static std::string executeJSCallWithJSC(
    JSGlobalContextRef ctx,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(
      TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor.executeJSCall",
      "method", methodName);
  #endif

  // Evaluate script with JSC
  folly::dynamic jsonArgs(arguments.begin(), arguments.end());
  auto js = folly::to<folly::fbstring>(
      "__fbBatchedBridge.", methodName, ".apply(null, ",
      folly::toJson(jsonArgs), ")");
  auto result = evaluateScript(ctx, String(js.c_str()), nullptr);
  return Value(ctx, result).toJSONString();
}

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(FlushImmediateCallback cb) {
  return std::unique_ptr<JSExecutor>(new JSCExecutor(cb));
}

JSCExecutor::JSCExecutor(FlushImmediateCallback cb) :
    m_flushImmediateCallback(cb) {
  m_context = JSGlobalContextCreateInGroup(nullptr, nullptr);
  s_globalContextRefToJSCExecutor[m_context] = this;
  installGlobalFunction(m_context, "nativeFlushQueueImmediate", nativeFlushQueueImmediate);
  installGlobalFunction(m_context, "nativeLoggingHook", nativeLoggingHook);
  installGlobalFunction(m_context, "nativePerformanceNow", nativePerformanceNow);

  #ifdef WITH_FB_JSC_TUNING
  configureJSCForAndroid();
  #endif

  #ifdef WITH_JSC_EXTRA_TRACING
  addNativeTracingHooks(m_context);
  addNativeProfilingHooks(m_context);
  addNativePerfLoggingHooks(m_context);
  #endif

  #ifdef WITH_FB_MEMORY_PROFILING
  addNativeMemoryHooks(m_context);
  #endif
}

JSCExecutor::~JSCExecutor() {
  s_globalContextRefToJSCExecutor.erase(m_context);
  JSGlobalContextRelease(m_context);
}

void JSCExecutor::executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) {
  JNIEnv* env = Environment::current();
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
  jmethodID logMarkerMethod = facebook::react::getLogMarkerMethod();
  jstring startStringMarker = env->NewStringUTF("executeApplicationScript_startStringConvert");
  jstring endStringMarker = env->NewStringUTF("executeApplicationScript_endStringConvert");

  env->CallStaticVoidMethod(markerClass, logMarkerMethod, startStringMarker);
  String jsScript = String::createExpectingAscii(script);
  env->CallStaticVoidMethod(markerClass, logMarkerMethod, endStringMarker);
  env->DeleteLocalRef(startStringMarker);
  env->DeleteLocalRef(endStringMarker);

  String jsSourceURL(sourceURL.c_str());
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor::executeApplicationScript",
    "sourceURL", sourceURL);
  #endif
  evaluateScript(m_context, jsScript, jsSourceURL);
}

std::string JSCExecutor::flush() {
  // TODO: Make this a first class function instead of evaling. #9317773
  return executeJSCallWithJSC(m_context, "flushedQueue", std::vector<folly::dynamic>());
}

std::string JSCExecutor::callFunction(const double moduleId, const double methodId, const folly::dynamic& arguments) {
  // TODO:  Make this a first class function instead of evaling. #9317773
  std::vector<folly::dynamic> call{
    (double) moduleId,
    (double) methodId,
    std::move(arguments),
  };
  return executeJSCallWithJSC(m_context, "callFunctionReturnFlushedQueue", std::move(call));
}

std::string JSCExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  // TODO: Make this a first class function instead of evaling. #9317773
  std::vector<folly::dynamic> call{
    (double) callbackId,
    std::move(arguments)
  };
  return executeJSCallWithJSC(m_context, "invokeCallbackAndReturnFlushedQueue", std::move(call));
}

void JSCExecutor::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  auto globalObject = JSContextGetGlobalObject(m_context);
  String jsPropertyName(propName.c_str());

  String jsValueJSON(jsonValue.c_str());
  auto valueToInject = JSValueMakeFromJSONString(m_context, jsValueJSON);

  JSObjectSetProperty(m_context, globalObject, jsPropertyName, valueToInject, 0, NULL);
}

bool JSCExecutor::supportsProfiling() {
  #ifdef WITH_FBSYSTRACE
  return true;
  #else
  return false;
  #endif
}

void JSCExecutor::startProfiler(const std::string &titleString) {
  #ifdef WITH_JSC_EXTRA_TRACING
  JSStringRef title = JSStringCreateWithUTF8CString(titleString.c_str());
  #if WITH_JSC_INTERNAL
  JSStartProfiling(m_context, title, false);
  #else
  JSStartProfiling(m_context, title);
  #endif
  JSStringRelease(title);
  #endif
}

void JSCExecutor::stopProfiler(const std::string &titleString, const std::string& filename) {
  #ifdef WITH_JSC_EXTRA_TRACING
  JSStringRef title = JSStringCreateWithUTF8CString(titleString.c_str());
  facebook::react::stopAndOutputProfilingFile(m_context, title, filename.c_str());
  JSStringRelease(title);
  #endif
}

void JSCExecutor::handleMemoryPressureModerate() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::MODERATE);
  #endif
}

void JSCExecutor::handleMemoryPressureCritical() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::CRITICAL);
  #endif
}

void JSCExecutor::flushQueueImmediate(std::string queueJSON) {
  m_flushImmediateCallback(queueJSON);
}

static JSValueRef createErrorString(JSContextRef ctx, const char *msg) {
  return JSValueMakeString(ctx, String(msg));
}

static JSValueRef nativeFlushQueueImmediate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  std::string resStr = Value(ctx, arguments[0]).toJSONString();

  executor->flushQueueImmediate(resStr);

  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeLoggingHook(
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

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  // This is equivalent to android.os.SystemClock.elapsedRealtime() in native
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC_RAW, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  return JSValueMakeNumber(ctx, (nano / (double)NANOSECONDS_IN_MILLISECOND));
}

} }

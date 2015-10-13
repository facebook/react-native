// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCExecutor.h"

#include <algorithm>
#include <sstream>
#include <string>
#include <fb/log.h>
#include <folly/json.h>
#include <folly/String.h>
#include "Value.h"

#ifdef WITH_JSC_EXTRA_TRACING
#include <react/JSCTracing.h>
#include <react/JSCLegacyProfiler.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

// Add native performance markers support
#include <react/JSCPerfLogging.h>

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

static JSValueRef evaluateScriptWithJSC(
    JSGlobalContextRef ctx,
    JSStringRef script,
    JSStringRef sourceURL) {
  JSValueRef exn;
  auto result = JSEvaluateScript(ctx, script, nullptr, sourceURL, 0, &exn);
  if (result == nullptr) {
    JSValueProtect(ctx, exn);
    std::string exceptionText = Value(ctx, exn).toString().str();
    FBLOGE("Got JS Exception: %s", exceptionText.c_str());
  }
  return result;
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
  #ifdef WITH_JSC_EXTRA_TRACING
  addNativeTracingHooks(m_context);
  addNativeProfilingHooks(m_context);
  addNativePerfLoggingHooks(m_context);
  #endif
}

JSCExecutor::~JSCExecutor() {
  s_globalContextRefToJSCExecutor.erase(m_context);
  JSGlobalContextRelease(m_context);
}

void JSCExecutor::executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) {
  String jsScript(script.c_str());
  String jsSourceURL(sourceURL.c_str());
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor::executeApplicationScript",
    "sourceURL", sourceURL);
  #endif
  evaluateScriptWithJSC(m_context, jsScript, jsSourceURL);
}

std::string JSCExecutor::executeJSCall(
    const std::string& moduleName,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(
      TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor.executeJSCall",
      "module", moduleName,
      "method", methodName);
  #endif

  // Evaluate script with JSC
  folly::dynamic jsonArgs(arguments.begin(), arguments.end());
  auto js = folly::to<folly::fbstring>(
      "require('", moduleName, "').", methodName, ".apply(null, ",
      folly::toJson(jsonArgs), ")");
  auto result = evaluateScriptWithJSC(m_context, String(js.c_str()), nullptr);
  JSValueProtect(m_context, result);
  return Value(m_context, result).toJSONString();
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
  JSStartProfiling(m_context, title);
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

  JSValueProtect(ctx, arguments[0]);
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
        static_cast<android_LogPriority>(level + ANDROID_LOG_VERBOSE),
        ANDROID_LOG_FATAL);
  }
  if (argumentCount > 0) {
    JSStringRef jsString = JSValueToStringCopy(ctx, arguments[0], NULL);
    String message = String::adopt(jsString);
    FBLOG_PRI(logLevel, "ReactNativeJS", "%s", message.str().c_str());
  }
  return JSValueMakeUndefined(ctx);
}

} }

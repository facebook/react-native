// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Value.h"

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include <stdexcept>
#include <algorithm>
#include <functional>

namespace facebook {
namespace react {

inline void throwJSExecutionException(const char* msg) {
  throw JSException(msg);
}

template <typename... Args>
inline void throwJSExecutionException(const char* fmt, Args... args) {
  int msgSize = snprintf(nullptr, 0, fmt, args...);
  msgSize = std::min(512, msgSize + 1);
  char *msg = (char*) alloca(msgSize);
  snprintf(msg, msgSize, fmt, args...);
  throw JSException(msg);
}

template <typename... Args>
inline void throwJSExecutionExceptionWithStack(const char* msg, const char* stack) {
  throw JSException(msg, stack);
}

using JSFunction = std::function<JSValueRef(JSContextRef, JSObjectRef, size_t, const JSValueRef[])>;

JSObjectRef makeFunction(
    JSContextRef ctx,
    const char* name,
    JSFunction function);

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSFunction function);

JSObjectRef makeFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback);

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback);

void installGlobalProxy(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectGetPropertyCallback callback);

void removeGlobal(JSGlobalContextRef ctx, const char* name);

JSValueRef makeJSCException(
    JSContextRef ctx,
    const char* exception_text);

JSValueRef evaluateScript(
    JSContextRef ctx,
    JSStringRef script,
    JSStringRef sourceURL);

#if WITH_FBJSCEXTENSIONS
JSValueRef evaluateSourceCode(
    JSContextRef ctx,
    JSSourceCodeRef source,
    JSStringRef sourceURL);
#endif

void formatAndThrowJSException(
    JSContextRef ctx,
    JSValueRef exn,
    JSStringRef sourceURL);

JSValueRef makeJSError(JSContextRef ctx, const char *error);

JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, const char *exceptionLocation);
JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, JSObjectRef jsFunctionCause);

template<JSValueRef (method)(JSContextRef ctx,
        JSObjectRef function,
        JSObjectRef thisObject,
        size_t argumentCount,
        const JSValueRef arguments[],
        JSValueRef *exception)>
inline JSObjectCallAsFunctionCallback exceptionWrapMethod() {
  struct funcWrapper {
    static JSValueRef call(
        JSContextRef ctx,
        JSObjectRef function,
        JSObjectRef thisObject,
        size_t argumentCount,
        const JSValueRef arguments[],
        JSValueRef *exception) {
      try {
        return (*method)(ctx, function, thisObject, argumentCount, arguments, exception);
      } catch (...) {
        *exception = translatePendingCppExceptionToJSError(ctx, function);
        return JSValueMakeUndefined(ctx);
      }
    }
  };

  return &funcWrapper::call;
}

} }

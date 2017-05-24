// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <algorithm>
#include <functional>
#include <stdexcept>

#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Value.h>

namespace facebook {
namespace react {

class JSException : public std::exception {
public:
  explicit JSException(const char* msg)
    : msg_(msg), stack_(nullptr) {}

  template <typename... Args>
  explicit JSException(const char* fmt, Args... args) {
    int msgSize = snprintf(nullptr, 0, fmt, args...);
    msgSize = std::min(512, msgSize + 1);
    char *msg = (char *) alloca(msgSize);
    snprintf(msg, msgSize, fmt, args...);
    msg_ = msg;
  }

  explicit JSException(JSContextRef ctx, JSValueRef exn, const char* msg = nullptr, JSStringRef sourceURL = nullptr);

  const std::string& getStack() const {
    return stack_;
  }

  virtual const char* what() const noexcept override {
    return msg_.c_str();
  }

private:
  std::string msg_;
  std::string stack_;
};

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
        return JSC_JSValueMakeUndefined(ctx);
      }
    }
  };

  return &funcWrapper::call;
}

} }

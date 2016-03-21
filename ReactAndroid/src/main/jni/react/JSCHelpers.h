// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include <alloca.h>
#include <stdexcept>
#include <algorithm>

namespace facebook {
namespace react {

struct JsException : std::runtime_error {
  using std::runtime_error::runtime_error;
};

inline void throwJSExecutionException(const char* msg) {
  throw JsException(msg);
}

template <typename... Args>
inline void throwJSExecutionException(const char* fmt, Args... args) {
  int msgSize = snprintf(nullptr, 0, fmt, args...);
  msgSize = std::min(512, msgSize + 1);
  char *msg = (char*) alloca(msgSize);
  snprintf(msg, msgSize, fmt, args...);
  throw JsException(msg);
}

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback);

JSValueRef makeJSCException(
    JSContextRef ctx,
    const char* exception_text);

JSValueRef evaluateScript(
    JSContextRef ctx,
    JSStringRef script,
    JSStringRef sourceURL,
    const char* cachePath = nullptr);

} }

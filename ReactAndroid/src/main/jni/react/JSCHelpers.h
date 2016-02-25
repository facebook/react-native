// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include <stdexcept>
#include <algorithm>

#include "AlignStack.h"

namespace facebook {
namespace react {

struct JsException : std::runtime_error {
  using std::runtime_error::runtime_error;
};

ALIGN_STACK
inline void throwJSExecutionException(const char* msg) {
  throw JsException(msg);
}

template <typename... Args>
ALIGN_STACK
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
    JSObjectCallAsFunctionCallback callback) ALIGN_STACK;

JSValueRef makeJSCException(
    JSContextRef ctx,
    const char* exception_text) ALIGN_STACK;

JSValueRef evaluateScript(
    JSContextRef ctx,
    JSStringRef script,
    JSStringRef sourceURL,
    const char* cachePath = nullptr) ALIGN_STACK;

} }

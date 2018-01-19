// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <cxxreact/JSExecutor.h>
#include <cxxreact/MessageQueueThread.h>
#include <jschelpers/JavaScriptCore.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

namespace ReactMarker {

enum ReactMarkerId {
  NATIVE_REQUIRE_START,
  NATIVE_REQUIRE_STOP,
  RUN_JS_BUNDLE_START,
  RUN_JS_BUNDLE_STOP,
  CREATE_REACT_CONTEXT_STOP,
  JS_BUNDLE_STRING_CONVERT_START,
  JS_BUNDLE_STRING_CONVERT_STOP,
  NATIVE_MODULE_SETUP_START,
  NATIVE_MODULE_SETUP_STOP,
};

#ifdef __APPLE__
using LogTaggedMarker = std::function<void(const ReactMarkerId, const char* tag)>;
#else
typedef void(*LogTaggedMarker)(const ReactMarkerId, const char* tag);
#endif
extern RN_EXPORT LogTaggedMarker logTaggedMarker;

extern void logMarker(const ReactMarkerId markerId);

}

namespace JSCNativeHooks {

using Hook = JSValueRef(*)(
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception);
extern RN_EXPORT Hook loggingHook;
extern RN_EXPORT Hook nowHook;

typedef void(*ConfigurationHook)(JSGlobalContextRef);
extern RN_EXPORT ConfigurationHook installPerfHooks;

}

} }

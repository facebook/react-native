// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <cxxreact/Executor.h>
#include <cxxreact/MessageQueueThread.h>
#include <jschelpers/JavaScriptCore.h>

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
};
using LogMarker = std::function<void(const ReactMarkerId)>;
extern LogMarker logMarker;
};

namespace PerfLogging {
using InstallNativeHooks = std::function<void(JSGlobalContextRef)>;
extern InstallNativeHooks installNativeHooks;
};

namespace JSNativeHooks {
  using Hook = JSValueRef (*) (
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  extern Hook loggingHook;
  extern Hook nowHook;
}

} }

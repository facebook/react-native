// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <JavaScriptCore/JSContextRef.h>

namespace facebook {
namespace react {

namespace ReactMarker {
using LogMarker = std::function<void(const std::string&)>;
extern LogMarker logMarker;
};

namespace WebWorkerUtil {
using LoadScriptFromAssets = std::function<std::string(const std::string& assetName)>;
extern LoadScriptFromAssets loadScriptFromAssets;
};

namespace PerfLogging {
using InstallNativeHooks = std::function<void(JSGlobalContextRef)>;
extern InstallNativeHooks installNativeHooks;
}

namespace JSLogging {
  using JSCNativeHook = JSValueRef (*) (
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[], JSValueRef *exception);
  extern JSCNativeHook nativeHook;
}

} }

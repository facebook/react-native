// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <cxxreact/ReactMarker.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

#if (!defined (NOJSC)) && (!V8_ENABLED)
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

#endif // (!defined (NOJSC)) && (!V8_ENABLED)

// Logging levels are aligned with devmain's logging level
// which are present at %SRCROOT%\liblet\Logging\androidjava\src\com\microsoft\office\loggingapi\Logging.java
namespace Logging {
  enum LoggingLevel {VERBOSE = 200, INFO = 50, WARNING = 15, ERROR = 10};

  //const std::string LOGGING_LEVEL_KEY("LoggingLevel");

  LoggingLevel forValue(int level);

  LoggingLevel getLevel();

  void setLevel(LoggingLevel loggingLevel);
}

} }

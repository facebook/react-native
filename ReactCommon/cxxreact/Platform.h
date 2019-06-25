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

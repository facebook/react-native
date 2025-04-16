/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultLogger.h"

#include <glog/logging.h>
#include <logger/react_native_log.h>
#include <string>

namespace facebook::react {

Logger getDefaultLogger() {
  return [](const std::string& message, unsigned int logLevel) {
    static std::string tag = "[JavaScript]: ";
    switch (logLevel) {
      case ReactNativeLogLevelFatal:
      case ReactNativeLogLevelError:
        LOG(ERROR) << tag << message;
        break;
      case ReactNativeLogLevelWarning:
        LOG(WARNING) << tag << message;
        break;
      case ReactNativeLogLevelInfo:
      default:
        LOG(INFO) << tag << message;
        break;
    }
  };
}

} // namespace facebook::react

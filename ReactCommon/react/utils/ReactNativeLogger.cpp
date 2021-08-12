/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactNativeLogger.h"
#include <glog/logging.h>

namespace facebook {
namespace react {
namespace ReactNativeLogger {

void info(std::string const &text) {
  LOG(INFO) << text;
}

void warning(std::string const &text) {
  LOG(WARNING) << text;
}

void error(std::string const &text) {
  LOG(ERROR) << text;
}

} // namespace ReactNativeLogger
} // namespace react
} // namespace facebook

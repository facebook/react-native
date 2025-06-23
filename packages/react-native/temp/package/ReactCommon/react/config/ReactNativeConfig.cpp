/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactNativeConfig.h"

namespace facebook::react {

bool EmptyReactNativeConfig::getBool(const std::string& param) const {
  if (param == "react_fabric:enabled_automatic_interop_android") {
    return true;
  }
  return false;
}

std::string EmptyReactNativeConfig::getString(const std::string& param) const {
  return "";
}

int64_t EmptyReactNativeConfig::getInt64(const std::string& param) const {
  return 0;
}

double EmptyReactNativeConfig::getDouble(const std::string& param) const {
  return 0.0;
}

} // namespace facebook::react

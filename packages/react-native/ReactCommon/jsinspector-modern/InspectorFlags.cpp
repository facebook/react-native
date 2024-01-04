/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>
#include <cassert>

#include "InspectorFlags.h"

namespace facebook::react::jsinspector_modern {

InspectorFlags& InspectorFlags::getInstance() {
  static InspectorFlags instance;
  return instance;
}

void InspectorFlags::initFromConfig(
    const ReactNativeConfig& reactNativeConfig) {
  bool enableModernCDPRegistry =
      reactNativeConfig.getBool("react_native_devx:enable_modern_cdp_registry");
  if (enableModernCDPRegistry_.has_value()) {
    assert(
        *enableModernCDPRegistry_ == enableModernCDPRegistry &&
        "Flag value was changed after init");
  }
  enableModernCDPRegistry_ = enableModernCDPRegistry;
  bool enableCxxInspectorPackagerConnection = reactNativeConfig.getBool(
      "react_native_devx:enable_cxx_inspector_packager_connection");
  if (enableCxxInspectorPackagerConnection_.has_value()) {
    assert(
        *enableCxxInspectorPackagerConnection_ ==
            enableCxxInspectorPackagerConnection &&
        "Flag value was changed after init");
  }
  enableCxxInspectorPackagerConnection_ = enableCxxInspectorPackagerConnection;
}

bool InspectorFlags::getEnableModernCDPRegistry() const {
  if (!enableModernCDPRegistry_.has_value()) {
    LOG(WARNING)
        << "InspectorFlags::getEnableModernCDPRegistry was called before init";
  }
  return enableModernCDPRegistry_.value_or(false);
}

bool InspectorFlags::getEnableCxxInspectorPackagerConnection() const {
  if (!enableCxxInspectorPackagerConnection_.has_value()) {
    LOG(WARNING)
        << "InspectorFlags::getEnableCxxInspectorPackagerConnection was called before init";
  }
  return enableCxxInspectorPackagerConnection_.value_or(false);
}

} // namespace facebook::react::jsinspector_modern

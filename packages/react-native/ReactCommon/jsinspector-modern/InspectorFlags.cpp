/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorFlags.h"

#include <glog/logging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react::jsinspector_modern {

InspectorFlags& InspectorFlags::getInstance() {
  static InspectorFlags instance;
  return instance;
}

InspectorFlags::InspectorFlags()
    : enableModernCDPRegistry_(
          ReactNativeFeatureFlags::inspectorEnableModernCDPRegistry()),
      enableCxxInspectorPackagerConnection_(
          ReactNativeFeatureFlags::
              inspectorEnableCxxInspectorPackagerConnection()) {}

bool InspectorFlags::getEnableModernCDPRegistry() const {
  assertFlagsMatchUpstream();
  return enableModernCDPRegistry_;
}

bool InspectorFlags::getEnableCxxInspectorPackagerConnection() const {
  assertFlagsMatchUpstream();
  return enableCxxInspectorPackagerConnection_ ||
      // If we are using the modern CDP registry, then we must also use the C++
      // InspectorPackagerConnection implementation.
      enableModernCDPRegistry_;
}

void InspectorFlags::assertFlagsMatchUpstream() const {
  if (inconsistentFlagsStateLogged_) {
    return;
  }

  if (enableModernCDPRegistry_ !=
          ReactNativeFeatureFlags::inspectorEnableModernCDPRegistry() ||
      enableCxxInspectorPackagerConnection_ !=
          ReactNativeFeatureFlags::
              inspectorEnableCxxInspectorPackagerConnection()) {
    LOG(ERROR)
        << "[InspectorFlags] Error: One or more ReactNativeFeatureFlags values "
        << "have changed during the global app lifetime. This may lead to "
        << "inconsistent inspector behaviour. Please quit and restart the app.";
    inconsistentFlagsStateLogged_ = true;
  }
}

} // namespace facebook::react::jsinspector_modern

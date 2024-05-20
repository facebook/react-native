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

bool InspectorFlags::getEnableModernCDPRegistry() const {
  return loadFlagsAndAssertUnchanged().enableModernCDPRegistry;
}

bool InspectorFlags::getEnableCxxInspectorPackagerConnection() const {
  auto& values = loadFlagsAndAssertUnchanged();

  return values.enableCxxInspectorPackagerConnection ||
      // If we are using the modern CDP registry, then we must also use the C++
      // InspectorPackagerConnection implementation.
      values.enableModernCDPRegistry;
}

void InspectorFlags::dangerouslyResetFlags() {
  *this = InspectorFlags{};
}

const InspectorFlags::Values& InspectorFlags::loadFlagsAndAssertUnchanged()
    const {
  InspectorFlags::Values newValues = {
      .enableCxxInspectorPackagerConnection =
#ifdef REACT_NATIVE_FORCE_ENABLE_FUSEBOX
          true,
#else
          ReactNativeFeatureFlags::
              inspectorEnableCxxInspectorPackagerConnection(),
#endif
      .enableModernCDPRegistry =
#ifdef REACT_NATIVE_FORCE_ENABLE_FUSEBOX
          true,
#else
          ReactNativeFeatureFlags::inspectorEnableModernCDPRegistry(),
#endif
  };

  if (cachedValues_.has_value() && !inconsistentFlagsStateLogged_) {
    if (cachedValues_ != newValues) {
      LOG(ERROR)
          << "[InspectorFlags] Error: One or more ReactNativeFeatureFlags values "
          << "have changed during the global app lifetime. This may lead to "
          << "inconsistent inspector behaviour. Please quit and restart the app.";
      inconsistentFlagsStateLogged_ = true;
    }
  }

  cachedValues_ = newValues;

  return cachedValues_.value();
}

} // namespace facebook::react::jsinspector_modern

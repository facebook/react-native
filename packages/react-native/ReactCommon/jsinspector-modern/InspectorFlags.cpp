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

bool InspectorFlags::getFuseboxEnabled() const {
  return loadFlagsAndAssertUnchanged().fuseboxEnabledDebug;
}

void InspectorFlags::dangerouslyResetFlags() {
  *this = InspectorFlags{};
}

const InspectorFlags::Values& InspectorFlags::loadFlagsAndAssertUnchanged()
    const {
  InspectorFlags::Values newValues = {
      .fuseboxEnabledDebug =
#ifdef REACT_NATIVE_FORCE_ENABLE_FUSEBOX
          true,
#elif defined(HERMES_ENABLE_DEBUGGER)
          ReactNativeFeatureFlags::fuseboxEnabledDebug(),
#else
          ReactNativeFeatureFlags::fuseboxEnabledRelease(),
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

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
  return loadFlagsAndAssertUnchanged().fuseboxEnabled;
}

void InspectorFlags::dangerouslyResetFlags() {
  *this = InspectorFlags{};
}

#if defined(REACT_NATIVE_FORCE_ENABLE_FUSEBOX) && \
    defined(REACT_NATIVE_FORCE_DISABLE_FUSEBOX)
#error \
    "Cannot define both REACT_NATIVE_FORCE_ENABLE_FUSEBOX and REACT_NATIVE_FORCE_DISABLE_FUSEBOX"
#endif

const InspectorFlags::Values& InspectorFlags::loadFlagsAndAssertUnchanged()
    const {
  InspectorFlags::Values newValues = {
      .fuseboxEnabled =
#if defined(REACT_NATIVE_FORCE_ENABLE_FUSEBOX)
          true,
#elif defined(REACT_NATIVE_FORCE_DISABLE_FUSEBOX)
          false,
#elif defined(HERMES_ENABLE_DEBUGGER) && \
    defined(REACT_NATIVE_ENABLE_FUSEBOX_DEBUG)
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

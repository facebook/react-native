/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorFlagOverridesGuard.h"

#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * Helper class that maps \c InspectorFlagOverrides to the shape of \c
 * ReactNativeFeatureFlagsDefaults.
 */
class ReactNativeFeatureFlagsOverrides
    : public ReactNativeFeatureFlagsDefaults {
 public:
  explicit ReactNativeFeatureFlagsOverrides(
      const InspectorFlagOverrides& overrides)
      : overrides_(overrides) {}

  bool fuseboxEnabledDebug() override {
    return overrides_.fuseboxEnabledDebug.value_or(
        ReactNativeFeatureFlagsDefaults::fuseboxEnabledDebug());
  }

 private:
  InspectorFlagOverrides overrides_;
};

InspectorFlagOverridesGuard::InspectorFlagOverridesGuard(
    const InspectorFlagOverrides& overrides) {
  InspectorFlags::getInstance().dangerouslyResetFlags();
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsOverrides>(overrides));
}

InspectorFlagOverridesGuard::~InspectorFlagOverridesGuard() {
  ReactNativeFeatureFlags::dangerouslyReset();
}

} // namespace facebook::react::jsinspector_modern

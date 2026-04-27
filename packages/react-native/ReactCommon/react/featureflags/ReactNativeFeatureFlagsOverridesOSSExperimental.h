/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<577f69448b914525ff64e851c6019c1f>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSCanary.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverridesOSSExperimental : public ReactNativeFeatureFlagsOverridesOSSCanary {
 public:
    ReactNativeFeatureFlagsOverridesOSSExperimental() = default;

  bool cxxNativeAnimatedEnabled() override {
    return true;
  }

  bool enableAccessibilityOrder() override {
    return true;
  }

  bool enableIOSExperimentalAutoFocusImplementation() override {
    return true;
  }

  bool enableSwiftUIBasedFilters() override {
    return true;
  }

  bool preventShadowTreeCommitExhaustion() override {
    return true;
  }

  bool useSharedAnimatedBackend() override {
    return true;
  }
};

} // namespace facebook::react

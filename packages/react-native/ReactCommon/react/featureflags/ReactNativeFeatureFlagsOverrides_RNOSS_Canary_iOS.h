/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<2ef29591c9c09a0aa834ab8b73f8df13>>
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

#include <react/featureflags/ReactNativeFeatureFlagsOverrides_RNOSS_Stable_iOS.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverrides_RNOSS_Canary_iOS : public ReactNativeFeatureFlagsOverrides_RNOSS_Stable_iOS {
 public:
    ReactNativeFeatureFlagsOverrides_RNOSS_Canary_iOS() = default;







  bool enableBridgelessArchitecture() override {
    return true;
  }







  bool enableFabricRenderer() override {
    return true;
  }























































  bool useFabricInterop() override {
    return true;
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    return true;
  }





  bool useTurboModuleInterop() override {
    return true;
  }

  bool useTurboModules() override {
    return true;
  }
};

} // namespace facebook::react

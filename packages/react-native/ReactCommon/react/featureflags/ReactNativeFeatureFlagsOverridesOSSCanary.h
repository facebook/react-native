/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<825e61e4b94a95c4700a52a1d9cadb74>>
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

#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSStable.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverridesOSSCanary : public ReactNativeFeatureFlagsOverridesOSSStable {
 public:
    ReactNativeFeatureFlagsOverridesOSSCanary() = default;







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

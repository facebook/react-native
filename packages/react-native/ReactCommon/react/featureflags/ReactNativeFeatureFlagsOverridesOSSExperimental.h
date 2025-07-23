/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<c35e74abcb9b95a9c31854a32c282edd>>
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

  bool useNativeEqualsInNativeReadableArrayAndroid() override {
    return true;
  }

  bool useNativeTransformHelperAndroid() override {
    return true;
  }
};

} // namespace facebook::react

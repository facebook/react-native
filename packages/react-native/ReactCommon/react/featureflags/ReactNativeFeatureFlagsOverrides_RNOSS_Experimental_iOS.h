/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<d7312be3496ece1c2f6113273dd8f2db>>
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

#include <react/featureflags/ReactNativeFeatureFlagsOverrides_RNOSS_Canary_iOS.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_iOS : public ReactNativeFeatureFlagsOverrides_RNOSS_Canary_iOS {
 public:
    ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_iOS() = default;































  bool enableNewBackgroundAndBorderDrawables() override {
    return true;
  }


















































};

} // namespace facebook::react

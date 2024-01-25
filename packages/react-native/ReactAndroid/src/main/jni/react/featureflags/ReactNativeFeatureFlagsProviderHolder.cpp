/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<7a019bd967a22f93cd9e2e0ddb5201e3>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#include "ReactNativeFeatureFlagsProviderHolder.h"

namespace facebook::react {

bool ReactNativeFeatureFlagsProviderHolder::commonTestFlag() {
  static const auto method =
      facebook::jni::findClassStatic(
          "com/facebook/react/internal/featureflags/ReactNativeFeatureFlagsProvider")
          ->getMethod<jboolean()>("commonTestFlag");
  return method(javaProvider_);
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<f8b92fe90e60292ea2f88a4659e3fd50>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

/**
 * Implementation of ReactNativeFeatureFlagsProvider that wraps a
 * ReactNativeFeatureFlagsProvider Java object.
 */
class ReactNativeFeatureFlagsProviderHolder
    : public ReactNativeFeatureFlagsProvider {
 public:
  explicit ReactNativeFeatureFlagsProviderHolder(
      jni::alias_ref<jobject> javaProvider)
      : javaProvider_(make_global(javaProvider)){};

  bool commonTestFlag() override;
  bool useModernRuntimeScheduler() override;
  bool enableMicrotasks() override;
  bool batchRenderingUpdatesInEventLoop() override;
  bool enableSpannableBuildingUnification() override;
  bool enableCustomDrawOrderFabric() override;
  bool enableFixForClippedSubviewsCrash() override;

 private:
  jni::global_ref<jobject> javaProvider_;
};

} // namespace facebook::react

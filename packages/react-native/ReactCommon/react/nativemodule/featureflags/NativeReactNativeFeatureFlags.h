/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<0d9f67bdf91897c7b99f103c080392e5>>
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

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>

namespace facebook::react {

class NativeReactNativeFeatureFlags
    : public NativeReactNativeFeatureFlagsCxxSpec<
          NativeReactNativeFeatureFlags>,
      std::enable_shared_from_this<NativeReactNativeFeatureFlags> {
 public:
  NativeReactNativeFeatureFlags(std::shared_ptr<CallInvoker> jsInvoker);

  bool commonTestFlag(jsi::Runtime& runtime);

  bool useModernRuntimeScheduler(jsi::Runtime& runtime);

  bool enableMicrotasks(jsi::Runtime& runtime);

  bool batchRenderingUpdatesInEventLoop(jsi::Runtime& runtime);

  bool inspectorEnableCXXInspectorPackagerConnection(jsi::Runtime& runtime);

  bool inspectorEnableModernCDPRegistry(jsi::Runtime& runtime);
};

} // namespace facebook::react

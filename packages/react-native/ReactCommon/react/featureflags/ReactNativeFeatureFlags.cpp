/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<82f226df2b3824d03b755a042b20bec5>>
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

#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

bool ReactNativeFeatureFlags::commonTestFlag() {
  return getAccessor().commonTestFlag();
}

bool ReactNativeFeatureFlags::enableBackgroundExecutor() {
  return getAccessor().enableBackgroundExecutor();
}

bool ReactNativeFeatureFlags::useModernRuntimeScheduler() {
  return getAccessor().useModernRuntimeScheduler();
}

bool ReactNativeFeatureFlags::enableMicrotasks() {
  return getAccessor().enableMicrotasks();
}

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return getAccessor().batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::enableSpannableBuildingUnification() {
  return getAccessor().enableSpannableBuildingUnification();
}

bool ReactNativeFeatureFlags::enableCustomDrawOrderFabric() {
  return getAccessor().enableCustomDrawOrderFabric();
}

bool ReactNativeFeatureFlags::enableFixForClippedSubviewsCrash() {
  return getAccessor().enableFixForClippedSubviewsCrash();
}

bool ReactNativeFeatureFlags::inspectorEnableCxxInspectorPackagerConnection() {
  return getAccessor().inspectorEnableCxxInspectorPackagerConnection();
}

bool ReactNativeFeatureFlags::inspectorEnableModernCDPRegistry() {
  return getAccessor().inspectorEnableModernCDPRegistry();
}

void ReactNativeFeatureFlags::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  getAccessor().override(std::move(provider));
}

void ReactNativeFeatureFlags::dangerouslyReset() {
  getAccessor(true);
}

ReactNativeFeatureFlagsAccessor& ReactNativeFeatureFlags::getAccessor(
    bool reset) {
  static std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor;
  if (accessor == nullptr || reset) {
    accessor = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  }
  return *accessor;
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<fd7ff07ffc0f5f7b2d553a6b5064a1c0>>
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

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return getAccessor().batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::enableBackgroundExecutor() {
  return getAccessor().enableBackgroundExecutor();
}

bool ReactNativeFeatureFlags::enableCustomDrawOrderFabric() {
  return getAccessor().enableCustomDrawOrderFabric();
}

bool ReactNativeFeatureFlags::enableFixForClippedSubviewsCrash() {
  return getAccessor().enableFixForClippedSubviewsCrash();
}

bool ReactNativeFeatureFlags::enableMicrotasks() {
  return getAccessor().enableMicrotasks();
}

bool ReactNativeFeatureFlags::enableMountHooksAndroid() {
  return getAccessor().enableMountHooksAndroid();
}

bool ReactNativeFeatureFlags::enableSpannableBuildingUnification() {
  return getAccessor().enableSpannableBuildingUnification();
}

bool ReactNativeFeatureFlags::inspectorEnableCxxInspectorPackagerConnection() {
  return getAccessor().inspectorEnableCxxInspectorPackagerConnection();
}

bool ReactNativeFeatureFlags::inspectorEnableModernCDPRegistry() {
  return getAccessor().inspectorEnableModernCDPRegistry();
}

bool ReactNativeFeatureFlags::skipMountHookNotifications() {
  return getAccessor().skipMountHookNotifications();
}

bool ReactNativeFeatureFlags::useModernRuntimeScheduler() {
  return getAccessor().useModernRuntimeScheduler();
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

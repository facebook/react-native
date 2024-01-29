/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ae3f44dfb0e5672a8e47ce6ef32ba81e>>
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

#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

bool ReactNativeFeatureFlags::commonTestFlag() {
  return getAccessor().commonTestFlag();
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

bool ReactNativeFeatureFlags::inspectorEnableCXXInspectorPackagerConnection() {
  return getAccessor().inspectorEnableCXXInspectorPackagerConnection();
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

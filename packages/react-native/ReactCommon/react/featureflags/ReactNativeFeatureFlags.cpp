/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<a84c2654be6bc46c82c5dd466cdcf3b0>>
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

bool ReactNativeFeatureFlags::allowCollapsableChildren() {
  return getAccessor().allowCollapsableChildren();
}

bool ReactNativeFeatureFlags::androidEnablePendingFabricTransactions() {
  return getAccessor().androidEnablePendingFabricTransactions();
}

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return getAccessor().batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager() {
  return getAccessor().destroyFabricSurfacesInReactInstanceManager();
}

bool ReactNativeFeatureFlags::enableBackgroundExecutor() {
  return getAccessor().enableBackgroundExecutor();
}

bool ReactNativeFeatureFlags::enableCleanTextInputYogaNode() {
  return getAccessor().enableCleanTextInputYogaNode();
}

bool ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation() {
  return getAccessor().enableGranularShadowTreeStateReconciliation();
}

bool ReactNativeFeatureFlags::enableMicrotasks() {
  return getAccessor().enableMicrotasks();
}

bool ReactNativeFeatureFlags::enableSynchronousStateUpdates() {
  return getAccessor().enableSynchronousStateUpdates();
}

bool ReactNativeFeatureFlags::enableUIConsistency() {
  return getAccessor().enableUIConsistency();
}

bool ReactNativeFeatureFlags::fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak() {
  return getAccessor().fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak();
}

bool ReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid() {
  return getAccessor().forceBatchingMountItemsOnAndroid();
}

bool ReactNativeFeatureFlags::fuseboxEnabled() {
  return getAccessor().fuseboxEnabled();
}

bool ReactNativeFeatureFlags::lazyAnimationCallbacks() {
  return getAccessor().lazyAnimationCallbacks();
}

bool ReactNativeFeatureFlags::preventDoubleTextMeasure() {
  return getAccessor().preventDoubleTextMeasure();
}

bool ReactNativeFeatureFlags::setAndroidLayoutDirection() {
  return getAccessor().setAndroidLayoutDirection();
}

bool ReactNativeFeatureFlags::useModernRuntimeScheduler() {
  return getAccessor().useModernRuntimeScheduler();
}

bool ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode() {
  return getAccessor().useNativeViewConfigsInBridgelessMode();
}

bool ReactNativeFeatureFlags::useStateAlignmentMechanism() {
  return getAccessor().useStateAlignmentMechanism();
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

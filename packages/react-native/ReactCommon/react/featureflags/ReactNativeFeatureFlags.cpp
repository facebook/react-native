/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<8410561a80edd67b4528181b1f8557fe>>
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

#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wglobal-constructors"
std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor_;
#pragma GCC diagnostic pop

bool ReactNativeFeatureFlags::commonTestFlag() {
  return getAccessor().commonTestFlag();
}

bool ReactNativeFeatureFlags::animatedShouldSignalBatch() {
  return getAccessor().animatedShouldSignalBatch();
}

bool ReactNativeFeatureFlags::cxxNativeAnimatedEnabled() {
  return getAccessor().cxxNativeAnimatedEnabled();
}

bool ReactNativeFeatureFlags::disableMainQueueSyncDispatchIOS() {
  return getAccessor().disableMainQueueSyncDispatchIOS();
}

bool ReactNativeFeatureFlags::disableMountItemReorderingAndroid() {
  return getAccessor().disableMountItemReorderingAndroid();
}

bool ReactNativeFeatureFlags::enableAccessibilityOrder() {
  return getAccessor().enableAccessibilityOrder();
}

bool ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid() {
  return getAccessor().enableAccumulatedUpdatesInRawPropsAndroid();
}

bool ReactNativeFeatureFlags::enableBridgelessArchitecture() {
  return getAccessor().enableBridgelessArchitecture();
}

bool ReactNativeFeatureFlags::enableCppPropsIteratorSetter() {
  return getAccessor().enableCppPropsIteratorSetter();
}

bool ReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid() {
  return getAccessor().enableCustomFocusSearchOnClippedElementsAndroid();
}

bool ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync() {
  return getAccessor().enableDestroyShadowTreeRevisionAsync();
}

bool ReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid() {
  return getAccessor().enableDoubleMeasurementFixAndroid();
}

bool ReactNativeFeatureFlags::enableEagerRootViewAttachment() {
  return getAccessor().enableEagerRootViewAttachment();
}

bool ReactNativeFeatureFlags::enableFabricLogs() {
  return getAccessor().enableFabricLogs();
}

bool ReactNativeFeatureFlags::enableFabricRenderer() {
  return getAccessor().enableFabricRenderer();
}

bool ReactNativeFeatureFlags::enableFixForParentTagDuringReparenting() {
  return getAccessor().enableFixForParentTagDuringReparenting();
}

bool ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout() {
  return getAccessor().enableFontScaleChangesUpdatingLayout();
}

bool ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox() {
  return getAccessor().enableIOSViewClipToPaddingBox();
}

bool ReactNativeFeatureFlags::enableJSRuntimeGCOnMemoryPressureOnIOS() {
  return getAccessor().enableJSRuntimeGCOnMemoryPressureOnIOS();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid() {
  return getAccessor().enableLayoutAnimationsOnAndroid();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS() {
  return getAccessor().enableLayoutAnimationsOnIOS();
}

bool ReactNativeFeatureFlags::enableMainQueueModulesOnIOS() {
  return getAccessor().enableMainQueueModulesOnIOS();
}

bool ReactNativeFeatureFlags::enableNativeCSSParsing() {
  return getAccessor().enableNativeCSSParsing();
}

bool ReactNativeFeatureFlags::enableNetworkEventReporting() {
  return getAccessor().enableNetworkEventReporting();
}

bool ReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables() {
  return getAccessor().enableNewBackgroundAndBorderDrawables();
}

bool ReactNativeFeatureFlags::enablePreparedTextLayout() {
  return getAccessor().enablePreparedTextLayout();
}

bool ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid() {
  return getAccessor().enablePropsUpdateReconciliationAndroid();
}

bool ReactNativeFeatureFlags::enableResourceTimingAPI() {
  return getAccessor().enableResourceTimingAPI();
}

bool ReactNativeFeatureFlags::enableSynchronousStateUpdates() {
  return getAccessor().enableSynchronousStateUpdates();
}

bool ReactNativeFeatureFlags::enableViewCulling() {
  return getAccessor().enableViewCulling();
}

bool ReactNativeFeatureFlags::enableViewRecycling() {
  return getAccessor().enableViewRecycling();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForText() {
  return getAccessor().enableViewRecyclingForText();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForView() {
  return getAccessor().enableViewRecyclingForView();
}

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return getAccessor().fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool ReactNativeFeatureFlags::fuseboxEnabledRelease() {
  return getAccessor().fuseboxEnabledRelease();
}

bool ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled() {
  return getAccessor().fuseboxNetworkInspectionEnabled();
}

bool ReactNativeFeatureFlags::incorporateMaxLinesDuringAndroidLayout() {
  return getAccessor().incorporateMaxLinesDuringAndroidLayout();
}

bool ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid() {
  return getAccessor().traceTurboModulePromiseRejectionsOnAndroid();
}

bool ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit() {
  return getAccessor().updateRuntimeShadowNodeReferencesOnCommit();
}

bool ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling() {
  return getAccessor().useAlwaysAvailableJSErrorHandling();
}

bool ReactNativeFeatureFlags::useFabricInterop() {
  return getAccessor().useFabricInterop();
}

bool ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode() {
  return getAccessor().useNativeViewConfigsInBridgelessMode();
}

bool ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid() {
  return getAccessor().useOptimizedEventBatchingOnAndroid();
}

bool ReactNativeFeatureFlags::useRawPropsJsiValue() {
  return getAccessor().useRawPropsJsiValue();
}

bool ReactNativeFeatureFlags::useShadowNodeStateOnClone() {
  return getAccessor().useShadowNodeStateOnClone();
}

bool ReactNativeFeatureFlags::useTurboModuleInterop() {
  return getAccessor().useTurboModuleInterop();
}

bool ReactNativeFeatureFlags::useTurboModules() {
  return getAccessor().useTurboModules();
}

void ReactNativeFeatureFlags::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  getAccessor().override(std::move(provider));
}

void ReactNativeFeatureFlags::dangerouslyReset() {
  accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
}

std::optional<std::string> ReactNativeFeatureFlags::dangerouslyForceOverride(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  auto accessor = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  accessor->override(std::move(provider));

  std::swap(accessor_, accessor);

  // Now accessor is the old accessor
  return accessor == nullptr ? std::nullopt
                             : accessor->getAccessedFeatureFlagNames();
}

ReactNativeFeatureFlagsAccessor& ReactNativeFeatureFlags::getAccessor() {
  if (accessor_ == nullptr) {
    accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  }
  return *accessor_;
}

} // namespace facebook::react

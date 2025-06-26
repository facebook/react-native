/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<02ed1adf133035a71192f6af88d0214e>>
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

#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <sstream>
#include <stdexcept>
#include <string>
#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

ReactNativeFeatureFlagsAccessor::ReactNativeFeatureFlagsAccessor()
    : currentProvider_(std::make_unique<ReactNativeFeatureFlagsDefaults>()),
      wasOverridden_(false) {}

bool ReactNativeFeatureFlagsAccessor::commonTestFlag() {
  auto flagValue = commonTestFlag_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(0, "commonTestFlag");

    flagValue = currentProvider_->commonTestFlag();
    commonTestFlag_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::animatedShouldSignalBatch() {
  auto flagValue = animatedShouldSignalBatch_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(1, "animatedShouldSignalBatch");

    flagValue = currentProvider_->animatedShouldSignalBatch();
    animatedShouldSignalBatch_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::cxxNativeAnimatedEnabled() {
  auto flagValue = cxxNativeAnimatedEnabled_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(2, "cxxNativeAnimatedEnabled");

    flagValue = currentProvider_->cxxNativeAnimatedEnabled();
    cxxNativeAnimatedEnabled_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::cxxNativeAnimatedRemoveJsSync() {
  auto flagValue = cxxNativeAnimatedRemoveJsSync_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(3, "cxxNativeAnimatedRemoveJsSync");

    flagValue = currentProvider_->cxxNativeAnimatedRemoveJsSync();
    cxxNativeAnimatedRemoveJsSync_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableMainQueueSyncDispatchIOS() {
  auto flagValue = disableMainQueueSyncDispatchIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(4, "disableMainQueueSyncDispatchIOS");

    flagValue = currentProvider_->disableMainQueueSyncDispatchIOS();
    disableMainQueueSyncDispatchIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableMountItemReorderingAndroid() {
  auto flagValue = disableMountItemReorderingAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(5, "disableMountItemReorderingAndroid");

    flagValue = currentProvider_->disableMountItemReorderingAndroid();
    disableMountItemReorderingAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableTextLayoutManagerCacheAndroid() {
  auto flagValue = disableTextLayoutManagerCacheAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(6, "disableTextLayoutManagerCacheAndroid");

    flagValue = currentProvider_->disableTextLayoutManagerCacheAndroid();
    disableTextLayoutManagerCacheAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAccessibilityOrder() {
  auto flagValue = enableAccessibilityOrder_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(7, "enableAccessibilityOrder");

    flagValue = currentProvider_->enableAccessibilityOrder();
    enableAccessibilityOrder_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAccumulatedUpdatesInRawPropsAndroid() {
  auto flagValue = enableAccumulatedUpdatesInRawPropsAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(8, "enableAccumulatedUpdatesInRawPropsAndroid");

    flagValue = currentProvider_->enableAccumulatedUpdatesInRawPropsAndroid();
    enableAccumulatedUpdatesInRawPropsAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableBridgelessArchitecture() {
  auto flagValue = enableBridgelessArchitecture_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(9, "enableBridgelessArchitecture");

    flagValue = currentProvider_->enableBridgelessArchitecture();
    enableBridgelessArchitecture_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableCppPropsIteratorSetter() {
  auto flagValue = enableCppPropsIteratorSetter_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(10, "enableCppPropsIteratorSetter");

    flagValue = currentProvider_->enableCppPropsIteratorSetter();
    enableCppPropsIteratorSetter_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableCustomFocusSearchOnClippedElementsAndroid() {
  auto flagValue = enableCustomFocusSearchOnClippedElementsAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(11, "enableCustomFocusSearchOnClippedElementsAndroid");

    flagValue = currentProvider_->enableCustomFocusSearchOnClippedElementsAndroid();
    enableCustomFocusSearchOnClippedElementsAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableDestroyShadowTreeRevisionAsync() {
  auto flagValue = enableDestroyShadowTreeRevisionAsync_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(12, "enableDestroyShadowTreeRevisionAsync");

    flagValue = currentProvider_->enableDestroyShadowTreeRevisionAsync();
    enableDestroyShadowTreeRevisionAsync_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableDoubleMeasurementFixAndroid() {
  auto flagValue = enableDoubleMeasurementFixAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(13, "enableDoubleMeasurementFixAndroid");

    flagValue = currentProvider_->enableDoubleMeasurementFixAndroid();
    enableDoubleMeasurementFixAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableEagerRootViewAttachment() {
  auto flagValue = enableEagerRootViewAttachment_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(14, "enableEagerRootViewAttachment");

    flagValue = currentProvider_->enableEagerRootViewAttachment();
    enableEagerRootViewAttachment_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFabricLogs() {
  auto flagValue = enableFabricLogs_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(15, "enableFabricLogs");

    flagValue = currentProvider_->enableFabricLogs();
    enableFabricLogs_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFabricRenderer() {
  auto flagValue = enableFabricRenderer_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(16, "enableFabricRenderer");

    flagValue = currentProvider_->enableFabricRenderer();
    enableFabricRenderer_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFixForParentTagDuringReparenting() {
  auto flagValue = enableFixForParentTagDuringReparenting_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(17, "enableFixForParentTagDuringReparenting");

    flagValue = currentProvider_->enableFixForParentTagDuringReparenting();
    enableFixForParentTagDuringReparenting_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFontScaleChangesUpdatingLayout() {
  auto flagValue = enableFontScaleChangesUpdatingLayout_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(18, "enableFontScaleChangesUpdatingLayout");

    flagValue = currentProvider_->enableFontScaleChangesUpdatingLayout();
    enableFontScaleChangesUpdatingLayout_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableIOSTextBaselineOffsetPerLine() {
  auto flagValue = enableIOSTextBaselineOffsetPerLine_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(19, "enableIOSTextBaselineOffsetPerLine");

    flagValue = currentProvider_->enableIOSTextBaselineOffsetPerLine();
    enableIOSTextBaselineOffsetPerLine_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableIOSViewClipToPaddingBox() {
  auto flagValue = enableIOSViewClipToPaddingBox_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(20, "enableIOSViewClipToPaddingBox");

    flagValue = currentProvider_->enableIOSViewClipToPaddingBox();
    enableIOSViewClipToPaddingBox_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableInteropViewManagerClassLookUpOptimizationIOS() {
  auto flagValue = enableInteropViewManagerClassLookUpOptimizationIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(21, "enableInteropViewManagerClassLookUpOptimizationIOS");

    flagValue = currentProvider_->enableInteropViewManagerClassLookUpOptimizationIOS();
    enableInteropViewManagerClassLookUpOptimizationIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableLayoutAnimationsOnAndroid() {
  auto flagValue = enableLayoutAnimationsOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(22, "enableLayoutAnimationsOnAndroid");

    flagValue = currentProvider_->enableLayoutAnimationsOnAndroid();
    enableLayoutAnimationsOnAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableLayoutAnimationsOnIOS() {
  auto flagValue = enableLayoutAnimationsOnIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(23, "enableLayoutAnimationsOnIOS");

    flagValue = currentProvider_->enableLayoutAnimationsOnIOS();
    enableLayoutAnimationsOnIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableMainQueueCoordinatorOnIOS() {
  auto flagValue = enableMainQueueCoordinatorOnIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(24, "enableMainQueueCoordinatorOnIOS");

    flagValue = currentProvider_->enableMainQueueCoordinatorOnIOS();
    enableMainQueueCoordinatorOnIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableMainQueueModulesOnIOS() {
  auto flagValue = enableMainQueueModulesOnIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(25, "enableMainQueueModulesOnIOS");

    flagValue = currentProvider_->enableMainQueueModulesOnIOS();
    enableMainQueueModulesOnIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableModuleArgumentNSNullConversionIOS() {
  auto flagValue = enableModuleArgumentNSNullConversionIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(26, "enableModuleArgumentNSNullConversionIOS");

    flagValue = currentProvider_->enableModuleArgumentNSNullConversionIOS();
    enableModuleArgumentNSNullConversionIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableNativeCSSParsing() {
  auto flagValue = enableNativeCSSParsing_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(27, "enableNativeCSSParsing");

    flagValue = currentProvider_->enableNativeCSSParsing();
    enableNativeCSSParsing_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableNetworkEventReporting() {
  auto flagValue = enableNetworkEventReporting_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(28, "enableNetworkEventReporting");

    flagValue = currentProvider_->enableNetworkEventReporting();
    enableNetworkEventReporting_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableNewBackgroundAndBorderDrawables() {
  auto flagValue = enableNewBackgroundAndBorderDrawables_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(29, "enableNewBackgroundAndBorderDrawables");

    flagValue = currentProvider_->enableNewBackgroundAndBorderDrawables();
    enableNewBackgroundAndBorderDrawables_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enablePreparedTextLayout() {
  auto flagValue = enablePreparedTextLayout_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(30, "enablePreparedTextLayout");

    flagValue = currentProvider_->enablePreparedTextLayout();
    enablePreparedTextLayout_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enablePropsUpdateReconciliationAndroid() {
  auto flagValue = enablePropsUpdateReconciliationAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(31, "enablePropsUpdateReconciliationAndroid");

    flagValue = currentProvider_->enablePropsUpdateReconciliationAndroid();
    enablePropsUpdateReconciliationAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableResourceTimingAPI() {
  auto flagValue = enableResourceTimingAPI_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(32, "enableResourceTimingAPI");

    flagValue = currentProvider_->enableResourceTimingAPI();
    enableResourceTimingAPI_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableSynchronousStateUpdates() {
  auto flagValue = enableSynchronousStateUpdates_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(33, "enableSynchronousStateUpdates");

    flagValue = currentProvider_->enableSynchronousStateUpdates();
    enableSynchronousStateUpdates_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableViewCulling() {
  auto flagValue = enableViewCulling_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(34, "enableViewCulling");

    flagValue = currentProvider_->enableViewCulling();
    enableViewCulling_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableViewRecycling() {
  auto flagValue = enableViewRecycling_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(35, "enableViewRecycling");

    flagValue = currentProvider_->enableViewRecycling();
    enableViewRecycling_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableViewRecyclingForText() {
  auto flagValue = enableViewRecyclingForText_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(36, "enableViewRecyclingForText");

    flagValue = currentProvider_->enableViewRecyclingForText();
    enableViewRecyclingForText_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableViewRecyclingForView() {
  auto flagValue = enableViewRecyclingForView_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(37, "enableViewRecyclingForView");

    flagValue = currentProvider_->enableViewRecyclingForView();
    enableViewRecyclingForView_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableVirtualViewDebugFeatures() {
  auto flagValue = enableVirtualViewDebugFeatures_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(38, "enableVirtualViewDebugFeatures");

    flagValue = currentProvider_->enableVirtualViewDebugFeatures();
    enableVirtualViewDebugFeatures_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableVirtualViewRenderState() {
  auto flagValue = enableVirtualViewRenderState_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(39, "enableVirtualViewRenderState");

    flagValue = currentProvider_->enableVirtualViewRenderState();
    enableVirtualViewRenderState_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableVirtualViewWindowFocusDetection() {
  auto flagValue = enableVirtualViewWindowFocusDetection_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(40, "enableVirtualViewWindowFocusDetection");

    flagValue = currentProvider_->enableVirtualViewWindowFocusDetection();
    enableVirtualViewWindowFocusDetection_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  auto flagValue = fixMappingOfEventPrioritiesBetweenFabricAndReact_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(41, "fixMappingOfEventPrioritiesBetweenFabricAndReact");

    flagValue = currentProvider_->fixMappingOfEventPrioritiesBetweenFabricAndReact();
    fixMappingOfEventPrioritiesBetweenFabricAndReact_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fuseboxEnabledRelease() {
  auto flagValue = fuseboxEnabledRelease_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(42, "fuseboxEnabledRelease");

    flagValue = currentProvider_->fuseboxEnabledRelease();
    fuseboxEnabledRelease_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fuseboxNetworkInspectionEnabled() {
  auto flagValue = fuseboxNetworkInspectionEnabled_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(43, "fuseboxNetworkInspectionEnabled");

    flagValue = currentProvider_->fuseboxNetworkInspectionEnabled();
    fuseboxNetworkInspectionEnabled_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::traceTurboModulePromiseRejectionsOnAndroid() {
  auto flagValue = traceTurboModulePromiseRejectionsOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(44, "traceTurboModulePromiseRejectionsOnAndroid");

    flagValue = currentProvider_->traceTurboModulePromiseRejectionsOnAndroid();
    traceTurboModulePromiseRejectionsOnAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::updateRuntimeShadowNodeReferencesOnCommit() {
  auto flagValue = updateRuntimeShadowNodeReferencesOnCommit_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(45, "updateRuntimeShadowNodeReferencesOnCommit");

    flagValue = currentProvider_->updateRuntimeShadowNodeReferencesOnCommit();
    updateRuntimeShadowNodeReferencesOnCommit_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useAlwaysAvailableJSErrorHandling() {
  auto flagValue = useAlwaysAvailableJSErrorHandling_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(46, "useAlwaysAvailableJSErrorHandling");

    flagValue = currentProvider_->useAlwaysAvailableJSErrorHandling();
    useAlwaysAvailableJSErrorHandling_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useFabricInterop() {
  auto flagValue = useFabricInterop_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(47, "useFabricInterop");

    flagValue = currentProvider_->useFabricInterop();
    useFabricInterop_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useNativeViewConfigsInBridgelessMode() {
  auto flagValue = useNativeViewConfigsInBridgelessMode_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(48, "useNativeViewConfigsInBridgelessMode");

    flagValue = currentProvider_->useNativeViewConfigsInBridgelessMode();
    useNativeViewConfigsInBridgelessMode_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useOptimizedEventBatchingOnAndroid() {
  auto flagValue = useOptimizedEventBatchingOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(49, "useOptimizedEventBatchingOnAndroid");

    flagValue = currentProvider_->useOptimizedEventBatchingOnAndroid();
    useOptimizedEventBatchingOnAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useRawPropsJsiValue() {
  auto flagValue = useRawPropsJsiValue_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(50, "useRawPropsJsiValue");

    flagValue = currentProvider_->useRawPropsJsiValue();
    useRawPropsJsiValue_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useShadowNodeStateOnClone() {
  auto flagValue = useShadowNodeStateOnClone_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(51, "useShadowNodeStateOnClone");

    flagValue = currentProvider_->useShadowNodeStateOnClone();
    useShadowNodeStateOnClone_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useTurboModuleInterop() {
  auto flagValue = useTurboModuleInterop_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(52, "useTurboModuleInterop");

    flagValue = currentProvider_->useTurboModuleInterop();
    useTurboModuleInterop_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useTurboModules() {
  auto flagValue = useTurboModules_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(53, "useTurboModules");

    flagValue = currentProvider_->useTurboModules();
    useTurboModules_ = flagValue;
  }

  return flagValue.value();
}

double ReactNativeFeatureFlagsAccessor::virtualViewPrerenderRatio() {
  auto flagValue = virtualViewPrerenderRatio_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(54, "virtualViewPrerenderRatio");

    flagValue = currentProvider_->virtualViewPrerenderRatio();
    virtualViewPrerenderRatio_ = flagValue;
  }

  return flagValue.value();
}

void ReactNativeFeatureFlagsAccessor::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  if (wasOverridden_) {
    throw std::runtime_error(
        "Feature flags cannot be overridden more than once");
  }

  ensureFlagsNotAccessed();
  wasOverridden_ = true;
  currentProvider_ = std::move(provider);
}

std::optional<std::string>
ReactNativeFeatureFlagsAccessor::getAccessedFeatureFlagNames() const {
  std::ostringstream featureFlagListBuilder;
  for (const auto& featureFlagName : accessedFeatureFlags_) {
    if (featureFlagName != nullptr) {
      featureFlagListBuilder << featureFlagName << ", ";
    }
  }

  std::string accessedFeatureFlagNames = featureFlagListBuilder.str();
  if (!accessedFeatureFlagNames.empty()) {
    accessedFeatureFlagNames =
        accessedFeatureFlagNames.substr(0, accessedFeatureFlagNames.size() - 2);
  }

  return accessedFeatureFlagNames.empty()
      ? std::nullopt
      : std::optional{accessedFeatureFlagNames};
}

void ReactNativeFeatureFlagsAccessor::markFlagAsAccessed(
    int position,
    const char* flagName) {
  accessedFeatureFlags_[position] = flagName;
}

void ReactNativeFeatureFlagsAccessor::ensureFlagsNotAccessed() {
  auto accessedFeatureFlagNames = getAccessedFeatureFlagNames();

  if (accessedFeatureFlagNames.has_value()) {
    throw std::runtime_error(
        "Feature flags were accessed before being overridden: " +
        accessedFeatureFlagNames.value());
  }
}

} // namespace facebook::react

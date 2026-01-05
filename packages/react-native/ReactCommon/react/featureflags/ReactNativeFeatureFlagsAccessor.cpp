/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<8bda4a084596c5512b8ebf5eaa44268e>>
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

bool ReactNativeFeatureFlagsAccessor::cdpInteractionMetricsEnabled() {
  auto flagValue = cdpInteractionMetricsEnabled_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(1, "cdpInteractionMetricsEnabled");

    flagValue = currentProvider_->cdpInteractionMetricsEnabled();
    cdpInteractionMetricsEnabled_ = flagValue;
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

bool ReactNativeFeatureFlagsAccessor::disableEarlyViewCommandExecution() {
  auto flagValue = disableEarlyViewCommandExecution_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(3, "disableEarlyViewCommandExecution");

    flagValue = currentProvider_->disableEarlyViewCommandExecution();
    disableEarlyViewCommandExecution_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableImageViewPreallocationAndroid() {
  auto flagValue = disableImageViewPreallocationAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(4, "disableImageViewPreallocationAndroid");

    flagValue = currentProvider_->disableImageViewPreallocationAndroid();
    disableImageViewPreallocationAndroid_ = flagValue;
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

bool ReactNativeFeatureFlagsAccessor::disableOldAndroidAttachmentMetricsWorkarounds() {
  auto flagValue = disableOldAndroidAttachmentMetricsWorkarounds_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(6, "disableOldAndroidAttachmentMetricsWorkarounds");

    flagValue = currentProvider_->disableOldAndroidAttachmentMetricsWorkarounds();
    disableOldAndroidAttachmentMetricsWorkarounds_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableSubviewClippingAndroid() {
  auto flagValue = disableSubviewClippingAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(7, "disableSubviewClippingAndroid");

    flagValue = currentProvider_->disableSubviewClippingAndroid();
    disableSubviewClippingAndroid_ = flagValue;
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

    markFlagAsAccessed(8, "disableTextLayoutManagerCacheAndroid");

    flagValue = currentProvider_->disableTextLayoutManagerCacheAndroid();
    disableTextLayoutManagerCacheAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableViewPreallocationAndroid() {
  auto flagValue = disableViewPreallocationAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(9, "disableViewPreallocationAndroid");

    flagValue = currentProvider_->disableViewPreallocationAndroid();
    disableViewPreallocationAndroid_ = flagValue;
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

    markFlagAsAccessed(10, "enableAccessibilityOrder");

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

    markFlagAsAccessed(11, "enableAccumulatedUpdatesInRawPropsAndroid");

    flagValue = currentProvider_->enableAccumulatedUpdatesInRawPropsAndroid();
    enableAccumulatedUpdatesInRawPropsAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAndroidAntialiasedBorderRadiusClipping() {
  auto flagValue = enableAndroidAntialiasedBorderRadiusClipping_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(12, "enableAndroidAntialiasedBorderRadiusClipping");

    flagValue = currentProvider_->enableAndroidAntialiasedBorderRadiusClipping();
    enableAndroidAntialiasedBorderRadiusClipping_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAndroidLinearText() {
  auto flagValue = enableAndroidLinearText_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(13, "enableAndroidLinearText");

    flagValue = currentProvider_->enableAndroidLinearText();
    enableAndroidLinearText_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAndroidTextMeasurementOptimizations() {
  auto flagValue = enableAndroidTextMeasurementOptimizations_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(14, "enableAndroidTextMeasurementOptimizations");

    flagValue = currentProvider_->enableAndroidTextMeasurementOptimizations();
    enableAndroidTextMeasurementOptimizations_ = flagValue;
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

    markFlagAsAccessed(15, "enableBridgelessArchitecture");

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

    markFlagAsAccessed(16, "enableCppPropsIteratorSetter");

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

    markFlagAsAccessed(17, "enableCustomFocusSearchOnClippedElementsAndroid");

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

    markFlagAsAccessed(18, "enableDestroyShadowTreeRevisionAsync");

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

    markFlagAsAccessed(19, "enableDoubleMeasurementFixAndroid");

    flagValue = currentProvider_->enableDoubleMeasurementFixAndroid();
    enableDoubleMeasurementFixAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableEagerMainQueueModulesOnIOS() {
  auto flagValue = enableEagerMainQueueModulesOnIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(20, "enableEagerMainQueueModulesOnIOS");

    flagValue = currentProvider_->enableEagerMainQueueModulesOnIOS();
    enableEagerMainQueueModulesOnIOS_ = flagValue;
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

    markFlagAsAccessed(21, "enableEagerRootViewAttachment");

    flagValue = currentProvider_->enableEagerRootViewAttachment();
    enableEagerRootViewAttachment_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableExclusivePropsUpdateAndroid() {
  auto flagValue = enableExclusivePropsUpdateAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(22, "enableExclusivePropsUpdateAndroid");

    flagValue = currentProvider_->enableExclusivePropsUpdateAndroid();
    enableExclusivePropsUpdateAndroid_ = flagValue;
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

    markFlagAsAccessed(23, "enableFabricLogs");

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

    markFlagAsAccessed(24, "enableFabricRenderer");

    flagValue = currentProvider_->enableFabricRenderer();
    enableFabricRenderer_ = flagValue;
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

    markFlagAsAccessed(25, "enableFontScaleChangesUpdatingLayout");

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

    markFlagAsAccessed(26, "enableIOSTextBaselineOffsetPerLine");

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

    markFlagAsAccessed(27, "enableIOSViewClipToPaddingBox");

    flagValue = currentProvider_->enableIOSViewClipToPaddingBox();
    enableIOSViewClipToPaddingBox_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableImagePrefetchingAndroid() {
  auto flagValue = enableImagePrefetchingAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(28, "enableImagePrefetchingAndroid");

    flagValue = currentProvider_->enableImagePrefetchingAndroid();
    enableImagePrefetchingAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableImagePrefetchingJNIBatchingAndroid() {
  auto flagValue = enableImagePrefetchingJNIBatchingAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(29, "enableImagePrefetchingJNIBatchingAndroid");

    flagValue = currentProvider_->enableImagePrefetchingJNIBatchingAndroid();
    enableImagePrefetchingJNIBatchingAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableImagePrefetchingOnUiThreadAndroid() {
  auto flagValue = enableImagePrefetchingOnUiThreadAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(30, "enableImagePrefetchingOnUiThreadAndroid");

    flagValue = currentProvider_->enableImagePrefetchingOnUiThreadAndroid();
    enableImagePrefetchingOnUiThreadAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableImmediateUpdateModeForContentOffsetChanges() {
  auto flagValue = enableImmediateUpdateModeForContentOffsetChanges_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(31, "enableImmediateUpdateModeForContentOffsetChanges");

    flagValue = currentProvider_->enableImmediateUpdateModeForContentOffsetChanges();
    enableImmediateUpdateModeForContentOffsetChanges_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableImperativeFocus() {
  auto flagValue = enableImperativeFocus_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(32, "enableImperativeFocus");

    flagValue = currentProvider_->enableImperativeFocus();
    enableImperativeFocus_ = flagValue;
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

    markFlagAsAccessed(33, "enableInteropViewManagerClassLookUpOptimizationIOS");

    flagValue = currentProvider_->enableInteropViewManagerClassLookUpOptimizationIOS();
    enableInteropViewManagerClassLookUpOptimizationIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableIntersectionObserverByDefault() {
  auto flagValue = enableIntersectionObserverByDefault_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(34, "enableIntersectionObserverByDefault");

    flagValue = currentProvider_->enableIntersectionObserverByDefault();
    enableIntersectionObserverByDefault_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableKeyEvents() {
  auto flagValue = enableKeyEvents_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(35, "enableKeyEvents");

    flagValue = currentProvider_->enableKeyEvents();
    enableKeyEvents_ = flagValue;
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

    markFlagAsAccessed(36, "enableLayoutAnimationsOnAndroid");

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

    markFlagAsAccessed(37, "enableLayoutAnimationsOnIOS");

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

    markFlagAsAccessed(38, "enableMainQueueCoordinatorOnIOS");

    flagValue = currentProvider_->enableMainQueueCoordinatorOnIOS();
    enableMainQueueCoordinatorOnIOS_ = flagValue;
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

    markFlagAsAccessed(39, "enableModuleArgumentNSNullConversionIOS");

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

    markFlagAsAccessed(40, "enableNativeCSSParsing");

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

    markFlagAsAccessed(41, "enableNetworkEventReporting");

    flagValue = currentProvider_->enableNetworkEventReporting();
    enableNetworkEventReporting_ = flagValue;
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

    markFlagAsAccessed(42, "enablePreparedTextLayout");

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

    markFlagAsAccessed(43, "enablePropsUpdateReconciliationAndroid");

    flagValue = currentProvider_->enablePropsUpdateReconciliationAndroid();
    enablePropsUpdateReconciliationAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableSwiftUIBasedFilters() {
  auto flagValue = enableSwiftUIBasedFilters_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(44, "enableSwiftUIBasedFilters");

    flagValue = currentProvider_->enableSwiftUIBasedFilters();
    enableSwiftUIBasedFilters_ = flagValue;
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

    markFlagAsAccessed(45, "enableViewCulling");

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

    markFlagAsAccessed(46, "enableViewRecycling");

    flagValue = currentProvider_->enableViewRecycling();
    enableViewRecycling_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableViewRecyclingForImage() {
  auto flagValue = enableViewRecyclingForImage_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(47, "enableViewRecyclingForImage");

    flagValue = currentProvider_->enableViewRecyclingForImage();
    enableViewRecyclingForImage_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableViewRecyclingForScrollView() {
  auto flagValue = enableViewRecyclingForScrollView_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(48, "enableViewRecyclingForScrollView");

    flagValue = currentProvider_->enableViewRecyclingForScrollView();
    enableViewRecyclingForScrollView_ = flagValue;
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

    markFlagAsAccessed(49, "enableViewRecyclingForText");

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

    markFlagAsAccessed(50, "enableViewRecyclingForView");

    flagValue = currentProvider_->enableViewRecyclingForView();
    enableViewRecyclingForView_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableVirtualViewContainerStateExperimental() {
  auto flagValue = enableVirtualViewContainerStateExperimental_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(51, "enableVirtualViewContainerStateExperimental");

    flagValue = currentProvider_->enableVirtualViewContainerStateExperimental();
    enableVirtualViewContainerStateExperimental_ = flagValue;
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

    markFlagAsAccessed(52, "enableVirtualViewDebugFeatures");

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

    markFlagAsAccessed(53, "enableVirtualViewRenderState");

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

    markFlagAsAccessed(54, "enableVirtualViewWindowFocusDetection");

    flagValue = currentProvider_->enableVirtualViewWindowFocusDetection();
    enableVirtualViewWindowFocusDetection_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableWebPerformanceAPIsByDefault() {
  auto flagValue = enableWebPerformanceAPIsByDefault_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(55, "enableWebPerformanceAPIsByDefault");

    flagValue = currentProvider_->enableWebPerformanceAPIsByDefault();
    enableWebPerformanceAPIsByDefault_ = flagValue;
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

    markFlagAsAccessed(56, "fixMappingOfEventPrioritiesBetweenFabricAndReact");

    flagValue = currentProvider_->fixMappingOfEventPrioritiesBetweenFabricAndReact();
    fixMappingOfEventPrioritiesBetweenFabricAndReact_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fixTextClippingAndroid15useBoundsForWidth() {
  auto flagValue = fixTextClippingAndroid15useBoundsForWidth_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(57, "fixTextClippingAndroid15useBoundsForWidth");

    flagValue = currentProvider_->fixTextClippingAndroid15useBoundsForWidth();
    fixTextClippingAndroid15useBoundsForWidth_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fuseboxAssertSingleHostState() {
  auto flagValue = fuseboxAssertSingleHostState_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(58, "fuseboxAssertSingleHostState");

    flagValue = currentProvider_->fuseboxAssertSingleHostState();
    fuseboxAssertSingleHostState_ = flagValue;
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

    markFlagAsAccessed(59, "fuseboxEnabledRelease");

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

    markFlagAsAccessed(60, "fuseboxNetworkInspectionEnabled");

    flagValue = currentProvider_->fuseboxNetworkInspectionEnabled();
    fuseboxNetworkInspectionEnabled_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::hideOffscreenVirtualViewsOnIOS() {
  auto flagValue = hideOffscreenVirtualViewsOnIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(61, "hideOffscreenVirtualViewsOnIOS");

    flagValue = currentProvider_->hideOffscreenVirtualViewsOnIOS();
    hideOffscreenVirtualViewsOnIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::overrideBySynchronousMountPropsAtMountingAndroid() {
  auto flagValue = overrideBySynchronousMountPropsAtMountingAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(62, "overrideBySynchronousMountPropsAtMountingAndroid");

    flagValue = currentProvider_->overrideBySynchronousMountPropsAtMountingAndroid();
    overrideBySynchronousMountPropsAtMountingAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::perfIssuesEnabled() {
  auto flagValue = perfIssuesEnabled_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(63, "perfIssuesEnabled");

    flagValue = currentProvider_->perfIssuesEnabled();
    perfIssuesEnabled_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::perfMonitorV2Enabled() {
  auto flagValue = perfMonitorV2Enabled_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(64, "perfMonitorV2Enabled");

    flagValue = currentProvider_->perfMonitorV2Enabled();
    perfMonitorV2Enabled_ = flagValue;
  }

  return flagValue.value();
}

double ReactNativeFeatureFlagsAccessor::preparedTextCacheSize() {
  auto flagValue = preparedTextCacheSize_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(65, "preparedTextCacheSize");

    flagValue = currentProvider_->preparedTextCacheSize();
    preparedTextCacheSize_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::preventShadowTreeCommitExhaustion() {
  auto flagValue = preventShadowTreeCommitExhaustion_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(66, "preventShadowTreeCommitExhaustion");

    flagValue = currentProvider_->preventShadowTreeCommitExhaustion();
    preventShadowTreeCommitExhaustion_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::shouldPressibilityUseW3CPointerEventsForHover() {
  auto flagValue = shouldPressibilityUseW3CPointerEventsForHover_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(67, "shouldPressibilityUseW3CPointerEventsForHover");

    flagValue = currentProvider_->shouldPressibilityUseW3CPointerEventsForHover();
    shouldPressibilityUseW3CPointerEventsForHover_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::shouldResetClickableWhenRecyclingView() {
  auto flagValue = shouldResetClickableWhenRecyclingView_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(68, "shouldResetClickableWhenRecyclingView");

    flagValue = currentProvider_->shouldResetClickableWhenRecyclingView();
    shouldResetClickableWhenRecyclingView_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::shouldResetOnClickListenerWhenRecyclingView() {
  auto flagValue = shouldResetOnClickListenerWhenRecyclingView_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(69, "shouldResetOnClickListenerWhenRecyclingView");

    flagValue = currentProvider_->shouldResetOnClickListenerWhenRecyclingView();
    shouldResetOnClickListenerWhenRecyclingView_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::shouldSetEnabledBasedOnAccessibilityState() {
  auto flagValue = shouldSetEnabledBasedOnAccessibilityState_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(70, "shouldSetEnabledBasedOnAccessibilityState");

    flagValue = currentProvider_->shouldSetEnabledBasedOnAccessibilityState();
    shouldSetEnabledBasedOnAccessibilityState_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::shouldSetIsClickableByDefault() {
  auto flagValue = shouldSetIsClickableByDefault_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(71, "shouldSetIsClickableByDefault");

    flagValue = currentProvider_->shouldSetIsClickableByDefault();
    shouldSetIsClickableByDefault_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::shouldTriggerResponderTransferOnScrollAndroid() {
  auto flagValue = shouldTriggerResponderTransferOnScrollAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(72, "shouldTriggerResponderTransferOnScrollAndroid");

    flagValue = currentProvider_->shouldTriggerResponderTransferOnScrollAndroid();
    shouldTriggerResponderTransferOnScrollAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::skipActivityIdentityAssertionOnHostPause() {
  auto flagValue = skipActivityIdentityAssertionOnHostPause_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(73, "skipActivityIdentityAssertionOnHostPause");

    flagValue = currentProvider_->skipActivityIdentityAssertionOnHostPause();
    skipActivityIdentityAssertionOnHostPause_ = flagValue;
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

    markFlagAsAccessed(74, "traceTurboModulePromiseRejectionsOnAndroid");

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

    markFlagAsAccessed(75, "updateRuntimeShadowNodeReferencesOnCommit");

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

    markFlagAsAccessed(76, "useAlwaysAvailableJSErrorHandling");

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

    markFlagAsAccessed(77, "useFabricInterop");

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

    markFlagAsAccessed(78, "useNativeViewConfigsInBridgelessMode");

    flagValue = currentProvider_->useNativeViewConfigsInBridgelessMode();
    useNativeViewConfigsInBridgelessMode_ = flagValue;
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

    markFlagAsAccessed(79, "useRawPropsJsiValue");

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

    markFlagAsAccessed(80, "useShadowNodeStateOnClone");

    flagValue = currentProvider_->useShadowNodeStateOnClone();
    useShadowNodeStateOnClone_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useSharedAnimatedBackend() {
  auto flagValue = useSharedAnimatedBackend_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(81, "useSharedAnimatedBackend");

    flagValue = currentProvider_->useSharedAnimatedBackend();
    useSharedAnimatedBackend_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useTraitHiddenOnAndroid() {
  auto flagValue = useTraitHiddenOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(82, "useTraitHiddenOnAndroid");

    flagValue = currentProvider_->useTraitHiddenOnAndroid();
    useTraitHiddenOnAndroid_ = flagValue;
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

    markFlagAsAccessed(83, "useTurboModuleInterop");

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

    markFlagAsAccessed(84, "useTurboModules");

    flagValue = currentProvider_->useTurboModules();
    useTurboModules_ = flagValue;
  }

  return flagValue.value();
}

double ReactNativeFeatureFlagsAccessor::viewCullingOutsetRatio() {
  auto flagValue = viewCullingOutsetRatio_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(85, "viewCullingOutsetRatio");

    flagValue = currentProvider_->viewCullingOutsetRatio();
    viewCullingOutsetRatio_ = flagValue;
  }

  return flagValue.value();
}

double ReactNativeFeatureFlagsAccessor::virtualViewHysteresisRatio() {
  auto flagValue = virtualViewHysteresisRatio_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(86, "virtualViewHysteresisRatio");

    flagValue = currentProvider_->virtualViewHysteresisRatio();
    virtualViewHysteresisRatio_ = flagValue;
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

    markFlagAsAccessed(87, "virtualViewPrerenderRatio");

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

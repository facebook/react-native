/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<6728f8cada1d0d9d21800b4fefe76b77>>
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

bool ReactNativeFeatureFlags::cdpInteractionMetricsEnabled() {
  return getAccessor().cdpInteractionMetricsEnabled();
}

bool ReactNativeFeatureFlags::cxxNativeAnimatedEnabled() {
  return getAccessor().cxxNativeAnimatedEnabled();
}

bool ReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync() {
  return getAccessor().cxxNativeAnimatedRemoveJsSync();
}

bool ReactNativeFeatureFlags::disableEarlyViewCommandExecution() {
  return getAccessor().disableEarlyViewCommandExecution();
}

bool ReactNativeFeatureFlags::disableFabricCommitInCXXAnimated() {
  return getAccessor().disableFabricCommitInCXXAnimated();
}

bool ReactNativeFeatureFlags::disableMountItemReorderingAndroid() {
  return getAccessor().disableMountItemReorderingAndroid();
}

bool ReactNativeFeatureFlags::disableOldAndroidAttachmentMetricsWorkarounds() {
  return getAccessor().disableOldAndroidAttachmentMetricsWorkarounds();
}

bool ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid() {
  return getAccessor().disableTextLayoutManagerCacheAndroid();
}

bool ReactNativeFeatureFlags::enableAccessibilityOrder() {
  return getAccessor().enableAccessibilityOrder();
}

bool ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid() {
  return getAccessor().enableAccumulatedUpdatesInRawPropsAndroid();
}

bool ReactNativeFeatureFlags::enableAndroidLinearText() {
  return getAccessor().enableAndroidLinearText();
}

bool ReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations() {
  return getAccessor().enableAndroidTextMeasurementOptimizations();
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

bool ReactNativeFeatureFlags::enableEagerMainQueueModulesOnIOS() {
  return getAccessor().enableEagerMainQueueModulesOnIOS();
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

bool ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout() {
  return getAccessor().enableFontScaleChangesUpdatingLayout();
}

bool ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine() {
  return getAccessor().enableIOSTextBaselineOffsetPerLine();
}

bool ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox() {
  return getAccessor().enableIOSViewClipToPaddingBox();
}

bool ReactNativeFeatureFlags::enableImagePrefetchingAndroid() {
  return getAccessor().enableImagePrefetchingAndroid();
}

bool ReactNativeFeatureFlags::enableImagePrefetchingOnUiThreadAndroid() {
  return getAccessor().enableImagePrefetchingOnUiThreadAndroid();
}

bool ReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges() {
  return getAccessor().enableImmediateUpdateModeForContentOffsetChanges();
}

bool ReactNativeFeatureFlags::enableImperativeFocus() {
  return getAccessor().enableImperativeFocus();
}

bool ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS() {
  return getAccessor().enableInteropViewManagerClassLookUpOptimizationIOS();
}

bool ReactNativeFeatureFlags::enableIntersectionObserverByDefault() {
  return getAccessor().enableIntersectionObserverByDefault();
}

bool ReactNativeFeatureFlags::enableKeyEvents() {
  return getAccessor().enableKeyEvents();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid() {
  return getAccessor().enableLayoutAnimationsOnAndroid();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS() {
  return getAccessor().enableLayoutAnimationsOnIOS();
}

bool ReactNativeFeatureFlags::enableMainQueueCoordinatorOnIOS() {
  return getAccessor().enableMainQueueCoordinatorOnIOS();
}

bool ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS() {
  return getAccessor().enableModuleArgumentNSNullConversionIOS();
}

bool ReactNativeFeatureFlags::enableNativeCSSParsing() {
  return getAccessor().enableNativeCSSParsing();
}

bool ReactNativeFeatureFlags::enableNetworkEventReporting() {
  return getAccessor().enableNetworkEventReporting();
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

bool ReactNativeFeatureFlags::enableSwiftUIBasedFilters() {
  return getAccessor().enableSwiftUIBasedFilters();
}

bool ReactNativeFeatureFlags::enableViewCulling() {
  return getAccessor().enableViewCulling();
}

bool ReactNativeFeatureFlags::enableViewRecycling() {
  return getAccessor().enableViewRecycling();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForImage() {
  return getAccessor().enableViewRecyclingForImage();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForScrollView() {
  return getAccessor().enableViewRecyclingForScrollView();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForText() {
  return getAccessor().enableViewRecyclingForText();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForView() {
  return getAccessor().enableViewRecyclingForView();
}

bool ReactNativeFeatureFlags::enableVirtualViewClippingWithoutScrollViewClipping() {
  return getAccessor().enableVirtualViewClippingWithoutScrollViewClipping();
}

bool ReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental() {
  return getAccessor().enableVirtualViewContainerStateExperimental();
}

bool ReactNativeFeatureFlags::enableVirtualViewDebugFeatures() {
  return getAccessor().enableVirtualViewDebugFeatures();
}

bool ReactNativeFeatureFlags::enableVirtualViewRenderState() {
  return getAccessor().enableVirtualViewRenderState();
}

bool ReactNativeFeatureFlags::enableVirtualViewWindowFocusDetection() {
  return getAccessor().enableVirtualViewWindowFocusDetection();
}

bool ReactNativeFeatureFlags::enableWebPerformanceAPIsByDefault() {
  return getAccessor().enableWebPerformanceAPIsByDefault();
}

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return getAccessor().fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool ReactNativeFeatureFlags::fuseboxAssertSingleHostState() {
  return getAccessor().fuseboxAssertSingleHostState();
}

bool ReactNativeFeatureFlags::fuseboxEnabledRelease() {
  return getAccessor().fuseboxEnabledRelease();
}

bool ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled() {
  return getAccessor().fuseboxNetworkInspectionEnabled();
}

bool ReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS() {
  return getAccessor().hideOffscreenVirtualViewsOnIOS();
}

bool ReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid() {
  return getAccessor().overrideBySynchronousMountPropsAtMountingAndroid();
}

bool ReactNativeFeatureFlags::perfIssuesEnabled() {
  return getAccessor().perfIssuesEnabled();
}

bool ReactNativeFeatureFlags::perfMonitorV2Enabled() {
  return getAccessor().perfMonitorV2Enabled();
}

double ReactNativeFeatureFlags::preparedTextCacheSize() {
  return getAccessor().preparedTextCacheSize();
}

bool ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion() {
  return getAccessor().preventShadowTreeCommitExhaustion();
}

bool ReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover() {
  return getAccessor().shouldPressibilityUseW3CPointerEventsForHover();
}

bool ReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid() {
  return getAccessor().shouldTriggerResponderTransferOnScrollAndroid();
}

bool ReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause() {
  return getAccessor().skipActivityIdentityAssertionOnHostPause();
}

bool ReactNativeFeatureFlags::sweepActiveTouchOnChildNativeGesturesAndroid() {
  return getAccessor().sweepActiveTouchOnChildNativeGesturesAndroid();
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

bool ReactNativeFeatureFlags::useNativeEqualsInNativeReadableArrayAndroid() {
  return getAccessor().useNativeEqualsInNativeReadableArrayAndroid();
}

bool ReactNativeFeatureFlags::useNativeTransformHelperAndroid() {
  return getAccessor().useNativeTransformHelperAndroid();
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

bool ReactNativeFeatureFlags::useSharedAnimatedBackend() {
  return getAccessor().useSharedAnimatedBackend();
}

bool ReactNativeFeatureFlags::useTraitHiddenOnAndroid() {
  return getAccessor().useTraitHiddenOnAndroid();
}

bool ReactNativeFeatureFlags::useTurboModuleInterop() {
  return getAccessor().useTurboModuleInterop();
}

bool ReactNativeFeatureFlags::useTurboModules() {
  return getAccessor().useTurboModules();
}

double ReactNativeFeatureFlags::viewCullingOutsetRatio() {
  return getAccessor().viewCullingOutsetRatio();
}

double ReactNativeFeatureFlags::virtualViewHysteresisRatio() {
  return getAccessor().virtualViewHysteresisRatio();
}

double ReactNativeFeatureFlags::virtualViewPrerenderRatio() {
  return getAccessor().virtualViewPrerenderRatio();
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

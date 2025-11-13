/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<3f6cc9604905bb29a9524a97eaa294bd>>
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

#include "NativeReactNativeFeatureFlags.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeReactNativeFeatureFlagsModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeReactNativeFeatureFlags>(
      std::move(jsInvoker));
}

namespace facebook::react {

NativeReactNativeFeatureFlags::NativeReactNativeFeatureFlags(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeReactNativeFeatureFlagsCxxSpec(std::move(jsInvoker)) {}

bool NativeReactNativeFeatureFlags::commonTestFlag(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool NativeReactNativeFeatureFlags::commonTestFlagWithoutNativeImplementation(
    jsi::Runtime& /*runtime*/) {
  // This flag is configured with `skipNativeAPI: true`.
  // TODO(T204838867): Implement support for optional methods in C++ TM codegen and remove the method definition altogether.
  return false;
}

bool NativeReactNativeFeatureFlags::cdpInteractionMetricsEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cdpInteractionMetricsEnabled();
}

bool NativeReactNativeFeatureFlags::cxxNativeAnimatedEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedEnabled();
}

bool NativeReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync();
}

bool NativeReactNativeFeatureFlags::disableEarlyViewCommandExecution(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableEarlyViewCommandExecution();
}

bool NativeReactNativeFeatureFlags::disableFabricCommitInCXXAnimated(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableFabricCommitInCXXAnimated();
}

bool NativeReactNativeFeatureFlags::disableMountItemReorderingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
}

bool NativeReactNativeFeatureFlags::disableOldAndroidAttachmentMetricsWorkarounds(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableOldAndroidAttachmentMetricsWorkarounds();
}

bool NativeReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid();
}

bool NativeReactNativeFeatureFlags::enableAccessibilityOrder(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAccessibilityOrder();
}

bool NativeReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid();
}

bool NativeReactNativeFeatureFlags::enableAndroidLinearText(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAndroidLinearText();
}

bool NativeReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations();
}

bool NativeReactNativeFeatureFlags::enableBridgelessArchitecture(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableBridgelessArchitecture();
}

bool NativeReactNativeFeatureFlags::enableCppPropsIteratorSetter(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableCppPropsIteratorSetter();
}

bool NativeReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid();
}

bool NativeReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync();
}

bool NativeReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid();
}

bool NativeReactNativeFeatureFlags::enableEagerMainQueueModulesOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableEagerMainQueueModulesOnIOS();
}

bool NativeReactNativeFeatureFlags::enableEagerRootViewAttachment(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool NativeReactNativeFeatureFlags::enableFabricLogs(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool NativeReactNativeFeatureFlags::enableFabricRenderer(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricRenderer();
}

bool NativeReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout();
}

bool NativeReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine();
}

bool NativeReactNativeFeatureFlags::enableIOSViewClipToPaddingBox(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool NativeReactNativeFeatureFlags::enableImagePrefetchingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImagePrefetchingAndroid();
}

bool NativeReactNativeFeatureFlags::enableImagePrefetchingOnUiThreadAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImagePrefetchingOnUiThreadAndroid();
}

bool NativeReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges();
}

bool NativeReactNativeFeatureFlags::enableImperativeFocus(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImperativeFocus();
}

bool NativeReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS();
}

bool NativeReactNativeFeatureFlags::enableIntersectionObserverByDefault(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIntersectionObserverByDefault();
}

bool NativeReactNativeFeatureFlags::enableKeyEvents(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableKeyEvents();
}

bool NativeReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid();
}

bool NativeReactNativeFeatureFlags::enableLayoutAnimationsOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool NativeReactNativeFeatureFlags::enableMainQueueCoordinatorOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableMainQueueCoordinatorOnIOS();
}

bool NativeReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS();
}

bool NativeReactNativeFeatureFlags::enableNativeCSSParsing(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableNativeCSSParsing();
}

bool NativeReactNativeFeatureFlags::enableNetworkEventReporting(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableNetworkEventReporting();
}

bool NativeReactNativeFeatureFlags::enablePreparedTextLayout(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enablePreparedTextLayout();
}

bool NativeReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid();
}

bool NativeReactNativeFeatureFlags::enableResourceTimingAPI(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableResourceTimingAPI();
}

bool NativeReactNativeFeatureFlags::enableSwiftUIBasedFilters(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableSwiftUIBasedFilters();
}

bool NativeReactNativeFeatureFlags::enableViewCulling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewCulling();
}

bool NativeReactNativeFeatureFlags::enableViewRecycling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForImage(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForImage();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForScrollView(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForScrollView();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForText(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForText();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForView(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForView();
}

bool NativeReactNativeFeatureFlags::enableVirtualViewClippingWithoutScrollViewClipping(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableVirtualViewClippingWithoutScrollViewClipping();
}

bool NativeReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental();
}

bool NativeReactNativeFeatureFlags::enableVirtualViewDebugFeatures(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableVirtualViewDebugFeatures();
}

bool NativeReactNativeFeatureFlags::enableVirtualViewRenderState(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableVirtualViewRenderState();
}

bool NativeReactNativeFeatureFlags::enableVirtualViewWindowFocusDetection(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableVirtualViewWindowFocusDetection();
}

bool NativeReactNativeFeatureFlags::enableWebPerformanceAPIsByDefault(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableWebPerformanceAPIsByDefault();
}

bool NativeReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool NativeReactNativeFeatureFlags::fuseboxAssertSingleHostState(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxAssertSingleHostState();
}

bool NativeReactNativeFeatureFlags::fuseboxEnabledRelease(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledRelease();
}

bool NativeReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled();
}

bool NativeReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS();
}

bool NativeReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid();
}

bool NativeReactNativeFeatureFlags::perfIssuesEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::perfIssuesEnabled();
}

bool NativeReactNativeFeatureFlags::perfMonitorV2Enabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::perfMonitorV2Enabled();
}

double NativeReactNativeFeatureFlags::preparedTextCacheSize(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::preparedTextCacheSize();
}

bool NativeReactNativeFeatureFlags::preventShadowTreeCommitExhaustion(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion();
}

bool NativeReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover();
}

bool NativeReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid();
}

bool NativeReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause();
}

bool NativeReactNativeFeatureFlags::sweepActiveTouchOnChildNativeGesturesAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::sweepActiveTouchOnChildNativeGesturesAndroid();
}

bool NativeReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool NativeReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit();
}

bool NativeReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling();
}

bool NativeReactNativeFeatureFlags::useFabricInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool NativeReactNativeFeatureFlags::useNativeEqualsInNativeReadableArrayAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNativeEqualsInNativeReadableArrayAndroid();
}

bool NativeReactNativeFeatureFlags::useNativeTransformHelperAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNativeTransformHelperAndroid();
}

bool NativeReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool NativeReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid();
}

bool NativeReactNativeFeatureFlags::useRawPropsJsiValue(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useRawPropsJsiValue();
}

bool NativeReactNativeFeatureFlags::useShadowNodeStateOnClone(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useShadowNodeStateOnClone();
}

bool NativeReactNativeFeatureFlags::useSharedAnimatedBackend(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useSharedAnimatedBackend();
}

bool NativeReactNativeFeatureFlags::useTraitHiddenOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTraitHiddenOnAndroid();
}

bool NativeReactNativeFeatureFlags::useTurboModuleInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

bool NativeReactNativeFeatureFlags::useTurboModules(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModules();
}

double NativeReactNativeFeatureFlags::viewCullingOutsetRatio(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::viewCullingOutsetRatio();
}

double NativeReactNativeFeatureFlags::virtualViewHysteresisRatio(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::virtualViewHysteresisRatio();
}

double NativeReactNativeFeatureFlags::virtualViewPrerenderRatio(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::virtualViewPrerenderRatio();
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<45e1b08fd2438b27af82591b5cfa5744>>
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
    : NativeReactNativeFeatureFlagsCxxSpecJSI(std::move(jsInvoker)) {}

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

bool NativeReactNativeFeatureFlags::animatedShouldSignalBatch(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::animatedShouldSignalBatch();
}

bool NativeReactNativeFeatureFlags::cxxNativeAnimatedEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedEnabled();
}

bool NativeReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync();
}

bool NativeReactNativeFeatureFlags::disableMainQueueSyncDispatchIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableMainQueueSyncDispatchIOS();
}

bool NativeReactNativeFeatureFlags::disableMountItemReorderingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
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

bool NativeReactNativeFeatureFlags::enableFixForParentTagDuringReparenting(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFixForParentTagDuringReparenting();
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

bool NativeReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS();
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

bool NativeReactNativeFeatureFlags::enableMainQueueModulesOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableMainQueueModulesOnIOS();
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

bool NativeReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables();
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

bool NativeReactNativeFeatureFlags::enableSynchronousStateUpdates(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableSynchronousStateUpdates();
}

bool NativeReactNativeFeatureFlags::enableViewCulling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewCulling();
}

bool NativeReactNativeFeatureFlags::enableViewRecycling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForText(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForText();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForView(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForView();
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

bool NativeReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
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

double NativeReactNativeFeatureFlags::preparedTextCacheSize(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::preparedTextCacheSize();
}

bool NativeReactNativeFeatureFlags::preventShadowTreeCommitExhaustion(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion();
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

bool NativeReactNativeFeatureFlags::useTurboModuleInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

bool NativeReactNativeFeatureFlags::useTurboModules(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModules();
}

double NativeReactNativeFeatureFlags::virtualViewPrerenderRatio(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::virtualViewPrerenderRatio();
}

} // namespace facebook::react

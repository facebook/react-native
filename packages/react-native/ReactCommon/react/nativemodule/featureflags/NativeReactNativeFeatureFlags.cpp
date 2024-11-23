/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<aeb742608efce797a86b73e243a62d0c>>
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

bool NativeReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool NativeReactNativeFeatureFlags::disableEventLoopOnBridgeless(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableEventLoopOnBridgeless();
}

bool NativeReactNativeFeatureFlags::disableMountItemReorderingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
}

bool NativeReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS();
}

bool NativeReactNativeFeatureFlags::enableAndroidLineHeightCentering(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAndroidLineHeightCentering();
}

bool NativeReactNativeFeatureFlags::enableBridgelessArchitecture(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableBridgelessArchitecture();
}

bool NativeReactNativeFeatureFlags::enableCppPropsIteratorSetter(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableCppPropsIteratorSetter();
}

bool NativeReactNativeFeatureFlags::enableDeletionOfUnmountedViews(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableDeletionOfUnmountedViews();
}

bool NativeReactNativeFeatureFlags::enableEagerRootViewAttachment(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool NativeReactNativeFeatureFlags::enableEventEmitterRetentionDuringGesturesOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableEventEmitterRetentionDuringGesturesOnAndroid();
}

bool NativeReactNativeFeatureFlags::enableFabricLogs(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool NativeReactNativeFeatureFlags::enableFabricRenderer(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricRenderer();
}

bool NativeReactNativeFeatureFlags::enableFabricRendererExclusively(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricRendererExclusively();
}

bool NativeReactNativeFeatureFlags::enableFixForViewCommandRace(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFixForViewCommandRace();
}

bool NativeReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation();
}

bool NativeReactNativeFeatureFlags::enableIOSViewClipToPaddingBox(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool NativeReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid();
}

bool NativeReactNativeFeatureFlags::enableLayoutAnimationsOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool NativeReactNativeFeatureFlags::enableLongTaskAPI(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLongTaskAPI();
}

bool NativeReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables();
}

bool NativeReactNativeFeatureFlags::enablePreciseSchedulingForPremountItemsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enablePreciseSchedulingForPremountItemsOnAndroid();
}

bool NativeReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid();
}

bool NativeReactNativeFeatureFlags::enableReportEventPaintTime(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableReportEventPaintTime();
}

bool NativeReactNativeFeatureFlags::enableSynchronousStateUpdates(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableSynchronousStateUpdates();
}

bool NativeReactNativeFeatureFlags::enableUIConsistency(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableUIConsistency();
}

bool NativeReactNativeFeatureFlags::enableViewRecycling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool NativeReactNativeFeatureFlags::excludeYogaFromRawProps(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::excludeYogaFromRawProps();
}

bool NativeReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool NativeReactNativeFeatureFlags::fixMountingCoordinatorReportedPendingTransactionsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
}

bool NativeReactNativeFeatureFlags::fuseboxEnabledDebug(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledDebug();
}

bool NativeReactNativeFeatureFlags::fuseboxEnabledRelease(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledRelease();
}

bool NativeReactNativeFeatureFlags::initEagerTurboModulesOnNativeModulesQueueAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::initEagerTurboModulesOnNativeModulesQueueAndroid();
}

bool NativeReactNativeFeatureFlags::lazyAnimationCallbacks(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::lazyAnimationCallbacks();
}

bool NativeReactNativeFeatureFlags::loadVectorDrawablesOnImages(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::loadVectorDrawablesOnImages();
}

bool NativeReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool NativeReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling();
}

bool NativeReactNativeFeatureFlags::useFabricInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool NativeReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless();
}

bool NativeReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool NativeReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid();
}

bool NativeReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid();
}

bool NativeReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate();
}

bool NativeReactNativeFeatureFlags::useTurboModuleInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

bool NativeReactNativeFeatureFlags::useTurboModules(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModules();
}

} // namespace facebook::react

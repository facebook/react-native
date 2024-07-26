/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<36eec357aa0b6523665b640bdda3cb0f>>
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

bool NativeReactNativeFeatureFlags::allowCollapsableChildren(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::allowCollapsableChildren();
}

bool NativeReactNativeFeatureFlags::allowRecursiveCommitsWithSynchronousMountOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::allowRecursiveCommitsWithSynchronousMountOnAndroid();
}

bool NativeReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop();
}

bool NativeReactNativeFeatureFlags::changeOrderOfMountingInstructionsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::changeOrderOfMountingInstructionsOnAndroid();
}

bool NativeReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool NativeReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager();
}

bool NativeReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS();
}

bool NativeReactNativeFeatureFlags::enableCleanTextInputYogaNode(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableCleanTextInputYogaNode();
}

bool NativeReactNativeFeatureFlags::enableEagerRootViewAttachment(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool NativeReactNativeFeatureFlags::enableFabricLogs(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool NativeReactNativeFeatureFlags::enableFabricRendererExclusively(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricRendererExclusively();
}

bool NativeReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation();
}

bool NativeReactNativeFeatureFlags::enableLongTaskAPI(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLongTaskAPI();
}

bool NativeReactNativeFeatureFlags::enableMicrotasks(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableMicrotasks();
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

bool NativeReactNativeFeatureFlags::excludeYogaFromRawProps(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::excludeYogaFromRawProps();
}

bool NativeReactNativeFeatureFlags::fetchImagesInViewPreallocation(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fetchImagesInViewPreallocation();
}

bool NativeReactNativeFeatureFlags::fixIncorrectScrollViewStateUpdateOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixIncorrectScrollViewStateUpdateOnAndroid();
}

bool NativeReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool NativeReactNativeFeatureFlags::fixMissedFabricStateUpdatesOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMissedFabricStateUpdatesOnAndroid();
}

bool NativeReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid();
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

bool NativeReactNativeFeatureFlags::setAndroidLayoutDirection(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::setAndroidLayoutDirection();
}

bool NativeReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool NativeReactNativeFeatureFlags::unstable_useFabricInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::unstable_useFabricInterop();
}

bool NativeReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless();
}

bool NativeReactNativeFeatureFlags::useModernRuntimeScheduler(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useModernRuntimeScheduler();
}

bool NativeReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool NativeReactNativeFeatureFlags::useNewReactImageViewBackgroundDrawing(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNewReactImageViewBackgroundDrawing();
}

bool NativeReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid();
}

bool NativeReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate();
}

bool NativeReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdateOnLayout(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdateOnLayout();
}

bool NativeReactNativeFeatureFlags::useStateAlignmentMechanism(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useStateAlignmentMechanism();
}

} // namespace facebook::react

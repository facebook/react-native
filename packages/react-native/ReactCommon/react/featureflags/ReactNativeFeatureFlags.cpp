/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<5c4ae3a29f0191428284e0c660353edf>>
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

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return getAccessor().batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid() {
  return getAccessor().completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool ReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager() {
  return getAccessor().destroyFabricSurfacesInReactInstanceManager();
}

bool ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS() {
  return getAccessor().enableAlignItemsBaselineOnFabricIOS();
}

bool ReactNativeFeatureFlags::enableAndroidMixBlendModeProp() {
  return getAccessor().enableAndroidMixBlendModeProp();
}

bool ReactNativeFeatureFlags::enableBackgroundStyleApplicator() {
  return getAccessor().enableBackgroundStyleApplicator();
}

bool ReactNativeFeatureFlags::enableCleanTextInputYogaNode() {
  return getAccessor().enableCleanTextInputYogaNode();
}

bool ReactNativeFeatureFlags::enableEagerRootViewAttachment() {
  return getAccessor().enableEagerRootViewAttachment();
}

bool ReactNativeFeatureFlags::enableEventEmitterRetentionDuringGesturesOnAndroid() {
  return getAccessor().enableEventEmitterRetentionDuringGesturesOnAndroid();
}

bool ReactNativeFeatureFlags::enableFabricLogs() {
  return getAccessor().enableFabricLogs();
}

bool ReactNativeFeatureFlags::enableFabricRendererExclusively() {
  return getAccessor().enableFabricRendererExclusively();
}

bool ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation() {
  return getAccessor().enableGranularShadowTreeStateReconciliation();
}

bool ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox() {
  return getAccessor().enableIOSViewClipToPaddingBox();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS() {
  return getAccessor().enableLayoutAnimationsOnIOS();
}

bool ReactNativeFeatureFlags::enableLongTaskAPI() {
  return getAccessor().enableLongTaskAPI();
}

bool ReactNativeFeatureFlags::enableMicrotasks() {
  return getAccessor().enableMicrotasks();
}

bool ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid() {
  return getAccessor().enablePropsUpdateReconciliationAndroid();
}

bool ReactNativeFeatureFlags::enableReportEventPaintTime() {
  return getAccessor().enableReportEventPaintTime();
}

bool ReactNativeFeatureFlags::enableSynchronousStateUpdates() {
  return getAccessor().enableSynchronousStateUpdates();
}

bool ReactNativeFeatureFlags::enableUIConsistency() {
  return getAccessor().enableUIConsistency();
}

bool ReactNativeFeatureFlags::enableViewRecycling() {
  return getAccessor().enableViewRecycling();
}

bool ReactNativeFeatureFlags::excludeYogaFromRawProps() {
  return getAccessor().excludeYogaFromRawProps();
}

bool ReactNativeFeatureFlags::fetchImagesInViewPreallocation() {
  return getAccessor().fetchImagesInViewPreallocation();
}

bool ReactNativeFeatureFlags::fixIncorrectScrollViewStateUpdateOnAndroid() {
  return getAccessor().fixIncorrectScrollViewStateUpdateOnAndroid();
}

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return getAccessor().fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool ReactNativeFeatureFlags::fixMissedFabricStateUpdatesOnAndroid() {
  return getAccessor().fixMissedFabricStateUpdatesOnAndroid();
}

bool ReactNativeFeatureFlags::fixMountingCoordinatorReportedPendingTransactionsOnAndroid() {
  return getAccessor().fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
}

bool ReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid() {
  return getAccessor().forceBatchingMountItemsOnAndroid();
}

bool ReactNativeFeatureFlags::fuseboxEnabledDebug() {
  return getAccessor().fuseboxEnabledDebug();
}

bool ReactNativeFeatureFlags::fuseboxEnabledRelease() {
  return getAccessor().fuseboxEnabledRelease();
}

bool ReactNativeFeatureFlags::initEagerTurboModulesOnNativeModulesQueueAndroid() {
  return getAccessor().initEagerTurboModulesOnNativeModulesQueueAndroid();
}

bool ReactNativeFeatureFlags::lazyAnimationCallbacks() {
  return getAccessor().lazyAnimationCallbacks();
}

bool ReactNativeFeatureFlags::loadVectorDrawablesOnImages() {
  return getAccessor().loadVectorDrawablesOnImages();
}

bool ReactNativeFeatureFlags::setAndroidLayoutDirection() {
  return getAccessor().setAndroidLayoutDirection();
}

bool ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid() {
  return getAccessor().traceTurboModulePromiseRejectionsOnAndroid();
}

bool ReactNativeFeatureFlags::useFabricInterop() {
  return getAccessor().useFabricInterop();
}

bool ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless() {
  return getAccessor().useImmediateExecutorInAndroidBridgeless();
}

bool ReactNativeFeatureFlags::useModernRuntimeScheduler() {
  return getAccessor().useModernRuntimeScheduler();
}

bool ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode() {
  return getAccessor().useNativeViewConfigsInBridgelessMode();
}

bool ReactNativeFeatureFlags::useNewReactImageViewBackgroundDrawing() {
  return getAccessor().useNewReactImageViewBackgroundDrawing();
}

bool ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid() {
  return getAccessor().useOptimisedViewPreallocationOnAndroid();
}

bool ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid() {
  return getAccessor().useOptimizedEventBatchingOnAndroid();
}

bool ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate() {
  return getAccessor().useRuntimeShadowNodeReferenceUpdate();
}

bool ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdateOnLayout() {
  return getAccessor().useRuntimeShadowNodeReferenceUpdateOnLayout();
}

bool ReactNativeFeatureFlags::useStateAlignmentMechanism() {
  return getAccessor().useStateAlignmentMechanism();
}

bool ReactNativeFeatureFlags::useTurboModuleInterop() {
  return getAccessor().useTurboModuleInterop();
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

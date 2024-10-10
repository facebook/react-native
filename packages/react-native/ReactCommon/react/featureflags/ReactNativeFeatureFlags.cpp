/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<5d184db28f8dc9a92bb9898cbc9b4be0>>
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

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wglobal-constructors"
std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor_ =
    std::make_unique<ReactNativeFeatureFlagsAccessor>();
#pragma GCC diagnostic pop

bool ReactNativeFeatureFlags::commonTestFlag() {
  return accessor_->commonTestFlag();
}

bool ReactNativeFeatureFlags::allowRecursiveCommitsWithSynchronousMountOnAndroid() {
  return accessor_->allowRecursiveCommitsWithSynchronousMountOnAndroid();
}

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return accessor_->batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid() {
  return accessor_->completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS() {
  return accessor_->enableAlignItemsBaselineOnFabricIOS();
}

bool ReactNativeFeatureFlags::enableAndroidLineHeightCentering() {
  return accessor_->enableAndroidLineHeightCentering();
}

bool ReactNativeFeatureFlags::enableBridgelessArchitecture() {
  return accessor_->enableBridgelessArchitecture();
}

bool ReactNativeFeatureFlags::enableCleanTextInputYogaNode() {
  return accessor_->enableCleanTextInputYogaNode();
}

bool ReactNativeFeatureFlags::enableDeletionOfUnmountedViews() {
  return accessor_->enableDeletionOfUnmountedViews();
}

bool ReactNativeFeatureFlags::enableEagerRootViewAttachment() {
  return accessor_->enableEagerRootViewAttachment();
}

bool ReactNativeFeatureFlags::enableEventEmitterRetentionDuringGesturesOnAndroid() {
  return accessor_->enableEventEmitterRetentionDuringGesturesOnAndroid();
}

bool ReactNativeFeatureFlags::enableFabricLogs() {
  return accessor_->enableFabricLogs();
}

bool ReactNativeFeatureFlags::enableFabricRenderer() {
  return accessor_->enableFabricRenderer();
}

bool ReactNativeFeatureFlags::enableFabricRendererExclusively() {
  return accessor_->enableFabricRendererExclusively();
}

bool ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation() {
  return accessor_->enableGranularShadowTreeStateReconciliation();
}

bool ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox() {
  return accessor_->enableIOSViewClipToPaddingBox();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid() {
  return accessor_->enableLayoutAnimationsOnAndroid();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS() {
  return accessor_->enableLayoutAnimationsOnIOS();
}

bool ReactNativeFeatureFlags::enableLongTaskAPI() {
  return accessor_->enableLongTaskAPI();
}

bool ReactNativeFeatureFlags::enableMicrotasks() {
  return accessor_->enableMicrotasks();
}

bool ReactNativeFeatureFlags::enablePreciseSchedulingForPremountItemsOnAndroid() {
  return accessor_->enablePreciseSchedulingForPremountItemsOnAndroid();
}

bool ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid() {
  return accessor_->enablePropsUpdateReconciliationAndroid();
}

bool ReactNativeFeatureFlags::enableReportEventPaintTime() {
  return accessor_->enableReportEventPaintTime();
}

bool ReactNativeFeatureFlags::enableSynchronousStateUpdates() {
  return accessor_->enableSynchronousStateUpdates();
}

bool ReactNativeFeatureFlags::enableTextPreallocationOptimisation() {
  return accessor_->enableTextPreallocationOptimisation();
}

bool ReactNativeFeatureFlags::enableUIConsistency() {
  return accessor_->enableUIConsistency();
}

bool ReactNativeFeatureFlags::enableViewRecycling() {
  return accessor_->enableViewRecycling();
}

bool ReactNativeFeatureFlags::excludeYogaFromRawProps() {
  return accessor_->excludeYogaFromRawProps();
}

bool ReactNativeFeatureFlags::fetchImagesInViewPreallocation() {
  return accessor_->fetchImagesInViewPreallocation();
}

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return accessor_->fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool ReactNativeFeatureFlags::fixMountingCoordinatorReportedPendingTransactionsOnAndroid() {
  return accessor_->fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
}

bool ReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid() {
  return accessor_->forceBatchingMountItemsOnAndroid();
}

bool ReactNativeFeatureFlags::fuseboxEnabledDebug() {
  return accessor_->fuseboxEnabledDebug();
}

bool ReactNativeFeatureFlags::fuseboxEnabledRelease() {
  return accessor_->fuseboxEnabledRelease();
}

bool ReactNativeFeatureFlags::initEagerTurboModulesOnNativeModulesQueueAndroid() {
  return accessor_->initEagerTurboModulesOnNativeModulesQueueAndroid();
}

bool ReactNativeFeatureFlags::lazyAnimationCallbacks() {
  return accessor_->lazyAnimationCallbacks();
}

bool ReactNativeFeatureFlags::loadVectorDrawablesOnImages() {
  return accessor_->loadVectorDrawablesOnImages();
}

bool ReactNativeFeatureFlags::removeNestedCallsToDispatchMountItemsOnAndroid() {
  return accessor_->removeNestedCallsToDispatchMountItemsOnAndroid();
}

bool ReactNativeFeatureFlags::setAndroidLayoutDirection() {
  return accessor_->setAndroidLayoutDirection();
}

bool ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid() {
  return accessor_->traceTurboModulePromiseRejectionsOnAndroid();
}

bool ReactNativeFeatureFlags::useFabricInterop() {
  return accessor_->useFabricInterop();
}

bool ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless() {
  return accessor_->useImmediateExecutorInAndroidBridgeless();
}

bool ReactNativeFeatureFlags::useModernRuntimeScheduler() {
  return accessor_->useModernRuntimeScheduler();
}

bool ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode() {
  return accessor_->useNativeViewConfigsInBridgelessMode();
}

bool ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid() {
  return accessor_->useOptimisedViewPreallocationOnAndroid();
}

bool ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid() {
  return accessor_->useOptimizedEventBatchingOnAndroid();
}

bool ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate() {
  return accessor_->useRuntimeShadowNodeReferenceUpdate();
}

bool ReactNativeFeatureFlags::useTurboModuleInterop() {
  return accessor_->useTurboModuleInterop();
}

bool ReactNativeFeatureFlags::useTurboModules() {
  return accessor_->useTurboModules();
}

void ReactNativeFeatureFlags::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  accessor_->override(std::move(provider));
}

void ReactNativeFeatureFlags::dangerouslyReset() {
  accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
}

} // namespace facebook::react

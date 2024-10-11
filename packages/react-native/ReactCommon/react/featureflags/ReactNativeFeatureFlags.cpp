/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<14957b53f50e3ea943f0e3631475f336>>
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
std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor_;
#pragma GCC diagnostic pop

bool ReactNativeFeatureFlags::commonTestFlag() {
  return getAccessor().commonTestFlag();
}

bool ReactNativeFeatureFlags::allowRecursiveCommitsWithSynchronousMountOnAndroid() {
  return getAccessor().allowRecursiveCommitsWithSynchronousMountOnAndroid();
}

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return getAccessor().batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid() {
  return getAccessor().completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS() {
  return getAccessor().enableAlignItemsBaselineOnFabricIOS();
}

bool ReactNativeFeatureFlags::enableAndroidLineHeightCentering() {
  return getAccessor().enableAndroidLineHeightCentering();
}

bool ReactNativeFeatureFlags::enableBridgelessArchitecture() {
  return getAccessor().enableBridgelessArchitecture();
}

bool ReactNativeFeatureFlags::enableCleanTextInputYogaNode() {
  return getAccessor().enableCleanTextInputYogaNode();
}

bool ReactNativeFeatureFlags::enableDeletionOfUnmountedViews() {
  return getAccessor().enableDeletionOfUnmountedViews();
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

bool ReactNativeFeatureFlags::enableFabricRenderer() {
  return getAccessor().enableFabricRenderer();
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

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid() {
  return getAccessor().enableLayoutAnimationsOnAndroid();
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

bool ReactNativeFeatureFlags::enablePreciseSchedulingForPremountItemsOnAndroid() {
  return getAccessor().enablePreciseSchedulingForPremountItemsOnAndroid();
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

bool ReactNativeFeatureFlags::enableTextPreallocationOptimisation() {
  return getAccessor().enableTextPreallocationOptimisation();
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

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return getAccessor().fixMappingOfEventPrioritiesBetweenFabricAndReact();
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

bool ReactNativeFeatureFlags::removeNestedCallsToDispatchMountItemsOnAndroid() {
  return getAccessor().removeNestedCallsToDispatchMountItemsOnAndroid();
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

bool ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid() {
  return getAccessor().useOptimisedViewPreallocationOnAndroid();
}

bool ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid() {
  return getAccessor().useOptimizedEventBatchingOnAndroid();
}

bool ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate() {
  return getAccessor().useRuntimeShadowNodeReferenceUpdate();
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

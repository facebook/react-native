/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<cd77cfb18c0099b88035ff42fcd2dd46>>
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

bool ReactNativeFeatureFlagsAccessor::completeReactInstanceCreationOnBgThreadOnAndroid() {
  auto flagValue = completeReactInstanceCreationOnBgThreadOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(1, "completeReactInstanceCreationOnBgThreadOnAndroid");

    flagValue = currentProvider_->completeReactInstanceCreationOnBgThreadOnAndroid();
    completeReactInstanceCreationOnBgThreadOnAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::disableEventLoopOnBridgeless() {
  auto flagValue = disableEventLoopOnBridgeless_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(2, "disableEventLoopOnBridgeless");

    flagValue = currentProvider_->disableEventLoopOnBridgeless();
    disableEventLoopOnBridgeless_ = flagValue;
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

    markFlagAsAccessed(3, "disableMountItemReorderingAndroid");

    flagValue = currentProvider_->disableMountItemReorderingAndroid();
    disableMountItemReorderingAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAlignItemsBaselineOnFabricIOS() {
  auto flagValue = enableAlignItemsBaselineOnFabricIOS_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(4, "enableAlignItemsBaselineOnFabricIOS");

    flagValue = currentProvider_->enableAlignItemsBaselineOnFabricIOS();
    enableAlignItemsBaselineOnFabricIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableAndroidLineHeightCentering() {
  auto flagValue = enableAndroidLineHeightCentering_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(5, "enableAndroidLineHeightCentering");

    flagValue = currentProvider_->enableAndroidLineHeightCentering();
    enableAndroidLineHeightCentering_ = flagValue;
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

    markFlagAsAccessed(6, "enableBridgelessArchitecture");

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

    markFlagAsAccessed(7, "enableCppPropsIteratorSetter");

    flagValue = currentProvider_->enableCppPropsIteratorSetter();
    enableCppPropsIteratorSetter_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableDeletionOfUnmountedViews() {
  auto flagValue = enableDeletionOfUnmountedViews_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(8, "enableDeletionOfUnmountedViews");

    flagValue = currentProvider_->enableDeletionOfUnmountedViews();
    enableDeletionOfUnmountedViews_ = flagValue;
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

    markFlagAsAccessed(9, "enableEagerRootViewAttachment");

    flagValue = currentProvider_->enableEagerRootViewAttachment();
    enableEagerRootViewAttachment_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableEventEmitterRetentionDuringGesturesOnAndroid() {
  auto flagValue = enableEventEmitterRetentionDuringGesturesOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(10, "enableEventEmitterRetentionDuringGesturesOnAndroid");

    flagValue = currentProvider_->enableEventEmitterRetentionDuringGesturesOnAndroid();
    enableEventEmitterRetentionDuringGesturesOnAndroid_ = flagValue;
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

    markFlagAsAccessed(11, "enableFabricLogs");

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

    markFlagAsAccessed(12, "enableFabricRenderer");

    flagValue = currentProvider_->enableFabricRenderer();
    enableFabricRenderer_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFabricRendererExclusively() {
  auto flagValue = enableFabricRendererExclusively_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(13, "enableFabricRendererExclusively");

    flagValue = currentProvider_->enableFabricRendererExclusively();
    enableFabricRendererExclusively_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFixForViewCommandRace() {
  auto flagValue = enableFixForViewCommandRace_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(14, "enableFixForViewCommandRace");

    flagValue = currentProvider_->enableFixForViewCommandRace();
    enableFixForViewCommandRace_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableGranularShadowTreeStateReconciliation() {
  auto flagValue = enableGranularShadowTreeStateReconciliation_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(15, "enableGranularShadowTreeStateReconciliation");

    flagValue = currentProvider_->enableGranularShadowTreeStateReconciliation();
    enableGranularShadowTreeStateReconciliation_ = flagValue;
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

    markFlagAsAccessed(16, "enableIOSViewClipToPaddingBox");

    flagValue = currentProvider_->enableIOSViewClipToPaddingBox();
    enableIOSViewClipToPaddingBox_ = flagValue;
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

    markFlagAsAccessed(17, "enableLayoutAnimationsOnAndroid");

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

    markFlagAsAccessed(18, "enableLayoutAnimationsOnIOS");

    flagValue = currentProvider_->enableLayoutAnimationsOnIOS();
    enableLayoutAnimationsOnIOS_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableLongTaskAPI() {
  auto flagValue = enableLongTaskAPI_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(19, "enableLongTaskAPI");

    flagValue = currentProvider_->enableLongTaskAPI();
    enableLongTaskAPI_ = flagValue;
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

    markFlagAsAccessed(20, "enableNewBackgroundAndBorderDrawables");

    flagValue = currentProvider_->enableNewBackgroundAndBorderDrawables();
    enableNewBackgroundAndBorderDrawables_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enablePreciseSchedulingForPremountItemsOnAndroid() {
  auto flagValue = enablePreciseSchedulingForPremountItemsOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(21, "enablePreciseSchedulingForPremountItemsOnAndroid");

    flagValue = currentProvider_->enablePreciseSchedulingForPremountItemsOnAndroid();
    enablePreciseSchedulingForPremountItemsOnAndroid_ = flagValue;
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

    markFlagAsAccessed(22, "enablePropsUpdateReconciliationAndroid");

    flagValue = currentProvider_->enablePropsUpdateReconciliationAndroid();
    enablePropsUpdateReconciliationAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableReportEventPaintTime() {
  auto flagValue = enableReportEventPaintTime_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(23, "enableReportEventPaintTime");

    flagValue = currentProvider_->enableReportEventPaintTime();
    enableReportEventPaintTime_ = flagValue;
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

    markFlagAsAccessed(24, "enableSynchronousStateUpdates");

    flagValue = currentProvider_->enableSynchronousStateUpdates();
    enableSynchronousStateUpdates_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableUIConsistency() {
  auto flagValue = enableUIConsistency_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(25, "enableUIConsistency");

    flagValue = currentProvider_->enableUIConsistency();
    enableUIConsistency_ = flagValue;
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

    markFlagAsAccessed(26, "enableViewRecycling");

    flagValue = currentProvider_->enableViewRecycling();
    enableViewRecycling_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::excludeYogaFromRawProps() {
  auto flagValue = excludeYogaFromRawProps_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(27, "excludeYogaFromRawProps");

    flagValue = currentProvider_->excludeYogaFromRawProps();
    excludeYogaFromRawProps_ = flagValue;
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

    markFlagAsAccessed(28, "fixMappingOfEventPrioritiesBetweenFabricAndReact");

    flagValue = currentProvider_->fixMappingOfEventPrioritiesBetweenFabricAndReact();
    fixMappingOfEventPrioritiesBetweenFabricAndReact_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fixMountingCoordinatorReportedPendingTransactionsOnAndroid() {
  auto flagValue = fixMountingCoordinatorReportedPendingTransactionsOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(29, "fixMountingCoordinatorReportedPendingTransactionsOnAndroid");

    flagValue = currentProvider_->fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
    fixMountingCoordinatorReportedPendingTransactionsOnAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::fuseboxEnabledDebug() {
  auto flagValue = fuseboxEnabledDebug_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(30, "fuseboxEnabledDebug");

    flagValue = currentProvider_->fuseboxEnabledDebug();
    fuseboxEnabledDebug_ = flagValue;
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

    markFlagAsAccessed(31, "fuseboxEnabledRelease");

    flagValue = currentProvider_->fuseboxEnabledRelease();
    fuseboxEnabledRelease_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::initEagerTurboModulesOnNativeModulesQueueAndroid() {
  auto flagValue = initEagerTurboModulesOnNativeModulesQueueAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(32, "initEagerTurboModulesOnNativeModulesQueueAndroid");

    flagValue = currentProvider_->initEagerTurboModulesOnNativeModulesQueueAndroid();
    initEagerTurboModulesOnNativeModulesQueueAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::lazyAnimationCallbacks() {
  auto flagValue = lazyAnimationCallbacks_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(33, "lazyAnimationCallbacks");

    flagValue = currentProvider_->lazyAnimationCallbacks();
    lazyAnimationCallbacks_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::loadVectorDrawablesOnImages() {
  auto flagValue = loadVectorDrawablesOnImages_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(34, "loadVectorDrawablesOnImages");

    flagValue = currentProvider_->loadVectorDrawablesOnImages();
    loadVectorDrawablesOnImages_ = flagValue;
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

    markFlagAsAccessed(35, "traceTurboModulePromiseRejectionsOnAndroid");

    flagValue = currentProvider_->traceTurboModulePromiseRejectionsOnAndroid();
    traceTurboModulePromiseRejectionsOnAndroid_ = flagValue;
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

    markFlagAsAccessed(36, "useAlwaysAvailableJSErrorHandling");

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

    markFlagAsAccessed(37, "useFabricInterop");

    flagValue = currentProvider_->useFabricInterop();
    useFabricInterop_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useImmediateExecutorInAndroidBridgeless() {
  auto flagValue = useImmediateExecutorInAndroidBridgeless_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(38, "useImmediateExecutorInAndroidBridgeless");

    flagValue = currentProvider_->useImmediateExecutorInAndroidBridgeless();
    useImmediateExecutorInAndroidBridgeless_ = flagValue;
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

    markFlagAsAccessed(39, "useNativeViewConfigsInBridgelessMode");

    flagValue = currentProvider_->useNativeViewConfigsInBridgelessMode();
    useNativeViewConfigsInBridgelessMode_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useOptimisedViewPreallocationOnAndroid() {
  auto flagValue = useOptimisedViewPreallocationOnAndroid_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(40, "useOptimisedViewPreallocationOnAndroid");

    flagValue = currentProvider_->useOptimisedViewPreallocationOnAndroid();
    useOptimisedViewPreallocationOnAndroid_ = flagValue;
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

    markFlagAsAccessed(41, "useOptimizedEventBatchingOnAndroid");

    flagValue = currentProvider_->useOptimizedEventBatchingOnAndroid();
    useOptimizedEventBatchingOnAndroid_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useRuntimeShadowNodeReferenceUpdate() {
  auto flagValue = useRuntimeShadowNodeReferenceUpdate_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(42, "useRuntimeShadowNodeReferenceUpdate");

    flagValue = currentProvider_->useRuntimeShadowNodeReferenceUpdate();
    useRuntimeShadowNodeReferenceUpdate_ = flagValue;
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

    markFlagAsAccessed(43, "useTurboModuleInterop");

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

    markFlagAsAccessed(44, "useTurboModules");

    flagValue = currentProvider_->useTurboModules();
    useTurboModules_ = flagValue;
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

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<7cc1ba6a89d06d8cabf1271a725e7379>>
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

#pragma once

namespace facebook::react {

class ReactNativeFeatureFlagsProvider {
 public:
  virtual ~ReactNativeFeatureFlagsProvider() = default;

  virtual bool commonTestFlag() = 0;
  virtual bool allowRecursiveCommitsWithSynchronousMountOnAndroid() = 0;
  virtual bool batchRenderingUpdatesInEventLoop() = 0;
  virtual bool completeReactInstanceCreationOnBgThreadOnAndroid() = 0;
  virtual bool enableAlignItemsBaselineOnFabricIOS() = 0;
  virtual bool enableAndroidLineHeightCentering() = 0;
  virtual bool enableBridgelessArchitecture() = 0;
  virtual bool enableCleanTextInputYogaNode() = 0;
  virtual bool enableDeletionOfUnmountedViews() = 0;
  virtual bool enableEagerRootViewAttachment() = 0;
  virtual bool enableEventEmitterRetentionDuringGesturesOnAndroid() = 0;
  virtual bool enableFabricLogs() = 0;
  virtual bool enableFabricRenderer() = 0;
  virtual bool enableFabricRendererExclusively() = 0;
  virtual bool enableGranularShadowTreeStateReconciliation() = 0;
  virtual bool enableIOSViewClipToPaddingBox() = 0;
  virtual bool enableLayoutAnimationsOnAndroid() = 0;
  virtual bool enableLayoutAnimationsOnIOS() = 0;
  virtual bool enableLongTaskAPI() = 0;
  virtual bool enableMicrotasks() = 0;
  virtual bool enablePreciseSchedulingForPremountItemsOnAndroid() = 0;
  virtual bool enablePropsUpdateReconciliationAndroid() = 0;
  virtual bool enableReportEventPaintTime() = 0;
  virtual bool enableSynchronousStateUpdates() = 0;
  virtual bool enableTextPreallocationOptimisation() = 0;
  virtual bool enableUIConsistency() = 0;
  virtual bool enableViewRecycling() = 0;
  virtual bool excludeYogaFromRawProps() = 0;
  virtual bool fetchImagesInViewPreallocation() = 0;
  virtual bool fixMappingOfEventPrioritiesBetweenFabricAndReact() = 0;
  virtual bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() = 0;
  virtual bool forceBatchingMountItemsOnAndroid() = 0;
  virtual bool fuseboxEnabledDebug() = 0;
  virtual bool fuseboxEnabledRelease() = 0;
  virtual bool initEagerTurboModulesOnNativeModulesQueueAndroid() = 0;
  virtual bool lazyAnimationCallbacks() = 0;
  virtual bool loadVectorDrawablesOnImages() = 0;
  virtual bool removeNestedCallsToDispatchMountItemsOnAndroid() = 0;
  virtual bool setAndroidLayoutDirection() = 0;
  virtual bool traceTurboModulePromiseRejectionsOnAndroid() = 0;
  virtual bool useFabricInterop() = 0;
  virtual bool useImmediateExecutorInAndroidBridgeless() = 0;
  virtual bool useModernRuntimeScheduler() = 0;
  virtual bool useNativeViewConfigsInBridgelessMode() = 0;
  virtual bool useOptimisedViewPreallocationOnAndroid() = 0;
  virtual bool useOptimizedEventBatchingOnAndroid() = 0;
  virtual bool useRuntimeShadowNodeReferenceUpdate() = 0;
  virtual bool useTurboModuleInterop() = 0;
  virtual bool useTurboModules() = 0;
};

} // namespace facebook::react

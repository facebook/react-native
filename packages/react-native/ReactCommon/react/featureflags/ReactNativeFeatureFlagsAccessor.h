/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<40524ae1aeea67a6b9789b195bc567f6>>
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

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <array>
#include <atomic>
#include <memory>
#include <optional>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

  bool commonTestFlag();
  bool allowRecursiveCommitsWithSynchronousMountOnAndroid();
  bool batchRenderingUpdatesInEventLoop();
  bool completeReactInstanceCreationOnBgThreadOnAndroid();
  bool destroyFabricSurfacesInReactInstanceManager();
  bool enableAlignItemsBaselineOnFabricIOS();
  bool enableAndroidLineHeightCentering();
  bool enableAndroidMixBlendModeProp();
  bool enableBackgroundStyleApplicator();
  bool enableBridgelessArchitecture();
  bool enableCleanTextInputYogaNode();
  bool enableDeletionOfUnmountedViews();
  bool enableEagerRootViewAttachment();
  bool enableEventEmitterRetentionDuringGesturesOnAndroid();
  bool enableFabricLogs();
  bool enableFabricRenderer();
  bool enableFabricRendererExclusively();
  bool enableGranularShadowTreeStateReconciliation();
  bool enableIOSViewClipToPaddingBox();
  bool enableLongTaskAPI();
  bool enableMicrotasks();
  bool enablePreciseSchedulingForPremountItemsOnAndroid();
  bool enablePropsUpdateReconciliationAndroid();
  bool enableReportEventPaintTime();
  bool enableSynchronousStateUpdates();
  bool enableTextPreallocationOptimisation();
  bool enableUIConsistency();
  bool enableViewRecycling();
  bool excludeYogaFromRawProps();
  bool fetchImagesInViewPreallocation();
  bool fixMappingOfEventPrioritiesBetweenFabricAndReact();
  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
  bool forceBatchingMountItemsOnAndroid();
  bool fuseboxEnabledDebug();
  bool fuseboxEnabledRelease();
  bool initEagerTurboModulesOnNativeModulesQueueAndroid();
  bool lazyAnimationCallbacks();
  bool loadVectorDrawablesOnImages();
  bool removeNestedCallsToDispatchMountItemsOnAndroid();
  bool setAndroidLayoutDirection();
  bool traceTurboModulePromiseRejectionsOnAndroid();
  bool useFabricInterop();
  bool useImmediateExecutorInAndroidBridgeless();
  bool useModernRuntimeScheduler();
  bool useNativeViewConfigsInBridgelessMode();
  bool useNewReactImageViewBackgroundDrawing();
  bool useOptimisedViewPreallocationOnAndroid();
  bool useOptimizedEventBatchingOnAndroid();
  bool useRuntimeShadowNodeReferenceUpdate();
  bool useRuntimeShadowNodeReferenceUpdateOnLayout();
  bool useStateAlignmentMechanism();
  bool useTurboModuleInterop();
  bool useTurboModules();

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  void markFlagAsAccessed(int position, const char* flagName);
  void ensureFlagsNotAccessed();

  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  bool wasOverridden_;

  std::array<std::atomic<const char*>, 53> accessedFeatureFlags_;

  std::atomic<std::optional<bool>> commonTestFlag_;
  std::atomic<std::optional<bool>> allowRecursiveCommitsWithSynchronousMountOnAndroid_;
  std::atomic<std::optional<bool>> batchRenderingUpdatesInEventLoop_;
  std::atomic<std::optional<bool>> completeReactInstanceCreationOnBgThreadOnAndroid_;
  std::atomic<std::optional<bool>> destroyFabricSurfacesInReactInstanceManager_;
  std::atomic<std::optional<bool>> enableAlignItemsBaselineOnFabricIOS_;
  std::atomic<std::optional<bool>> enableAndroidLineHeightCentering_;
  std::atomic<std::optional<bool>> enableAndroidMixBlendModeProp_;
  std::atomic<std::optional<bool>> enableBackgroundStyleApplicator_;
  std::atomic<std::optional<bool>> enableBridgelessArchitecture_;
  std::atomic<std::optional<bool>> enableCleanTextInputYogaNode_;
  std::atomic<std::optional<bool>> enableDeletionOfUnmountedViews_;
  std::atomic<std::optional<bool>> enableEagerRootViewAttachment_;
  std::atomic<std::optional<bool>> enableEventEmitterRetentionDuringGesturesOnAndroid_;
  std::atomic<std::optional<bool>> enableFabricLogs_;
  std::atomic<std::optional<bool>> enableFabricRenderer_;
  std::atomic<std::optional<bool>> enableFabricRendererExclusively_;
  std::atomic<std::optional<bool>> enableGranularShadowTreeStateReconciliation_;
  std::atomic<std::optional<bool>> enableIOSViewClipToPaddingBox_;
  std::atomic<std::optional<bool>> enableLongTaskAPI_;
  std::atomic<std::optional<bool>> enableMicrotasks_;
  std::atomic<std::optional<bool>> enablePreciseSchedulingForPremountItemsOnAndroid_;
  std::atomic<std::optional<bool>> enablePropsUpdateReconciliationAndroid_;
  std::atomic<std::optional<bool>> enableReportEventPaintTime_;
  std::atomic<std::optional<bool>> enableSynchronousStateUpdates_;
  std::atomic<std::optional<bool>> enableTextPreallocationOptimisation_;
  std::atomic<std::optional<bool>> enableUIConsistency_;
  std::atomic<std::optional<bool>> enableViewRecycling_;
  std::atomic<std::optional<bool>> excludeYogaFromRawProps_;
  std::atomic<std::optional<bool>> fetchImagesInViewPreallocation_;
  std::atomic<std::optional<bool>> fixMappingOfEventPrioritiesBetweenFabricAndReact_;
  std::atomic<std::optional<bool>> fixMountingCoordinatorReportedPendingTransactionsOnAndroid_;
  std::atomic<std::optional<bool>> forceBatchingMountItemsOnAndroid_;
  std::atomic<std::optional<bool>> fuseboxEnabledDebug_;
  std::atomic<std::optional<bool>> fuseboxEnabledRelease_;
  std::atomic<std::optional<bool>> initEagerTurboModulesOnNativeModulesQueueAndroid_;
  std::atomic<std::optional<bool>> lazyAnimationCallbacks_;
  std::atomic<std::optional<bool>> loadVectorDrawablesOnImages_;
  std::atomic<std::optional<bool>> removeNestedCallsToDispatchMountItemsOnAndroid_;
  std::atomic<std::optional<bool>> setAndroidLayoutDirection_;
  std::atomic<std::optional<bool>> traceTurboModulePromiseRejectionsOnAndroid_;
  std::atomic<std::optional<bool>> useFabricInterop_;
  std::atomic<std::optional<bool>> useImmediateExecutorInAndroidBridgeless_;
  std::atomic<std::optional<bool>> useModernRuntimeScheduler_;
  std::atomic<std::optional<bool>> useNativeViewConfigsInBridgelessMode_;
  std::atomic<std::optional<bool>> useNewReactImageViewBackgroundDrawing_;
  std::atomic<std::optional<bool>> useOptimisedViewPreallocationOnAndroid_;
  std::atomic<std::optional<bool>> useOptimizedEventBatchingOnAndroid_;
  std::atomic<std::optional<bool>> useRuntimeShadowNodeReferenceUpdate_;
  std::atomic<std::optional<bool>> useRuntimeShadowNodeReferenceUpdateOnLayout_;
  std::atomic<std::optional<bool>> useStateAlignmentMechanism_;
  std::atomic<std::optional<bool>> useTurboModuleInterop_;
  std::atomic<std::optional<bool>> useTurboModules_;
};

} // namespace facebook::react

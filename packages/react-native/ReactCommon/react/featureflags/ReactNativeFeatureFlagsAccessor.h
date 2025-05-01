/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<267385c8df88a5d1eb7f1e2478209d39>>
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

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <array>
#include <atomic>
#include <memory>
#include <optional>
#include <string>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

  bool commonTestFlag();
  bool disableMountItemReorderingAndroid();
  bool enableAccumulatedUpdatesInRawPropsAndroid();
  bool enableBridgelessArchitecture();
  bool enableCppPropsIteratorSetter();
  bool enableEagerRootViewAttachment();
  bool enableFabricLogs();
  bool enableFabricRenderer();
  bool enableIOSViewClipToPaddingBox();
  bool enableImagePrefetchingAndroid();
  bool enableJSRuntimeGCOnMemoryPressureOnIOS();
  bool enableLayoutAnimationsOnAndroid();
  bool enableLayoutAnimationsOnIOS();
  bool enableLongTaskAPI();
  bool enableNativeCSSParsing();
  bool enableNewBackgroundAndBorderDrawables();
  bool enablePreciseSchedulingForPremountItemsOnAndroid();
  bool enablePropsUpdateReconciliationAndroid();
  bool enableReportEventPaintTime();
  bool enableSynchronousStateUpdates();
  bool enableUIConsistency();
  bool enableViewCulling();
  bool enableViewRecycling();
  bool enableViewRecyclingForText();
  bool enableViewRecyclingForView();
  bool excludeYogaFromRawProps();
  bool fixDifferentiatorEmittingUpdatesWithWrongParentTag();
  bool fixMappingOfEventPrioritiesBetweenFabricAndReact();
  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
  bool fuseboxEnabledRelease();
  bool fuseboxNetworkInspectionEnabled();
  bool lazyAnimationCallbacks();
  bool removeTurboModuleManagerDelegateMutex();
  bool throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS();
  bool traceTurboModulePromiseRejectionsOnAndroid();
  bool updateRuntimeShadowNodeReferencesOnCommit();
  bool useAlwaysAvailableJSErrorHandling();
  bool useEditTextStockAndroidFocusBehavior();
  bool useFabricInterop();
  bool useNativeViewConfigsInBridgelessMode();
  bool useOptimizedEventBatchingOnAndroid();
  bool useRawPropsJsiValue();
  bool useShadowNodeStateOnClone();
  bool useTurboModuleInterop();
  bool useTurboModules();

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);
  std::optional<std::string> getAccessedFeatureFlagNames() const;

 private:
  void markFlagAsAccessed(int position, const char* flagName);
  void ensureFlagsNotAccessed();

  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  bool wasOverridden_;

  std::array<std::atomic<const char*>, 45> accessedFeatureFlags_;

  std::atomic<std::optional<bool>> commonTestFlag_;
  std::atomic<std::optional<bool>> disableMountItemReorderingAndroid_;
  std::atomic<std::optional<bool>> enableAccumulatedUpdatesInRawPropsAndroid_;
  std::atomic<std::optional<bool>> enableBridgelessArchitecture_;
  std::atomic<std::optional<bool>> enableCppPropsIteratorSetter_;
  std::atomic<std::optional<bool>> enableEagerRootViewAttachment_;
  std::atomic<std::optional<bool>> enableFabricLogs_;
  std::atomic<std::optional<bool>> enableFabricRenderer_;
  std::atomic<std::optional<bool>> enableIOSViewClipToPaddingBox_;
  std::atomic<std::optional<bool>> enableImagePrefetchingAndroid_;
  std::atomic<std::optional<bool>> enableJSRuntimeGCOnMemoryPressureOnIOS_;
  std::atomic<std::optional<bool>> enableLayoutAnimationsOnAndroid_;
  std::atomic<std::optional<bool>> enableLayoutAnimationsOnIOS_;
  std::atomic<std::optional<bool>> enableLongTaskAPI_;
  std::atomic<std::optional<bool>> enableNativeCSSParsing_;
  std::atomic<std::optional<bool>> enableNewBackgroundAndBorderDrawables_;
  std::atomic<std::optional<bool>> enablePreciseSchedulingForPremountItemsOnAndroid_;
  std::atomic<std::optional<bool>> enablePropsUpdateReconciliationAndroid_;
  std::atomic<std::optional<bool>> enableReportEventPaintTime_;
  std::atomic<std::optional<bool>> enableSynchronousStateUpdates_;
  std::atomic<std::optional<bool>> enableUIConsistency_;
  std::atomic<std::optional<bool>> enableViewCulling_;
  std::atomic<std::optional<bool>> enableViewRecycling_;
  std::atomic<std::optional<bool>> enableViewRecyclingForText_;
  std::atomic<std::optional<bool>> enableViewRecyclingForView_;
  std::atomic<std::optional<bool>> excludeYogaFromRawProps_;
  std::atomic<std::optional<bool>> fixDifferentiatorEmittingUpdatesWithWrongParentTag_;
  std::atomic<std::optional<bool>> fixMappingOfEventPrioritiesBetweenFabricAndReact_;
  std::atomic<std::optional<bool>> fixMountingCoordinatorReportedPendingTransactionsOnAndroid_;
  std::atomic<std::optional<bool>> fuseboxEnabledRelease_;
  std::atomic<std::optional<bool>> fuseboxNetworkInspectionEnabled_;
  std::atomic<std::optional<bool>> lazyAnimationCallbacks_;
  std::atomic<std::optional<bool>> removeTurboModuleManagerDelegateMutex_;
  std::atomic<std::optional<bool>> throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS_;
  std::atomic<std::optional<bool>> traceTurboModulePromiseRejectionsOnAndroid_;
  std::atomic<std::optional<bool>> updateRuntimeShadowNodeReferencesOnCommit_;
  std::atomic<std::optional<bool>> useAlwaysAvailableJSErrorHandling_;
  std::atomic<std::optional<bool>> useEditTextStockAndroidFocusBehavior_;
  std::atomic<std::optional<bool>> useFabricInterop_;
  std::atomic<std::optional<bool>> useNativeViewConfigsInBridgelessMode_;
  std::atomic<std::optional<bool>> useOptimizedEventBatchingOnAndroid_;
  std::atomic<std::optional<bool>> useRawPropsJsiValue_;
  std::atomic<std::optional<bool>> useShadowNodeStateOnClone_;
  std::atomic<std::optional<bool>> useTurboModuleInterop_;
  std::atomic<std::optional<bool>> useTurboModules_;
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<775dea42ec82d31964c9614d86b3e107>>
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
  bool animatedShouldSignalBatch();
  bool cxxNativeAnimatedEnabled();
  bool disableMainQueueSyncDispatchIOS();
  bool disableMountItemReorderingAndroid();
  bool enableAccessibilityOrder();
  bool enableAccumulatedUpdatesInRawPropsAndroid();
  bool enableBridgelessArchitecture();
  bool enableCppPropsIteratorSetter();
  bool enableCustomFocusSearchOnClippedElementsAndroid();
  bool enableEagerRootViewAttachment();
  bool enableFabricLogs();
  bool enableFabricRenderer();
  bool enableFixForParentTagDuringReparenting();
  bool enableFontScaleChangesUpdatingLayout();
  bool enableIOSViewClipToPaddingBox();
  bool enableJSRuntimeGCOnMemoryPressureOnIOS();
  bool enableLayoutAnimationsOnAndroid();
  bool enableLayoutAnimationsOnIOS();
  bool enableMainQueueModulesOnIOS();
  bool enableNativeCSSParsing();
  bool enableNewBackgroundAndBorderDrawables();
  bool enablePropsUpdateReconciliationAndroid();
  bool enableSynchronousStateUpdates();
  bool enableViewCulling();
  bool enableViewRecycling();
  bool enableViewRecyclingForText();
  bool enableViewRecyclingForView();
  bool fixMappingOfEventPrioritiesBetweenFabricAndReact();
  bool fuseboxEnabledRelease();
  bool fuseboxNetworkInspectionEnabled();
  bool removeTurboModuleManagerDelegateMutex();
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

  std::array<std::atomic<const char*>, 43> accessedFeatureFlags_;

  std::atomic<std::optional<bool>> commonTestFlag_;
  std::atomic<std::optional<bool>> animatedShouldSignalBatch_;
  std::atomic<std::optional<bool>> cxxNativeAnimatedEnabled_;
  std::atomic<std::optional<bool>> disableMainQueueSyncDispatchIOS_;
  std::atomic<std::optional<bool>> disableMountItemReorderingAndroid_;
  std::atomic<std::optional<bool>> enableAccessibilityOrder_;
  std::atomic<std::optional<bool>> enableAccumulatedUpdatesInRawPropsAndroid_;
  std::atomic<std::optional<bool>> enableBridgelessArchitecture_;
  std::atomic<std::optional<bool>> enableCppPropsIteratorSetter_;
  std::atomic<std::optional<bool>> enableCustomFocusSearchOnClippedElementsAndroid_;
  std::atomic<std::optional<bool>> enableEagerRootViewAttachment_;
  std::atomic<std::optional<bool>> enableFabricLogs_;
  std::atomic<std::optional<bool>> enableFabricRenderer_;
  std::atomic<std::optional<bool>> enableFixForParentTagDuringReparenting_;
  std::atomic<std::optional<bool>> enableFontScaleChangesUpdatingLayout_;
  std::atomic<std::optional<bool>> enableIOSViewClipToPaddingBox_;
  std::atomic<std::optional<bool>> enableJSRuntimeGCOnMemoryPressureOnIOS_;
  std::atomic<std::optional<bool>> enableLayoutAnimationsOnAndroid_;
  std::atomic<std::optional<bool>> enableLayoutAnimationsOnIOS_;
  std::atomic<std::optional<bool>> enableMainQueueModulesOnIOS_;
  std::atomic<std::optional<bool>> enableNativeCSSParsing_;
  std::atomic<std::optional<bool>> enableNewBackgroundAndBorderDrawables_;
  std::atomic<std::optional<bool>> enablePropsUpdateReconciliationAndroid_;
  std::atomic<std::optional<bool>> enableSynchronousStateUpdates_;
  std::atomic<std::optional<bool>> enableViewCulling_;
  std::atomic<std::optional<bool>> enableViewRecycling_;
  std::atomic<std::optional<bool>> enableViewRecyclingForText_;
  std::atomic<std::optional<bool>> enableViewRecyclingForView_;
  std::atomic<std::optional<bool>> fixMappingOfEventPrioritiesBetweenFabricAndReact_;
  std::atomic<std::optional<bool>> fuseboxEnabledRelease_;
  std::atomic<std::optional<bool>> fuseboxNetworkInspectionEnabled_;
  std::atomic<std::optional<bool>> removeTurboModuleManagerDelegateMutex_;
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

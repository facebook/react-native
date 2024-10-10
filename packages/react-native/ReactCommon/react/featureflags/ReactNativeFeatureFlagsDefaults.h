/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<a88154d1c074b2fdab8704d2b209d204>>
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

namespace facebook::react {

class ReactNativeFeatureFlagsDefaults : public ReactNativeFeatureFlagsProvider {
 public:
  ReactNativeFeatureFlagsDefaults() = default;

  bool commonTestFlag() override {
    return false;
  }

  bool allowRecursiveCommitsWithSynchronousMountOnAndroid() override {
    return false;
  }

  bool batchRenderingUpdatesInEventLoop() override {
    return false;
  }

  bool completeReactInstanceCreationOnBgThreadOnAndroid() override {
    return false;
  }

  bool enableAlignItemsBaselineOnFabricIOS() override {
    return true;
  }

  bool enableAndroidLineHeightCentering() override {
    return false;
  }

  bool enableBridgelessArchitecture() override {
    return false;
  }

  bool enableCleanTextInputYogaNode() override {
    return false;
  }

  bool enableDeletionOfUnmountedViews() override {
    return false;
  }

  bool enableEagerRootViewAttachment() override {
    return false;
  }

  bool enableEventEmitterRetentionDuringGesturesOnAndroid() override {
    return false;
  }

  bool enableFabricLogs() override {
    return false;
  }

  bool enableFabricRenderer() override {
    return false;
  }

  bool enableFabricRendererExclusively() override {
    return false;
  }

  bool enableGranularShadowTreeStateReconciliation() override {
    return false;
  }

  bool enableIOSViewClipToPaddingBox() override {
    return false;
  }

  bool enableLayoutAnimationsOnAndroid() override {
    return false;
  }

  bool enableLayoutAnimationsOnIOS() override {
    return true;
  }

  bool enableLongTaskAPI() override {
    return false;
  }

  bool enableMicrotasks() override {
    return false;
  }

  bool enablePreciseSchedulingForPremountItemsOnAndroid() override {
    return false;
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    return false;
  }

  bool enableReportEventPaintTime() override {
    return false;
  }

  bool enableSynchronousStateUpdates() override {
    return false;
  }

  bool enableTextPreallocationOptimisation() override {
    return false;
  }

  bool enableUIConsistency() override {
    return false;
  }

  bool enableViewRecycling() override {
    return false;
  }

  bool excludeYogaFromRawProps() override {
    return false;
  }

  bool fetchImagesInViewPreallocation() override {
    return false;
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    return false;
  }

  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() override {
    return false;
  }

  bool forceBatchingMountItemsOnAndroid() override {
    return false;
  }

  bool fuseboxEnabledDebug() override {
    return true;
  }

  bool fuseboxEnabledRelease() override {
    return false;
  }

  bool initEagerTurboModulesOnNativeModulesQueueAndroid() override {
    return false;
  }

  bool lazyAnimationCallbacks() override {
    return false;
  }

  bool loadVectorDrawablesOnImages() override {
    return false;
  }

  bool removeNestedCallsToDispatchMountItemsOnAndroid() override {
    return false;
  }

  bool setAndroidLayoutDirection() override {
    return true;
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    return false;
  }

  bool useFabricInterop() override {
    return false;
  }

  bool useImmediateExecutorInAndroidBridgeless() override {
    return false;
  }

  bool useModernRuntimeScheduler() override {
    return false;
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    return false;
  }

  bool useOptimisedViewPreallocationOnAndroid() override {
    return false;
  }

  bool useOptimizedEventBatchingOnAndroid() override {
    return false;
  }

  bool useRuntimeShadowNodeReferenceUpdate() override {
    return false;
  }

  bool useTurboModuleInterop() override {
    return false;
  }

  bool useTurboModules() override {
    return false;
  }
};

} // namespace facebook::react

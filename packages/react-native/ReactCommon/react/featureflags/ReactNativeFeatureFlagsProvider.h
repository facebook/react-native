/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<4db2ff36701f0dbcd3dd59fa5879a612>>
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

namespace facebook::react {

class ReactNativeFeatureFlagsProvider {
 public:
  virtual ~ReactNativeFeatureFlagsProvider() = default;

  virtual bool commonTestFlag() = 0;
  virtual bool disableMountItemReorderingAndroid() = 0;
  virtual bool enableAccumulatedUpdatesInRawPropsAndroid() = 0;
  virtual bool enableBridgelessArchitecture() = 0;
  virtual bool enableCppPropsIteratorSetter() = 0;
  virtual bool enableEagerRootViewAttachment() = 0;
  virtual bool enableFabricLogs() = 0;
  virtual bool enableFabricRenderer() = 0;
  virtual bool enableIOSViewClipToPaddingBox() = 0;
  virtual bool enableImagePrefetchingAndroid() = 0;
  virtual bool enableJSRuntimeGCOnMemoryPressureOnIOS() = 0;
  virtual bool enableLayoutAnimationsOnAndroid() = 0;
  virtual bool enableLayoutAnimationsOnIOS() = 0;
  virtual bool enableLongTaskAPI() = 0;
  virtual bool enableNativeCSSParsing() = 0;
  virtual bool enableNewBackgroundAndBorderDrawables() = 0;
  virtual bool enablePreciseSchedulingForPremountItemsOnAndroid() = 0;
  virtual bool enablePropsUpdateReconciliationAndroid() = 0;
  virtual bool enableReportEventPaintTime() = 0;
  virtual bool enableSynchronousStateUpdates() = 0;
  virtual bool enableUIConsistency() = 0;
  virtual bool enableViewCulling() = 0;
  virtual bool enableViewRecycling() = 0;
  virtual bool enableViewRecyclingForText() = 0;
  virtual bool enableViewRecyclingForView() = 0;
  virtual bool excludeYogaFromRawProps() = 0;
  virtual bool fixDifferentiatorEmittingUpdatesWithWrongParentTag() = 0;
  virtual bool fixMappingOfEventPrioritiesBetweenFabricAndReact() = 0;
  virtual bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() = 0;
  virtual bool fuseboxEnabledRelease() = 0;
  virtual bool fuseboxNetworkInspectionEnabled() = 0;
  virtual bool lazyAnimationCallbacks() = 0;
  virtual bool removeTurboModuleManagerDelegateMutex() = 0;
  virtual bool throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS() = 0;
  virtual bool traceTurboModulePromiseRejectionsOnAndroid() = 0;
  virtual bool updateRuntimeShadowNodeReferencesOnCommit() = 0;
  virtual bool useAlwaysAvailableJSErrorHandling() = 0;
  virtual bool useFabricInterop() = 0;
  virtual bool useNativeViewConfigsInBridgelessMode() = 0;
  virtual bool useOptimizedEventBatchingOnAndroid() = 0;
  virtual bool useRawPropsJsiValue() = 0;
  virtual bool useShadowNodeStateOnClone() = 0;
  virtual bool useTurboModuleInterop() = 0;
  virtual bool useTurboModules() = 0;
};

} // namespace facebook::react

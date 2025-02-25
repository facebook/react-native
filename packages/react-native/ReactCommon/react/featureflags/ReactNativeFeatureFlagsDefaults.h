/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e80434127379886a001ffcbace6ba619>>
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

namespace facebook::react {

class ReactNativeFeatureFlagsDefaults : public ReactNativeFeatureFlagsProvider {
 public:
  ReactNativeFeatureFlagsDefaults() = default;

  bool commonTestFlag() override {
    return false;
  }

  bool disableMountItemReorderingAndroid() override {
    return false;
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    return false;
  }

  bool enableBridgelessArchitecture() override {
    return false;
  }

  bool enableCppPropsIteratorSetter() override {
    return false;
  }

  bool enableEagerRootViewAttachment() override {
    return false;
  }

  bool enableFabricLogs() override {
    return false;
  }

  bool enableFabricRenderer() override {
    return false;
  }

  bool enableIOSViewClipToPaddingBox() override {
    return false;
  }

  bool enableImagePrefetchingAndroid() override {
    return false;
  }

  bool enableJSRuntimeGCOnMemoryPressureOnIOS() override {
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

  bool enableNativeCSSParsing() override {
    return false;
  }

  bool enableNewBackgroundAndBorderDrawables() override {
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

  bool enableUIConsistency() override {
    return false;
  }

  bool enableViewCulling() override {
    return false;
  }

  bool enableViewRecycling() override {
    return false;
  }

  bool enableViewRecyclingForText() override {
    return true;
  }

  bool enableViewRecyclingForView() override {
    return true;
  }

  bool excludeYogaFromRawProps() override {
    return false;
  }

  bool fixDifferentiatorEmittingUpdatesWithWrongParentTag() override {
    return true;
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    return false;
  }

  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() override {
    return false;
  }

  bool fuseboxEnabledRelease() override {
    return false;
  }

  bool fuseboxNetworkInspectionEnabled() override {
    return false;
  }

  bool lazyAnimationCallbacks() override {
    return false;
  }

  bool removeTurboModuleManagerDelegateMutex() override {
    return false;
  }

  bool throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS() override {
    return false;
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    return false;
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    return false;
  }

  bool useEditTextStockAndroidFocusBehavior() override {
    return true;
  }

  bool useFabricInterop() override {
    return false;
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    return false;
  }

  bool useOptimizedEventBatchingOnAndroid() override {
    return false;
  }

  bool useRawPropsJsiValue() override {
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

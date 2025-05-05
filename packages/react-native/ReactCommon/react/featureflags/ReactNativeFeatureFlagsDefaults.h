/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ef056e269a4ed514c18ebaed89885661>>
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

  bool animatedShouldSignalBatch() override {
    return false;
  }

  bool cxxNativeAnimatedEnabled() override {
    return false;
  }

  bool disableMainQueueSyncDispatchIOS() override {
    return false;
  }

  bool disableMountItemReorderingAndroid() override {
    return false;
  }

  bool enableAccessibilityOrder() override {
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

  bool enableCustomFocusSearchOnClippedElementsAndroid() override {
    return true;
  }

  bool enableDestroyShadowTreeRevisionAsync() override {
    return false;
  }

  bool enableDoubleMeasurementFixAndroid() override {
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

  bool enableFixForParentTagDuringReparenting() override {
    return false;
  }

  bool enableFontScaleChangesUpdatingLayout() override {
    return false;
  }

  bool enableIOSViewClipToPaddingBox() override {
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

  bool enableMainQueueModulesOnIOS() override {
    return false;
  }

  bool enableNativeCSSParsing() override {
    return false;
  }

  bool enableNetworkEventReporting() override {
    return false;
  }

  bool enableNewBackgroundAndBorderDrawables() override {
    return true;
  }

  bool enablePreparedTextLayout() override {
    return false;
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    return false;
  }

  bool enableResourceTimingAPI() override {
    return false;
  }

  bool enableSynchronousStateUpdates() override {
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

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    return false;
  }

  bool fuseboxEnabledRelease() override {
    return false;
  }

  bool fuseboxNetworkInspectionEnabled() override {
    return false;
  }

  bool incorporateMaxLinesDuringAndroidLayout() override {
    return true;
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    return false;
  }

  bool updateRuntimeShadowNodeReferencesOnCommit() override {
    return false;
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    return false;
  }

  bool useFabricInterop() override {
    return true;
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

  bool useShadowNodeStateOnClone() override {
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

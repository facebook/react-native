/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<21aeeeaa1a402f91b616180114887a58>>
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

#include <folly/dynamic.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

namespace facebook::react {

/**
 * This class is a ReactNativeFeatureFlags provider that takes the values for
 * feature flags from a folly::dynamic object (e.g. from a JSON object), if
 * they are defined. For the flags not defined in the object, it falls back to
 * the default values defined in ReactNativeFeatureFlagsDefaults.
 *
 * The API is strict about typing. It ignores null values from the
 * folly::dynamic object, but if the key is defined, the value must have the
 * correct type or otherwise throws an exception.
 */
class ReactNativeFeatureFlagsDynamicProvider : public ReactNativeFeatureFlagsDefaults {
 private:
  folly::dynamic values_;

 public:
  ReactNativeFeatureFlagsDynamicProvider(folly::dynamic values): values_(std::move(values)) {
    if (!values_.isObject()) {
      throw std::invalid_argument("ReactNativeFeatureFlagsDynamicProvider: values must be an object");
    }
  }

  bool commonTestFlag() override {
    auto value = values_["commonTestFlag"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::commonTestFlag();
  }

  bool disableMountItemReorderingAndroid() override {
    auto value = values_["disableMountItemReorderingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableMountItemReorderingAndroid();
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    auto value = values_["enableAccumulatedUpdatesInRawPropsAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableAccumulatedUpdatesInRawPropsAndroid();
  }

  bool enableBridgelessArchitecture() override {
    auto value = values_["enableBridgelessArchitecture"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableBridgelessArchitecture();
  }

  bool enableCppPropsIteratorSetter() override {
    auto value = values_["enableCppPropsIteratorSetter"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableCppPropsIteratorSetter();
  }

  bool enableEagerRootViewAttachment() override {
    auto value = values_["enableEagerRootViewAttachment"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableEagerRootViewAttachment();
  }

  bool enableFabricLogs() override {
    auto value = values_["enableFabricLogs"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFabricLogs();
  }

  bool enableFabricRenderer() override {
    auto value = values_["enableFabricRenderer"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFabricRenderer();
  }

  bool enableIOSViewClipToPaddingBox() override {
    auto value = values_["enableIOSViewClipToPaddingBox"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIOSViewClipToPaddingBox();
  }

  bool enableImagePrefetchingAndroid() override {
    auto value = values_["enableImagePrefetchingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableImagePrefetchingAndroid();
  }

  bool enableJSRuntimeGCOnMemoryPressureOnIOS() override {
    auto value = values_["enableJSRuntimeGCOnMemoryPressureOnIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableJSRuntimeGCOnMemoryPressureOnIOS();
  }

  bool enableLayoutAnimationsOnAndroid() override {
    auto value = values_["enableLayoutAnimationsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableLayoutAnimationsOnAndroid();
  }

  bool enableLayoutAnimationsOnIOS() override {
    auto value = values_["enableLayoutAnimationsOnIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableLayoutAnimationsOnIOS();
  }

  bool enableLongTaskAPI() override {
    auto value = values_["enableLongTaskAPI"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableLongTaskAPI();
  }

  bool enableNativeCSSParsing() override {
    auto value = values_["enableNativeCSSParsing"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNativeCSSParsing();
  }

  bool enableNewBackgroundAndBorderDrawables() override {
    auto value = values_["enableNewBackgroundAndBorderDrawables"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNewBackgroundAndBorderDrawables();
  }

  bool enablePreciseSchedulingForPremountItemsOnAndroid() override {
    auto value = values_["enablePreciseSchedulingForPremountItemsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enablePreciseSchedulingForPremountItemsOnAndroid();
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    auto value = values_["enablePropsUpdateReconciliationAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enablePropsUpdateReconciliationAndroid();
  }

  bool enableReportEventPaintTime() override {
    auto value = values_["enableReportEventPaintTime"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableReportEventPaintTime();
  }

  bool enableSynchronousStateUpdates() override {
    auto value = values_["enableSynchronousStateUpdates"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableSynchronousStateUpdates();
  }

  bool enableUIConsistency() override {
    auto value = values_["enableUIConsistency"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableUIConsistency();
  }

  bool enableViewCulling() override {
    auto value = values_["enableViewCulling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewCulling();
  }

  bool enableViewRecycling() override {
    auto value = values_["enableViewRecycling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecycling();
  }

  bool enableViewRecyclingForText() override {
    auto value = values_["enableViewRecyclingForText"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecyclingForText();
  }

  bool enableViewRecyclingForView() override {
    auto value = values_["enableViewRecyclingForView"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecyclingForView();
  }

  bool excludeYogaFromRawProps() override {
    auto value = values_["excludeYogaFromRawProps"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::excludeYogaFromRawProps();
  }

  bool fixDifferentiatorEmittingUpdatesWithWrongParentTag() override {
    auto value = values_["fixDifferentiatorEmittingUpdatesWithWrongParentTag"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixDifferentiatorEmittingUpdatesWithWrongParentTag();
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    auto value = values_["fixMappingOfEventPrioritiesBetweenFabricAndReact"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixMappingOfEventPrioritiesBetweenFabricAndReact();
  }

  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() override {
    auto value = values_["fixMountingCoordinatorReportedPendingTransactionsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
  }

  bool fuseboxEnabledRelease() override {
    auto value = values_["fuseboxEnabledRelease"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxEnabledRelease();
  }

  bool fuseboxNetworkInspectionEnabled() override {
    auto value = values_["fuseboxNetworkInspectionEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxNetworkInspectionEnabled();
  }

  bool lazyAnimationCallbacks() override {
    auto value = values_["lazyAnimationCallbacks"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::lazyAnimationCallbacks();
  }

  bool removeTurboModuleManagerDelegateMutex() override {
    auto value = values_["removeTurboModuleManagerDelegateMutex"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::removeTurboModuleManagerDelegateMutex();
  }

  bool throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS() override {
    auto value = values_["throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS();
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    auto value = values_["traceTurboModulePromiseRejectionsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::traceTurboModulePromiseRejectionsOnAndroid();
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    auto value = values_["useAlwaysAvailableJSErrorHandling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useAlwaysAvailableJSErrorHandling();
  }

  bool useEditTextStockAndroidFocusBehavior() override {
    auto value = values_["useEditTextStockAndroidFocusBehavior"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useEditTextStockAndroidFocusBehavior();
  }

  bool useFabricInterop() override {
    auto value = values_["useFabricInterop"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useFabricInterop();
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    auto value = values_["useNativeViewConfigsInBridgelessMode"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useNativeViewConfigsInBridgelessMode();
  }

  bool useOptimizedEventBatchingOnAndroid() override {
    auto value = values_["useOptimizedEventBatchingOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useOptimizedEventBatchingOnAndroid();
  }

  bool useRawPropsJsiValue() override {
    auto value = values_["useRawPropsJsiValue"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useRawPropsJsiValue();
  }

  bool useTurboModuleInterop() override {
    auto value = values_["useTurboModuleInterop"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useTurboModuleInterop();
  }

  bool useTurboModules() override {
    auto value = values_["useTurboModules"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useTurboModules();
  }
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<72e5c7b050f76d427ca8ddada1283b98>>
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

  bool animatedShouldSignalBatch() override {
    auto value = values_["animatedShouldSignalBatch"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::animatedShouldSignalBatch();
  }

  bool cxxNativeAnimatedEnabled() override {
    auto value = values_["cxxNativeAnimatedEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::cxxNativeAnimatedEnabled();
  }

  bool cxxNativeAnimatedRemoveJsSync() override {
    auto value = values_["cxxNativeAnimatedRemoveJsSync"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::cxxNativeAnimatedRemoveJsSync();
  }

  bool disableMainQueueSyncDispatchIOS() override {
    auto value = values_["disableMainQueueSyncDispatchIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableMainQueueSyncDispatchIOS();
  }

  bool disableMountItemReorderingAndroid() override {
    auto value = values_["disableMountItemReorderingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableMountItemReorderingAndroid();
  }

  bool disableTextLayoutManagerCacheAndroid() override {
    auto value = values_["disableTextLayoutManagerCacheAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableTextLayoutManagerCacheAndroid();
  }

  bool enableAccessibilityOrder() override {
    auto value = values_["enableAccessibilityOrder"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableAccessibilityOrder();
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

  bool enableCustomFocusSearchOnClippedElementsAndroid() override {
    auto value = values_["enableCustomFocusSearchOnClippedElementsAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableCustomFocusSearchOnClippedElementsAndroid();
  }

  bool enableDestroyShadowTreeRevisionAsync() override {
    auto value = values_["enableDestroyShadowTreeRevisionAsync"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableDestroyShadowTreeRevisionAsync();
  }

  bool enableDoubleMeasurementFixAndroid() override {
    auto value = values_["enableDoubleMeasurementFixAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableDoubleMeasurementFixAndroid();
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

  bool enableFixForParentTagDuringReparenting() override {
    auto value = values_["enableFixForParentTagDuringReparenting"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFixForParentTagDuringReparenting();
  }

  bool enableFontScaleChangesUpdatingLayout() override {
    auto value = values_["enableFontScaleChangesUpdatingLayout"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFontScaleChangesUpdatingLayout();
  }

  bool enableIOSTextBaselineOffsetPerLine() override {
    auto value = values_["enableIOSTextBaselineOffsetPerLine"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIOSTextBaselineOffsetPerLine();
  }

  bool enableIOSViewClipToPaddingBox() override {
    auto value = values_["enableIOSViewClipToPaddingBox"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIOSViewClipToPaddingBox();
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

  bool enableMainQueueCoordinatorOnIOS() override {
    auto value = values_["enableMainQueueCoordinatorOnIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableMainQueueCoordinatorOnIOS();
  }

  bool enableMainQueueModulesOnIOS() override {
    auto value = values_["enableMainQueueModulesOnIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableMainQueueModulesOnIOS();
  }

  bool enableModuleArgumentNSNullConversionIOS() override {
    auto value = values_["enableModuleArgumentNSNullConversionIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableModuleArgumentNSNullConversionIOS();
  }

  bool enableNativeCSSParsing() override {
    auto value = values_["enableNativeCSSParsing"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNativeCSSParsing();
  }

  bool enableNetworkEventReporting() override {
    auto value = values_["enableNetworkEventReporting"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNetworkEventReporting();
  }

  bool enableNewBackgroundAndBorderDrawables() override {
    auto value = values_["enableNewBackgroundAndBorderDrawables"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNewBackgroundAndBorderDrawables();
  }

  bool enablePreparedTextLayout() override {
    auto value = values_["enablePreparedTextLayout"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enablePreparedTextLayout();
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    auto value = values_["enablePropsUpdateReconciliationAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enablePropsUpdateReconciliationAndroid();
  }

  bool enableResourceTimingAPI() override {
    auto value = values_["enableResourceTimingAPI"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableResourceTimingAPI();
  }

  bool enableSynchronousStateUpdates() override {
    auto value = values_["enableSynchronousStateUpdates"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableSynchronousStateUpdates();
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

  bool enableVirtualViewDebugFeatures() override {
    auto value = values_["enableVirtualViewDebugFeatures"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableVirtualViewDebugFeatures();
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    auto value = values_["fixMappingOfEventPrioritiesBetweenFabricAndReact"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixMappingOfEventPrioritiesBetweenFabricAndReact();
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

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    auto value = values_["traceTurboModulePromiseRejectionsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::traceTurboModulePromiseRejectionsOnAndroid();
  }

  bool updateRuntimeShadowNodeReferencesOnCommit() override {
    auto value = values_["updateRuntimeShadowNodeReferencesOnCommit"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::updateRuntimeShadowNodeReferencesOnCommit();
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    auto value = values_["useAlwaysAvailableJSErrorHandling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useAlwaysAvailableJSErrorHandling();
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

  bool useShadowNodeStateOnClone() override {
    auto value = values_["useShadowNodeStateOnClone"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useShadowNodeStateOnClone();
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

  double virtualViewPrerenderRatio() override {
    auto value = values_["virtualViewPrerenderRatio"];
    if (!value.isNull()) {
      return value.getDouble();
    }

    return ReactNativeFeatureFlagsDefaults::virtualViewPrerenderRatio();
  }
};

} // namespace facebook::react

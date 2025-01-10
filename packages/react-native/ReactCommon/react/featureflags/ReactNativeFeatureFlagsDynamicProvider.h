/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e5e8a3b63e42ed4b5cab143d46d20260>>
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

  bool completeReactInstanceCreationOnBgThreadOnAndroid() override {
    auto value = values_["completeReactInstanceCreationOnBgThreadOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::completeReactInstanceCreationOnBgThreadOnAndroid();
  }

  bool disableEventLoopOnBridgeless() override {
    auto value = values_["disableEventLoopOnBridgeless"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableEventLoopOnBridgeless();
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

  bool enableDeletionOfUnmountedViews() override {
    auto value = values_["enableDeletionOfUnmountedViews"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableDeletionOfUnmountedViews();
  }

  bool enableEagerRootViewAttachment() override {
    auto value = values_["enableEagerRootViewAttachment"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableEagerRootViewAttachment();
  }

  bool enableEventEmitterRetentionDuringGesturesOnAndroid() override {
    auto value = values_["enableEventEmitterRetentionDuringGesturesOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableEventEmitterRetentionDuringGesturesOnAndroid();
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

  bool enableFixForViewCommandRace() override {
    auto value = values_["enableFixForViewCommandRace"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFixForViewCommandRace();
  }

  bool enableGranularShadowTreeStateReconciliation() override {
    auto value = values_["enableGranularShadowTreeStateReconciliation"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableGranularShadowTreeStateReconciliation();
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

  bool enableViewRecycling() override {
    auto value = values_["enableViewRecycling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecycling();
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

  bool initEagerTurboModulesOnNativeModulesQueueAndroid() override {
    auto value = values_["initEagerTurboModulesOnNativeModulesQueueAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::initEagerTurboModulesOnNativeModulesQueueAndroid();
  }

  bool lazyAnimationCallbacks() override {
    auto value = values_["lazyAnimationCallbacks"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::lazyAnimationCallbacks();
  }

  bool loadVectorDrawablesOnImages() override {
    auto value = values_["loadVectorDrawablesOnImages"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::loadVectorDrawablesOnImages();
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

  bool useFabricInterop() override {
    auto value = values_["useFabricInterop"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useFabricInterop();
  }

  bool useImmediateExecutorInAndroidBridgeless() override {
    auto value = values_["useImmediateExecutorInAndroidBridgeless"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useImmediateExecutorInAndroidBridgeless();
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    auto value = values_["useNativeViewConfigsInBridgelessMode"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useNativeViewConfigsInBridgelessMode();
  }

  bool useOptimisedViewPreallocationOnAndroid() override {
    auto value = values_["useOptimisedViewPreallocationOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useOptimisedViewPreallocationOnAndroid();
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

  bool useRuntimeShadowNodeReferenceUpdate() override {
    auto value = values_["useRuntimeShadowNodeReferenceUpdate"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useRuntimeShadowNodeReferenceUpdate();
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

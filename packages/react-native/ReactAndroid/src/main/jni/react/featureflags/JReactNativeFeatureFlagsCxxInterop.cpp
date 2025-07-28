/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<cf7b6ff66c614ca2acc6667a80c5590d>>
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

#include "JReactNativeFeatureFlagsCxxInterop.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

static jni::alias_ref<jni::JClass> getReactNativeFeatureFlagsProviderJavaClass() {
  static const auto jClass = facebook::jni::findClassStatic(
      "com/facebook/react/internal/featureflags/ReactNativeFeatureFlagsProvider");
  return jClass;
}

/**
 * Implementation of ReactNativeFeatureFlagsProvider that wraps a
 * ReactNativeFeatureFlagsProvider Java object.
 */
class ReactNativeFeatureFlagsJavaProvider
    : public ReactNativeFeatureFlagsProvider {
 public:
  explicit ReactNativeFeatureFlagsJavaProvider(
      jni::alias_ref<jobject> javaProvider)
      : javaProvider_(make_global(javaProvider)){};

  bool commonTestFlag() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("commonTestFlag");
    return method(javaProvider_);
  }

  bool animatedShouldSignalBatch() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("animatedShouldSignalBatch");
    return method(javaProvider_);
  }

  bool cxxNativeAnimatedEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("cxxNativeAnimatedEnabled");
    return method(javaProvider_);
  }

  bool cxxNativeAnimatedRemoveJsSync() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("cxxNativeAnimatedRemoveJsSync");
    return method(javaProvider_);
  }

  bool disableMainQueueSyncDispatchIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableMainQueueSyncDispatchIOS");
    return method(javaProvider_);
  }

  bool disableMountItemReorderingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableMountItemReorderingAndroid");
    return method(javaProvider_);
  }

  bool disableTextLayoutManagerCacheAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableTextLayoutManagerCacheAndroid");
    return method(javaProvider_);
  }

  bool enableAccessibilityOrder() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAccessibilityOrder");
    return method(javaProvider_);
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAccumulatedUpdatesInRawPropsAndroid");
    return method(javaProvider_);
  }

  bool enableAndroidTextMeasurementOptimizations() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAndroidTextMeasurementOptimizations");
    return method(javaProvider_);
  }

  bool enableBridgelessArchitecture() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableBridgelessArchitecture");
    return method(javaProvider_);
  }

  bool enableCppPropsIteratorSetter() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableCppPropsIteratorSetter");
    return method(javaProvider_);
  }

  bool enableCustomFocusSearchOnClippedElementsAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableCustomFocusSearchOnClippedElementsAndroid");
    return method(javaProvider_);
  }

  bool enableDestroyShadowTreeRevisionAsync() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableDestroyShadowTreeRevisionAsync");
    return method(javaProvider_);
  }

  bool enableDoubleMeasurementFixAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableDoubleMeasurementFixAndroid");
    return method(javaProvider_);
  }

  bool enableEagerRootViewAttachment() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableEagerRootViewAttachment");
    return method(javaProvider_);
  }

  bool enableFabricLogs() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFabricLogs");
    return method(javaProvider_);
  }

  bool enableFabricRenderer() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFabricRenderer");
    return method(javaProvider_);
  }

  bool enableFixForParentTagDuringReparenting() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFixForParentTagDuringReparenting");
    return method(javaProvider_);
  }

  bool enableFontScaleChangesUpdatingLayout() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFontScaleChangesUpdatingLayout");
    return method(javaProvider_);
  }

  bool enableIOSTextBaselineOffsetPerLine() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableIOSTextBaselineOffsetPerLine");
    return method(javaProvider_);
  }

  bool enableIOSViewClipToPaddingBox() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableIOSViewClipToPaddingBox");
    return method(javaProvider_);
  }

  bool enableInteropViewManagerClassLookUpOptimizationIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableInteropViewManagerClassLookUpOptimizationIOS");
    return method(javaProvider_);
  }

  bool enableLayoutAnimationsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableLayoutAnimationsOnAndroid");
    return method(javaProvider_);
  }

  bool enableLayoutAnimationsOnIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableLayoutAnimationsOnIOS");
    return method(javaProvider_);
  }

  bool enableMainQueueCoordinatorOnIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableMainQueueCoordinatorOnIOS");
    return method(javaProvider_);
  }

  bool enableMainQueueModulesOnIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableMainQueueModulesOnIOS");
    return method(javaProvider_);
  }

  bool enableModuleArgumentNSNullConversionIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableModuleArgumentNSNullConversionIOS");
    return method(javaProvider_);
  }

  bool enableNativeCSSParsing() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableNativeCSSParsing");
    return method(javaProvider_);
  }

  bool enableNetworkEventReporting() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableNetworkEventReporting");
    return method(javaProvider_);
  }

  bool enableNewBackgroundAndBorderDrawables() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableNewBackgroundAndBorderDrawables");
    return method(javaProvider_);
  }

  bool enablePreparedTextLayout() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enablePreparedTextLayout");
    return method(javaProvider_);
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enablePropsUpdateReconciliationAndroid");
    return method(javaProvider_);
  }

  bool enableResourceTimingAPI() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableResourceTimingAPI");
    return method(javaProvider_);
  }

  bool enableSynchronousStateUpdates() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableSynchronousStateUpdates");
    return method(javaProvider_);
  }

  bool enableViewCulling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewCulling");
    return method(javaProvider_);
  }

  bool enableViewRecycling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecycling");
    return method(javaProvider_);
  }

  bool enableViewRecyclingForText() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecyclingForText");
    return method(javaProvider_);
  }

  bool enableViewRecyclingForView() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecyclingForView");
    return method(javaProvider_);
  }

  bool enableVirtualViewDebugFeatures() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableVirtualViewDebugFeatures");
    return method(javaProvider_);
  }

  bool enableVirtualViewRenderState() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableVirtualViewRenderState");
    return method(javaProvider_);
  }

  bool enableVirtualViewWindowFocusDetection() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableVirtualViewWindowFocusDetection");
    return method(javaProvider_);
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMappingOfEventPrioritiesBetweenFabricAndReact");
    return method(javaProvider_);
  }

  bool fuseboxEnabledRelease() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxEnabledRelease");
    return method(javaProvider_);
  }

  bool fuseboxNetworkInspectionEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxNetworkInspectionEnabled");
    return method(javaProvider_);
  }

  bool hideOffscreenVirtualViewsOnIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("hideOffscreenVirtualViewsOnIOS");
    return method(javaProvider_);
  }

  double preparedTextCacheSize() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jdouble()>("preparedTextCacheSize");
    return method(javaProvider_);
  }

  bool preventShadowTreeCommitExhaustion() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("preventShadowTreeCommitExhaustion");
    return method(javaProvider_);
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("traceTurboModulePromiseRejectionsOnAndroid");
    return method(javaProvider_);
  }

  bool updateRuntimeShadowNodeReferencesOnCommit() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("updateRuntimeShadowNodeReferencesOnCommit");
    return method(javaProvider_);
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useAlwaysAvailableJSErrorHandling");
    return method(javaProvider_);
  }

  bool useFabricInterop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useFabricInterop");
    return method(javaProvider_);
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useNativeViewConfigsInBridgelessMode");
    return method(javaProvider_);
  }

  bool useOptimizedEventBatchingOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useOptimizedEventBatchingOnAndroid");
    return method(javaProvider_);
  }

  bool useRawPropsJsiValue() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useRawPropsJsiValue");
    return method(javaProvider_);
  }

  bool useShadowNodeStateOnClone() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useShadowNodeStateOnClone");
    return method(javaProvider_);
  }

  bool useTurboModuleInterop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useTurboModuleInterop");
    return method(javaProvider_);
  }

  bool useTurboModules() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useTurboModules");
    return method(javaProvider_);
  }

  double virtualViewPrerenderRatio() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jdouble()>("virtualViewPrerenderRatio");
    return method(javaProvider_);
  }

 private:
  jni::global_ref<jobject> javaProvider_;
};

bool JReactNativeFeatureFlagsCxxInterop::commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool JReactNativeFeatureFlagsCxxInterop::animatedShouldSignalBatch(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::animatedShouldSignalBatch();
}

bool JReactNativeFeatureFlagsCxxInterop::cxxNativeAnimatedEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::cxxNativeAnimatedRemoveJsSync(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync();
}

bool JReactNativeFeatureFlagsCxxInterop::disableMainQueueSyncDispatchIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableMainQueueSyncDispatchIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::disableMountItemReorderingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::disableTextLayoutManagerCacheAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAccessibilityOrder(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAccessibilityOrder();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAccumulatedUpdatesInRawPropsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAndroidTextMeasurementOptimizations(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations();
}

bool JReactNativeFeatureFlagsCxxInterop::enableBridgelessArchitecture(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableBridgelessArchitecture();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCppPropsIteratorSetter(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCppPropsIteratorSetter();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCustomFocusSearchOnClippedElementsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableDestroyShadowTreeRevisionAsync(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync();
}

bool JReactNativeFeatureFlagsCxxInterop::enableDoubleMeasurementFixAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableEagerRootViewAttachment(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFabricLogs(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFabricRenderer(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricRenderer();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFixForParentTagDuringReparenting(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFixForParentTagDuringReparenting();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFontScaleChangesUpdatingLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIOSTextBaselineOffsetPerLine(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool JReactNativeFeatureFlagsCxxInterop::enableInteropViewManagerClassLookUpOptimizationIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableMainQueueCoordinatorOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableMainQueueCoordinatorOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableMainQueueModulesOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableMainQueueModulesOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableModuleArgumentNSNullConversionIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableNativeCSSParsing(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableNativeCSSParsing();
}

bool JReactNativeFeatureFlagsCxxInterop::enableNetworkEventReporting(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableNetworkEventReporting();
}

bool JReactNativeFeatureFlagsCxxInterop::enableNewBackgroundAndBorderDrawables(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables();
}

bool JReactNativeFeatureFlagsCxxInterop::enablePreparedTextLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enablePreparedTextLayout();
}

bool JReactNativeFeatureFlagsCxxInterop::enablePropsUpdateReconciliationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableResourceTimingAPI(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableResourceTimingAPI();
}

bool JReactNativeFeatureFlagsCxxInterop::enableSynchronousStateUpdates(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableSynchronousStateUpdates();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewCulling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewCulling();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecycling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForText(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForText();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForView(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForView();
}

bool JReactNativeFeatureFlagsCxxInterop::enableVirtualViewDebugFeatures(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableVirtualViewDebugFeatures();
}

bool JReactNativeFeatureFlagsCxxInterop::enableVirtualViewRenderState(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableVirtualViewRenderState();
}

bool JReactNativeFeatureFlagsCxxInterop::enableVirtualViewWindowFocusDetection(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableVirtualViewWindowFocusDetection();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledRelease();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxNetworkInspectionEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::hideOffscreenVirtualViewsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS();
}

double JReactNativeFeatureFlagsCxxInterop::preparedTextCacheSize(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::preparedTextCacheSize();
}

bool JReactNativeFeatureFlagsCxxInterop::preventShadowTreeCommitExhaustion(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion();
}

bool JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::updateRuntimeShadowNodeReferencesOnCommit(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit();
}

bool JReactNativeFeatureFlagsCxxInterop::useAlwaysAvailableJSErrorHandling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling();
}

bool JReactNativeFeatureFlagsCxxInterop::useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool JReactNativeFeatureFlagsCxxInterop::useOptimizedEventBatchingOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useRawPropsJsiValue(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useRawPropsJsiValue();
}

bool JReactNativeFeatureFlagsCxxInterop::useShadowNodeStateOnClone(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useShadowNodeStateOnClone();
}

bool JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

bool JReactNativeFeatureFlagsCxxInterop::useTurboModules(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTurboModules();
}

double JReactNativeFeatureFlagsCxxInterop::virtualViewPrerenderRatio(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::virtualViewPrerenderRatio();
}

void JReactNativeFeatureFlagsCxxInterop::override(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsJavaProvider>(provider));
}

void JReactNativeFeatureFlagsCxxInterop::dangerouslyReset(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  ReactNativeFeatureFlags::dangerouslyReset();
}

jni::local_ref<jstring> JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  auto accessedFlags = ReactNativeFeatureFlags::dangerouslyForceOverride(
             std::make_unique<ReactNativeFeatureFlagsJavaProvider>(provider));
  if (accessedFlags.has_value()) {
    return jni::make_jstring(accessedFlags.value());
  }
  return nullptr;
}

void JReactNativeFeatureFlagsCxxInterop::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "override", JReactNativeFeatureFlagsCxxInterop::override),
      makeNativeMethod("dangerouslyReset", JReactNativeFeatureFlagsCxxInterop::dangerouslyReset),
      makeNativeMethod(
          "dangerouslyForceOverride",
          JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride),
      makeNativeMethod(
        "commonTestFlag",
        JReactNativeFeatureFlagsCxxInterop::commonTestFlag),
      makeNativeMethod(
        "animatedShouldSignalBatch",
        JReactNativeFeatureFlagsCxxInterop::animatedShouldSignalBatch),
      makeNativeMethod(
        "cxxNativeAnimatedEnabled",
        JReactNativeFeatureFlagsCxxInterop::cxxNativeAnimatedEnabled),
      makeNativeMethod(
        "cxxNativeAnimatedRemoveJsSync",
        JReactNativeFeatureFlagsCxxInterop::cxxNativeAnimatedRemoveJsSync),
      makeNativeMethod(
        "disableMainQueueSyncDispatchIOS",
        JReactNativeFeatureFlagsCxxInterop::disableMainQueueSyncDispatchIOS),
      makeNativeMethod(
        "disableMountItemReorderingAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableMountItemReorderingAndroid),
      makeNativeMethod(
        "disableTextLayoutManagerCacheAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableTextLayoutManagerCacheAndroid),
      makeNativeMethod(
        "enableAccessibilityOrder",
        JReactNativeFeatureFlagsCxxInterop::enableAccessibilityOrder),
      makeNativeMethod(
        "enableAccumulatedUpdatesInRawPropsAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableAccumulatedUpdatesInRawPropsAndroid),
      makeNativeMethod(
        "enableAndroidTextMeasurementOptimizations",
        JReactNativeFeatureFlagsCxxInterop::enableAndroidTextMeasurementOptimizations),
      makeNativeMethod(
        "enableBridgelessArchitecture",
        JReactNativeFeatureFlagsCxxInterop::enableBridgelessArchitecture),
      makeNativeMethod(
        "enableCppPropsIteratorSetter",
        JReactNativeFeatureFlagsCxxInterop::enableCppPropsIteratorSetter),
      makeNativeMethod(
        "enableCustomFocusSearchOnClippedElementsAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableCustomFocusSearchOnClippedElementsAndroid),
      makeNativeMethod(
        "enableDestroyShadowTreeRevisionAsync",
        JReactNativeFeatureFlagsCxxInterop::enableDestroyShadowTreeRevisionAsync),
      makeNativeMethod(
        "enableDoubleMeasurementFixAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableDoubleMeasurementFixAndroid),
      makeNativeMethod(
        "enableEagerRootViewAttachment",
        JReactNativeFeatureFlagsCxxInterop::enableEagerRootViewAttachment),
      makeNativeMethod(
        "enableFabricLogs",
        JReactNativeFeatureFlagsCxxInterop::enableFabricLogs),
      makeNativeMethod(
        "enableFabricRenderer",
        JReactNativeFeatureFlagsCxxInterop::enableFabricRenderer),
      makeNativeMethod(
        "enableFixForParentTagDuringReparenting",
        JReactNativeFeatureFlagsCxxInterop::enableFixForParentTagDuringReparenting),
      makeNativeMethod(
        "enableFontScaleChangesUpdatingLayout",
        JReactNativeFeatureFlagsCxxInterop::enableFontScaleChangesUpdatingLayout),
      makeNativeMethod(
        "enableIOSTextBaselineOffsetPerLine",
        JReactNativeFeatureFlagsCxxInterop::enableIOSTextBaselineOffsetPerLine),
      makeNativeMethod(
        "enableIOSViewClipToPaddingBox",
        JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox),
      makeNativeMethod(
        "enableInteropViewManagerClassLookUpOptimizationIOS",
        JReactNativeFeatureFlagsCxxInterop::enableInteropViewManagerClassLookUpOptimizationIOS),
      makeNativeMethod(
        "enableLayoutAnimationsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnAndroid),
      makeNativeMethod(
        "enableLayoutAnimationsOnIOS",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS),
      makeNativeMethod(
        "enableMainQueueCoordinatorOnIOS",
        JReactNativeFeatureFlagsCxxInterop::enableMainQueueCoordinatorOnIOS),
      makeNativeMethod(
        "enableMainQueueModulesOnIOS",
        JReactNativeFeatureFlagsCxxInterop::enableMainQueueModulesOnIOS),
      makeNativeMethod(
        "enableModuleArgumentNSNullConversionIOS",
        JReactNativeFeatureFlagsCxxInterop::enableModuleArgumentNSNullConversionIOS),
      makeNativeMethod(
        "enableNativeCSSParsing",
        JReactNativeFeatureFlagsCxxInterop::enableNativeCSSParsing),
      makeNativeMethod(
        "enableNetworkEventReporting",
        JReactNativeFeatureFlagsCxxInterop::enableNetworkEventReporting),
      makeNativeMethod(
        "enableNewBackgroundAndBorderDrawables",
        JReactNativeFeatureFlagsCxxInterop::enableNewBackgroundAndBorderDrawables),
      makeNativeMethod(
        "enablePreparedTextLayout",
        JReactNativeFeatureFlagsCxxInterop::enablePreparedTextLayout),
      makeNativeMethod(
        "enablePropsUpdateReconciliationAndroid",
        JReactNativeFeatureFlagsCxxInterop::enablePropsUpdateReconciliationAndroid),
      makeNativeMethod(
        "enableResourceTimingAPI",
        JReactNativeFeatureFlagsCxxInterop::enableResourceTimingAPI),
      makeNativeMethod(
        "enableSynchronousStateUpdates",
        JReactNativeFeatureFlagsCxxInterop::enableSynchronousStateUpdates),
      makeNativeMethod(
        "enableViewCulling",
        JReactNativeFeatureFlagsCxxInterop::enableViewCulling),
      makeNativeMethod(
        "enableViewRecycling",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecycling),
      makeNativeMethod(
        "enableViewRecyclingForText",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForText),
      makeNativeMethod(
        "enableViewRecyclingForView",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForView),
      makeNativeMethod(
        "enableVirtualViewDebugFeatures",
        JReactNativeFeatureFlagsCxxInterop::enableVirtualViewDebugFeatures),
      makeNativeMethod(
        "enableVirtualViewRenderState",
        JReactNativeFeatureFlagsCxxInterop::enableVirtualViewRenderState),
      makeNativeMethod(
        "enableVirtualViewWindowFocusDetection",
        JReactNativeFeatureFlagsCxxInterop::enableVirtualViewWindowFocusDetection),
      makeNativeMethod(
        "fixMappingOfEventPrioritiesBetweenFabricAndReact",
        JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact),
      makeNativeMethod(
        "fuseboxEnabledRelease",
        JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledRelease),
      makeNativeMethod(
        "fuseboxNetworkInspectionEnabled",
        JReactNativeFeatureFlagsCxxInterop::fuseboxNetworkInspectionEnabled),
      makeNativeMethod(
        "hideOffscreenVirtualViewsOnIOS",
        JReactNativeFeatureFlagsCxxInterop::hideOffscreenVirtualViewsOnIOS),
      makeNativeMethod(
        "preparedTextCacheSize",
        JReactNativeFeatureFlagsCxxInterop::preparedTextCacheSize),
      makeNativeMethod(
        "preventShadowTreeCommitExhaustion",
        JReactNativeFeatureFlagsCxxInterop::preventShadowTreeCommitExhaustion),
      makeNativeMethod(
        "traceTurboModulePromiseRejectionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid),
      makeNativeMethod(
        "updateRuntimeShadowNodeReferencesOnCommit",
        JReactNativeFeatureFlagsCxxInterop::updateRuntimeShadowNodeReferencesOnCommit),
      makeNativeMethod(
        "useAlwaysAvailableJSErrorHandling",
        JReactNativeFeatureFlagsCxxInterop::useAlwaysAvailableJSErrorHandling),
      makeNativeMethod(
        "useFabricInterop",
        JReactNativeFeatureFlagsCxxInterop::useFabricInterop),
      makeNativeMethod(
        "useNativeViewConfigsInBridgelessMode",
        JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode),
      makeNativeMethod(
        "useOptimizedEventBatchingOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useOptimizedEventBatchingOnAndroid),
      makeNativeMethod(
        "useRawPropsJsiValue",
        JReactNativeFeatureFlagsCxxInterop::useRawPropsJsiValue),
      makeNativeMethod(
        "useShadowNodeStateOnClone",
        JReactNativeFeatureFlagsCxxInterop::useShadowNodeStateOnClone),
      makeNativeMethod(
        "useTurboModuleInterop",
        JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop),
      makeNativeMethod(
        "useTurboModules",
        JReactNativeFeatureFlagsCxxInterop::useTurboModules),
      makeNativeMethod(
        "virtualViewPrerenderRatio",
        JReactNativeFeatureFlagsCxxInterop::virtualViewPrerenderRatio),
  });
}

} // namespace facebook::react

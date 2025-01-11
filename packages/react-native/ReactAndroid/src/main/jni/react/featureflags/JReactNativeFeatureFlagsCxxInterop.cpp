/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<7c3853858da56eb5f471abccf9dcbf55>>
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
class ReactNativeFeatureFlagsProviderHolder
    : public ReactNativeFeatureFlagsProvider {
 public:
  explicit ReactNativeFeatureFlagsProviderHolder(
      jni::alias_ref<jobject> javaProvider)
      : javaProvider_(make_global(javaProvider)){};

  bool commonTestFlag() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("commonTestFlag");
    return method(javaProvider_);
  }

  bool completeReactInstanceCreationOnBgThreadOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("completeReactInstanceCreationOnBgThreadOnAndroid");
    return method(javaProvider_);
  }

  bool disableEventLoopOnBridgeless() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableEventLoopOnBridgeless");
    return method(javaProvider_);
  }

  bool disableMountItemReorderingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableMountItemReorderingAndroid");
    return method(javaProvider_);
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAccumulatedUpdatesInRawPropsAndroid");
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

  bool enableDeletionOfUnmountedViews() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableDeletionOfUnmountedViews");
    return method(javaProvider_);
  }

  bool enableEagerRootViewAttachment() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableEagerRootViewAttachment");
    return method(javaProvider_);
  }

  bool enableEventEmitterRetentionDuringGesturesOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableEventEmitterRetentionDuringGesturesOnAndroid");
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

  bool enableFixForViewCommandRace() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFixForViewCommandRace");
    return method(javaProvider_);
  }

  bool enableGranularShadowTreeStateReconciliation() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableGranularShadowTreeStateReconciliation");
    return method(javaProvider_);
  }

  bool enableIOSViewClipToPaddingBox() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableIOSViewClipToPaddingBox");
    return method(javaProvider_);
  }

  bool enableImagePrefetchingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableImagePrefetchingAndroid");
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

  bool enableLongTaskAPI() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableLongTaskAPI");
    return method(javaProvider_);
  }

  bool enableNewBackgroundAndBorderDrawables() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableNewBackgroundAndBorderDrawables");
    return method(javaProvider_);
  }

  bool enablePreciseSchedulingForPremountItemsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enablePreciseSchedulingForPremountItemsOnAndroid");
    return method(javaProvider_);
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enablePropsUpdateReconciliationAndroid");
    return method(javaProvider_);
  }

  bool enableReportEventPaintTime() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableReportEventPaintTime");
    return method(javaProvider_);
  }

  bool enableSynchronousStateUpdates() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableSynchronousStateUpdates");
    return method(javaProvider_);
  }

  bool enableUIConsistency() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableUIConsistency");
    return method(javaProvider_);
  }

  bool enableViewRecycling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecycling");
    return method(javaProvider_);
  }

  bool excludeYogaFromRawProps() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("excludeYogaFromRawProps");
    return method(javaProvider_);
  }

  bool fixDifferentiatorEmittingUpdatesWithWrongParentTag() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixDifferentiatorEmittingUpdatesWithWrongParentTag");
    return method(javaProvider_);
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMappingOfEventPrioritiesBetweenFabricAndReact");
    return method(javaProvider_);
  }

  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMountingCoordinatorReportedPendingTransactionsOnAndroid");
    return method(javaProvider_);
  }

  bool fuseboxEnabledRelease() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxEnabledRelease");
    return method(javaProvider_);
  }

  bool initEagerTurboModulesOnNativeModulesQueueAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("initEagerTurboModulesOnNativeModulesQueueAndroid");
    return method(javaProvider_);
  }

  bool lazyAnimationCallbacks() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("lazyAnimationCallbacks");
    return method(javaProvider_);
  }

  bool loadVectorDrawablesOnImages() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("loadVectorDrawablesOnImages");
    return method(javaProvider_);
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("traceTurboModulePromiseRejectionsOnAndroid");
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

  bool useImmediateExecutorInAndroidBridgeless() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useImmediateExecutorInAndroidBridgeless");
    return method(javaProvider_);
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useNativeViewConfigsInBridgelessMode");
    return method(javaProvider_);
  }

  bool useOptimisedViewPreallocationOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useOptimisedViewPreallocationOnAndroid");
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

  bool useRuntimeShadowNodeReferenceUpdate() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useRuntimeShadowNodeReferenceUpdate");
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

 private:
  jni::global_ref<jobject> javaProvider_;
};

bool JReactNativeFeatureFlagsCxxInterop::commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool JReactNativeFeatureFlagsCxxInterop::completeReactInstanceCreationOnBgThreadOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::disableEventLoopOnBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableEventLoopOnBridgeless();
}

bool JReactNativeFeatureFlagsCxxInterop::disableMountItemReorderingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAccumulatedUpdatesInRawPropsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableBridgelessArchitecture(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableBridgelessArchitecture();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCppPropsIteratorSetter(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCppPropsIteratorSetter();
}

bool JReactNativeFeatureFlagsCxxInterop::enableDeletionOfUnmountedViews(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableDeletionOfUnmountedViews();
}

bool JReactNativeFeatureFlagsCxxInterop::enableEagerRootViewAttachment(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool JReactNativeFeatureFlagsCxxInterop::enableEventEmitterRetentionDuringGesturesOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableEventEmitterRetentionDuringGesturesOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFabricLogs(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFabricRenderer(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricRenderer();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFixForViewCommandRace(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFixForViewCommandRace();
}

bool JReactNativeFeatureFlagsCxxInterop::enableGranularShadowTreeStateReconciliation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool JReactNativeFeatureFlagsCxxInterop::enableImagePrefetchingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableImagePrefetchingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLongTaskAPI(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLongTaskAPI();
}

bool JReactNativeFeatureFlagsCxxInterop::enableNewBackgroundAndBorderDrawables(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableNewBackgroundAndBorderDrawables();
}

bool JReactNativeFeatureFlagsCxxInterop::enablePreciseSchedulingForPremountItemsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enablePreciseSchedulingForPremountItemsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enablePropsUpdateReconciliationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableReportEventPaintTime(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableReportEventPaintTime();
}

bool JReactNativeFeatureFlagsCxxInterop::enableSynchronousStateUpdates(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableSynchronousStateUpdates();
}

bool JReactNativeFeatureFlagsCxxInterop::enableUIConsistency(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableUIConsistency();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecycling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool JReactNativeFeatureFlagsCxxInterop::excludeYogaFromRawProps(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::excludeYogaFromRawProps();
}

bool JReactNativeFeatureFlagsCxxInterop::fixDifferentiatorEmittingUpdatesWithWrongParentTag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixDifferentiatorEmittingUpdatesWithWrongParentTag();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMountingCoordinatorReportedPendingTransactionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledRelease();
}

bool JReactNativeFeatureFlagsCxxInterop::initEagerTurboModulesOnNativeModulesQueueAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::initEagerTurboModulesOnNativeModulesQueueAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::lazyAnimationCallbacks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::lazyAnimationCallbacks();
}

bool JReactNativeFeatureFlagsCxxInterop::loadVectorDrawablesOnImages(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::loadVectorDrawablesOnImages();
}

bool JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useAlwaysAvailableJSErrorHandling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling();
}

bool JReactNativeFeatureFlagsCxxInterop::useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool JReactNativeFeatureFlagsCxxInterop::useImmediateExecutorInAndroidBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless();
}

bool JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool JReactNativeFeatureFlagsCxxInterop::useOptimisedViewPreallocationOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useOptimizedEventBatchingOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useRawPropsJsiValue(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useRawPropsJsiValue();
}

bool JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdate(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate();
}

bool JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

bool JReactNativeFeatureFlagsCxxInterop::useTurboModules(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTurboModules();
}

void JReactNativeFeatureFlagsCxxInterop::override(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsProviderHolder>(provider));
}

void JReactNativeFeatureFlagsCxxInterop::dangerouslyReset(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  ReactNativeFeatureFlags::dangerouslyReset();
}

jni::local_ref<jstring> JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  auto accessedFlags = ReactNativeFeatureFlags::dangerouslyForceOverride(
             std::make_unique<ReactNativeFeatureFlagsProviderHolder>(provider));
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
        "completeReactInstanceCreationOnBgThreadOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::completeReactInstanceCreationOnBgThreadOnAndroid),
      makeNativeMethod(
        "disableEventLoopOnBridgeless",
        JReactNativeFeatureFlagsCxxInterop::disableEventLoopOnBridgeless),
      makeNativeMethod(
        "disableMountItemReorderingAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableMountItemReorderingAndroid),
      makeNativeMethod(
        "enableAccumulatedUpdatesInRawPropsAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableAccumulatedUpdatesInRawPropsAndroid),
      makeNativeMethod(
        "enableBridgelessArchitecture",
        JReactNativeFeatureFlagsCxxInterop::enableBridgelessArchitecture),
      makeNativeMethod(
        "enableCppPropsIteratorSetter",
        JReactNativeFeatureFlagsCxxInterop::enableCppPropsIteratorSetter),
      makeNativeMethod(
        "enableDeletionOfUnmountedViews",
        JReactNativeFeatureFlagsCxxInterop::enableDeletionOfUnmountedViews),
      makeNativeMethod(
        "enableEagerRootViewAttachment",
        JReactNativeFeatureFlagsCxxInterop::enableEagerRootViewAttachment),
      makeNativeMethod(
        "enableEventEmitterRetentionDuringGesturesOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableEventEmitterRetentionDuringGesturesOnAndroid),
      makeNativeMethod(
        "enableFabricLogs",
        JReactNativeFeatureFlagsCxxInterop::enableFabricLogs),
      makeNativeMethod(
        "enableFabricRenderer",
        JReactNativeFeatureFlagsCxxInterop::enableFabricRenderer),
      makeNativeMethod(
        "enableFixForViewCommandRace",
        JReactNativeFeatureFlagsCxxInterop::enableFixForViewCommandRace),
      makeNativeMethod(
        "enableGranularShadowTreeStateReconciliation",
        JReactNativeFeatureFlagsCxxInterop::enableGranularShadowTreeStateReconciliation),
      makeNativeMethod(
        "enableIOSViewClipToPaddingBox",
        JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox),
      makeNativeMethod(
        "enableImagePrefetchingAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableImagePrefetchingAndroid),
      makeNativeMethod(
        "enableLayoutAnimationsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnAndroid),
      makeNativeMethod(
        "enableLayoutAnimationsOnIOS",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS),
      makeNativeMethod(
        "enableLongTaskAPI",
        JReactNativeFeatureFlagsCxxInterop::enableLongTaskAPI),
      makeNativeMethod(
        "enableNewBackgroundAndBorderDrawables",
        JReactNativeFeatureFlagsCxxInterop::enableNewBackgroundAndBorderDrawables),
      makeNativeMethod(
        "enablePreciseSchedulingForPremountItemsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::enablePreciseSchedulingForPremountItemsOnAndroid),
      makeNativeMethod(
        "enablePropsUpdateReconciliationAndroid",
        JReactNativeFeatureFlagsCxxInterop::enablePropsUpdateReconciliationAndroid),
      makeNativeMethod(
        "enableReportEventPaintTime",
        JReactNativeFeatureFlagsCxxInterop::enableReportEventPaintTime),
      makeNativeMethod(
        "enableSynchronousStateUpdates",
        JReactNativeFeatureFlagsCxxInterop::enableSynchronousStateUpdates),
      makeNativeMethod(
        "enableUIConsistency",
        JReactNativeFeatureFlagsCxxInterop::enableUIConsistency),
      makeNativeMethod(
        "enableViewRecycling",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecycling),
      makeNativeMethod(
        "excludeYogaFromRawProps",
        JReactNativeFeatureFlagsCxxInterop::excludeYogaFromRawProps),
      makeNativeMethod(
        "fixDifferentiatorEmittingUpdatesWithWrongParentTag",
        JReactNativeFeatureFlagsCxxInterop::fixDifferentiatorEmittingUpdatesWithWrongParentTag),
      makeNativeMethod(
        "fixMappingOfEventPrioritiesBetweenFabricAndReact",
        JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact),
      makeNativeMethod(
        "fixMountingCoordinatorReportedPendingTransactionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::fixMountingCoordinatorReportedPendingTransactionsOnAndroid),
      makeNativeMethod(
        "fuseboxEnabledRelease",
        JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledRelease),
      makeNativeMethod(
        "initEagerTurboModulesOnNativeModulesQueueAndroid",
        JReactNativeFeatureFlagsCxxInterop::initEagerTurboModulesOnNativeModulesQueueAndroid),
      makeNativeMethod(
        "lazyAnimationCallbacks",
        JReactNativeFeatureFlagsCxxInterop::lazyAnimationCallbacks),
      makeNativeMethod(
        "loadVectorDrawablesOnImages",
        JReactNativeFeatureFlagsCxxInterop::loadVectorDrawablesOnImages),
      makeNativeMethod(
        "traceTurboModulePromiseRejectionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid),
      makeNativeMethod(
        "useAlwaysAvailableJSErrorHandling",
        JReactNativeFeatureFlagsCxxInterop::useAlwaysAvailableJSErrorHandling),
      makeNativeMethod(
        "useFabricInterop",
        JReactNativeFeatureFlagsCxxInterop::useFabricInterop),
      makeNativeMethod(
        "useImmediateExecutorInAndroidBridgeless",
        JReactNativeFeatureFlagsCxxInterop::useImmediateExecutorInAndroidBridgeless),
      makeNativeMethod(
        "useNativeViewConfigsInBridgelessMode",
        JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode),
      makeNativeMethod(
        "useOptimisedViewPreallocationOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useOptimisedViewPreallocationOnAndroid),
      makeNativeMethod(
        "useOptimizedEventBatchingOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useOptimizedEventBatchingOnAndroid),
      makeNativeMethod(
        "useRawPropsJsiValue",
        JReactNativeFeatureFlagsCxxInterop::useRawPropsJsiValue),
      makeNativeMethod(
        "useRuntimeShadowNodeReferenceUpdate",
        JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdate),
      makeNativeMethod(
        "useTurboModuleInterop",
        JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop),
      makeNativeMethod(
        "useTurboModules",
        JReactNativeFeatureFlagsCxxInterop::useTurboModules),
  });
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<68e5d4ce0ed3c237eeababaa04821101>>
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

  bool batchRenderingUpdatesInEventLoop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("batchRenderingUpdatesInEventLoop");
    return method(javaProvider_);
  }

  bool completeReactInstanceCreationOnBgThreadOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("completeReactInstanceCreationOnBgThreadOnAndroid");
    return method(javaProvider_);
  }

  bool destroyFabricSurfacesInReactInstanceManager() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("destroyFabricSurfacesInReactInstanceManager");
    return method(javaProvider_);
  }

  bool enableAlignItemsBaselineOnFabricIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAlignItemsBaselineOnFabricIOS");
    return method(javaProvider_);
  }

  bool enableAndroidMixBlendModeProp() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAndroidMixBlendModeProp");
    return method(javaProvider_);
  }

  bool enableBackgroundStyleApplicator() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableBackgroundStyleApplicator");
    return method(javaProvider_);
  }

  bool enableCleanTextInputYogaNode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableCleanTextInputYogaNode");
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

  bool enableFabricRendererExclusively() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFabricRendererExclusively");
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

  bool enableMicrotasks() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableMicrotasks");
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

  bool fetchImagesInViewPreallocation() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fetchImagesInViewPreallocation");
    return method(javaProvider_);
  }

  bool fixIncorrectScrollViewStateUpdateOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixIncorrectScrollViewStateUpdateOnAndroid");
    return method(javaProvider_);
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMappingOfEventPrioritiesBetweenFabricAndReact");
    return method(javaProvider_);
  }

  bool fixMissedFabricStateUpdatesOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMissedFabricStateUpdatesOnAndroid");
    return method(javaProvider_);
  }

  bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMountingCoordinatorReportedPendingTransactionsOnAndroid");
    return method(javaProvider_);
  }

  bool forceBatchingMountItemsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("forceBatchingMountItemsOnAndroid");
    return method(javaProvider_);
  }

  bool fuseboxEnabledDebug() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxEnabledDebug");
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

  bool setAndroidLayoutDirection() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("setAndroidLayoutDirection");
    return method(javaProvider_);
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("traceTurboModulePromiseRejectionsOnAndroid");
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

  bool useModernRuntimeScheduler() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useModernRuntimeScheduler");
    return method(javaProvider_);
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useNativeViewConfigsInBridgelessMode");
    return method(javaProvider_);
  }

  bool useNewReactImageViewBackgroundDrawing() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useNewReactImageViewBackgroundDrawing");
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

  bool useRuntimeShadowNodeReferenceUpdate() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useRuntimeShadowNodeReferenceUpdate");
    return method(javaProvider_);
  }

  bool useRuntimeShadowNodeReferenceUpdateOnLayout() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useRuntimeShadowNodeReferenceUpdateOnLayout");
    return method(javaProvider_);
  }

  bool useStateAlignmentMechanism() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useStateAlignmentMechanism");
    return method(javaProvider_);
  }

  bool useTurboModuleInterop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useTurboModuleInterop");
    return method(javaProvider_);
  }

 private:
  jni::global_ref<jobject> javaProvider_;
};

bool JReactNativeFeatureFlagsCxxInterop::commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool JReactNativeFeatureFlagsCxxInterop::batchRenderingUpdatesInEventLoop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop();
}

bool JReactNativeFeatureFlagsCxxInterop::completeReactInstanceCreationOnBgThreadOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::completeReactInstanceCreationOnBgThreadOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::destroyFabricSurfacesInReactInstanceManager(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAlignItemsBaselineOnFabricIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAndroidMixBlendModeProp(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAndroidMixBlendModeProp();
}

bool JReactNativeFeatureFlagsCxxInterop::enableBackgroundStyleApplicator(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableBackgroundStyleApplicator();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCleanTextInputYogaNode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCleanTextInputYogaNode();
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

bool JReactNativeFeatureFlagsCxxInterop::enableFabricRendererExclusively(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricRendererExclusively();
}

bool JReactNativeFeatureFlagsCxxInterop::enableGranularShadowTreeStateReconciliation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLongTaskAPI(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLongTaskAPI();
}

bool JReactNativeFeatureFlagsCxxInterop::enableMicrotasks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableMicrotasks();
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

bool JReactNativeFeatureFlagsCxxInterop::fetchImagesInViewPreallocation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fetchImagesInViewPreallocation();
}

bool JReactNativeFeatureFlagsCxxInterop::fixIncorrectScrollViewStateUpdateOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixIncorrectScrollViewStateUpdateOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMissedFabricStateUpdatesOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMissedFabricStateUpdatesOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMountingCoordinatorReportedPendingTransactionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMountingCoordinatorReportedPendingTransactionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::forceBatchingMountItemsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledDebug(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledDebug();
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

bool JReactNativeFeatureFlagsCxxInterop::setAndroidLayoutDirection(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::setAndroidLayoutDirection();
}

bool JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool JReactNativeFeatureFlagsCxxInterop::useImmediateExecutorInAndroidBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless();
}

bool JReactNativeFeatureFlagsCxxInterop::useModernRuntimeScheduler(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useModernRuntimeScheduler();
}

bool JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool JReactNativeFeatureFlagsCxxInterop::useNewReactImageViewBackgroundDrawing(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useNewReactImageViewBackgroundDrawing();
}

bool JReactNativeFeatureFlagsCxxInterop::useOptimisedViewPreallocationOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useOptimisedViewPreallocationOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useOptimizedEventBatchingOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useOptimizedEventBatchingOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdate(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate();
}

bool JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdateOnLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdateOnLayout();
}

bool JReactNativeFeatureFlagsCxxInterop::useStateAlignmentMechanism(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useStateAlignmentMechanism();
}

bool JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
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

void JReactNativeFeatureFlagsCxxInterop::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "override", JReactNativeFeatureFlagsCxxInterop::override),
      makeNativeMethod("dangerouslyReset", JReactNativeFeatureFlagsCxxInterop::dangerouslyReset),
      makeNativeMethod(
        "commonTestFlag",
        JReactNativeFeatureFlagsCxxInterop::commonTestFlag),
      makeNativeMethod(
        "batchRenderingUpdatesInEventLoop",
        JReactNativeFeatureFlagsCxxInterop::batchRenderingUpdatesInEventLoop),
      makeNativeMethod(
        "completeReactInstanceCreationOnBgThreadOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::completeReactInstanceCreationOnBgThreadOnAndroid),
      makeNativeMethod(
        "destroyFabricSurfacesInReactInstanceManager",
        JReactNativeFeatureFlagsCxxInterop::destroyFabricSurfacesInReactInstanceManager),
      makeNativeMethod(
        "enableAlignItemsBaselineOnFabricIOS",
        JReactNativeFeatureFlagsCxxInterop::enableAlignItemsBaselineOnFabricIOS),
      makeNativeMethod(
        "enableAndroidMixBlendModeProp",
        JReactNativeFeatureFlagsCxxInterop::enableAndroidMixBlendModeProp),
      makeNativeMethod(
        "enableBackgroundStyleApplicator",
        JReactNativeFeatureFlagsCxxInterop::enableBackgroundStyleApplicator),
      makeNativeMethod(
        "enableCleanTextInputYogaNode",
        JReactNativeFeatureFlagsCxxInterop::enableCleanTextInputYogaNode),
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
        "enableFabricRendererExclusively",
        JReactNativeFeatureFlagsCxxInterop::enableFabricRendererExclusively),
      makeNativeMethod(
        "enableGranularShadowTreeStateReconciliation",
        JReactNativeFeatureFlagsCxxInterop::enableGranularShadowTreeStateReconciliation),
      makeNativeMethod(
        "enableIOSViewClipToPaddingBox",
        JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox),
      makeNativeMethod(
        "enableLayoutAnimationsOnIOS",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS),
      makeNativeMethod(
        "enableLongTaskAPI",
        JReactNativeFeatureFlagsCxxInterop::enableLongTaskAPI),
      makeNativeMethod(
        "enableMicrotasks",
        JReactNativeFeatureFlagsCxxInterop::enableMicrotasks),
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
        "fetchImagesInViewPreallocation",
        JReactNativeFeatureFlagsCxxInterop::fetchImagesInViewPreallocation),
      makeNativeMethod(
        "fixIncorrectScrollViewStateUpdateOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::fixIncorrectScrollViewStateUpdateOnAndroid),
      makeNativeMethod(
        "fixMappingOfEventPrioritiesBetweenFabricAndReact",
        JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact),
      makeNativeMethod(
        "fixMissedFabricStateUpdatesOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::fixMissedFabricStateUpdatesOnAndroid),
      makeNativeMethod(
        "fixMountingCoordinatorReportedPendingTransactionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::fixMountingCoordinatorReportedPendingTransactionsOnAndroid),
      makeNativeMethod(
        "forceBatchingMountItemsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::forceBatchingMountItemsOnAndroid),
      makeNativeMethod(
        "fuseboxEnabledDebug",
        JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledDebug),
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
        "setAndroidLayoutDirection",
        JReactNativeFeatureFlagsCxxInterop::setAndroidLayoutDirection),
      makeNativeMethod(
        "traceTurboModulePromiseRejectionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid),
      makeNativeMethod(
        "useFabricInterop",
        JReactNativeFeatureFlagsCxxInterop::useFabricInterop),
      makeNativeMethod(
        "useImmediateExecutorInAndroidBridgeless",
        JReactNativeFeatureFlagsCxxInterop::useImmediateExecutorInAndroidBridgeless),
      makeNativeMethod(
        "useModernRuntimeScheduler",
        JReactNativeFeatureFlagsCxxInterop::useModernRuntimeScheduler),
      makeNativeMethod(
        "useNativeViewConfigsInBridgelessMode",
        JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode),
      makeNativeMethod(
        "useNewReactImageViewBackgroundDrawing",
        JReactNativeFeatureFlagsCxxInterop::useNewReactImageViewBackgroundDrawing),
      makeNativeMethod(
        "useOptimisedViewPreallocationOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useOptimisedViewPreallocationOnAndroid),
      makeNativeMethod(
        "useOptimizedEventBatchingOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useOptimizedEventBatchingOnAndroid),
      makeNativeMethod(
        "useRuntimeShadowNodeReferenceUpdate",
        JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdate),
      makeNativeMethod(
        "useRuntimeShadowNodeReferenceUpdateOnLayout",
        JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdateOnLayout),
      makeNativeMethod(
        "useStateAlignmentMechanism",
        JReactNativeFeatureFlagsCxxInterop::useStateAlignmentMechanism),
      makeNativeMethod(
        "useTurboModuleInterop",
        JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop),
  });
}

} // namespace facebook::react

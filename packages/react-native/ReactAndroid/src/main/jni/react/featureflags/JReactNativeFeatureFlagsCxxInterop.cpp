/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<8efce8efb9cc312512b8736ed0073b30>>
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

  bool allowCollapsableChildren() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("allowCollapsableChildren");
    return method(javaProvider_);
  }

  bool allowRecursiveCommitsWithSynchronousMountOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("allowRecursiveCommitsWithSynchronousMountOnAndroid");
    return method(javaProvider_);
  }

  bool batchRenderingUpdatesInEventLoop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("batchRenderingUpdatesInEventLoop");
    return method(javaProvider_);
  }

  bool changeOrderOfMountingInstructionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("changeOrderOfMountingInstructionsOnAndroid");
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

  bool enableCleanTextInputYogaNode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableCleanTextInputYogaNode");
    return method(javaProvider_);
  }

  bool enableGranularShadowTreeStateReconciliation() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableGranularShadowTreeStateReconciliation");
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

 private:
  jni::global_ref<jobject> javaProvider_;
};

bool JReactNativeFeatureFlagsCxxInterop::commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool JReactNativeFeatureFlagsCxxInterop::allowCollapsableChildren(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::allowCollapsableChildren();
}

bool JReactNativeFeatureFlagsCxxInterop::allowRecursiveCommitsWithSynchronousMountOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::allowRecursiveCommitsWithSynchronousMountOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::batchRenderingUpdatesInEventLoop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop();
}

bool JReactNativeFeatureFlagsCxxInterop::changeOrderOfMountingInstructionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::changeOrderOfMountingInstructionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::destroyFabricSurfacesInReactInstanceManager(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAlignItemsBaselineOnFabricIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCleanTextInputYogaNode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCleanTextInputYogaNode();
}

bool JReactNativeFeatureFlagsCxxInterop::enableGranularShadowTreeStateReconciliation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation();
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

bool JReactNativeFeatureFlagsCxxInterop::enableSynchronousStateUpdates(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableSynchronousStateUpdates();
}

bool JReactNativeFeatureFlagsCxxInterop::enableUIConsistency(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableUIConsistency();
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
        "allowCollapsableChildren",
        JReactNativeFeatureFlagsCxxInterop::allowCollapsableChildren),
      makeNativeMethod(
        "allowRecursiveCommitsWithSynchronousMountOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::allowRecursiveCommitsWithSynchronousMountOnAndroid),
      makeNativeMethod(
        "batchRenderingUpdatesInEventLoop",
        JReactNativeFeatureFlagsCxxInterop::batchRenderingUpdatesInEventLoop),
      makeNativeMethod(
        "changeOrderOfMountingInstructionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::changeOrderOfMountingInstructionsOnAndroid),
      makeNativeMethod(
        "destroyFabricSurfacesInReactInstanceManager",
        JReactNativeFeatureFlagsCxxInterop::destroyFabricSurfacesInReactInstanceManager),
      makeNativeMethod(
        "enableAlignItemsBaselineOnFabricIOS",
        JReactNativeFeatureFlagsCxxInterop::enableAlignItemsBaselineOnFabricIOS),
      makeNativeMethod(
        "enableCleanTextInputYogaNode",
        JReactNativeFeatureFlagsCxxInterop::enableCleanTextInputYogaNode),
      makeNativeMethod(
        "enableGranularShadowTreeStateReconciliation",
        JReactNativeFeatureFlagsCxxInterop::enableGranularShadowTreeStateReconciliation),
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
        "enableSynchronousStateUpdates",
        JReactNativeFeatureFlagsCxxInterop::enableSynchronousStateUpdates),
      makeNativeMethod(
        "enableUIConsistency",
        JReactNativeFeatureFlagsCxxInterop::enableUIConsistency),
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
        "useRuntimeShadowNodeReferenceUpdate",
        JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdate),
      makeNativeMethod(
        "useRuntimeShadowNodeReferenceUpdateOnLayout",
        JReactNativeFeatureFlagsCxxInterop::useRuntimeShadowNodeReferenceUpdateOnLayout),
      makeNativeMethod(
        "useStateAlignmentMechanism",
        JReactNativeFeatureFlagsCxxInterop::useStateAlignmentMechanism),
  });
}

} // namespace facebook::react

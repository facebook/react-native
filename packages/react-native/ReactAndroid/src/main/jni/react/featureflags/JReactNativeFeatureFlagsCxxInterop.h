/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<1d1422d073ae40ee4bbc788dc222cc28>>
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

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>

namespace facebook::react {

class JReactNativeFeatureFlagsCxxInterop
    : public jni::JavaClass<JReactNativeFeatureFlagsCxxInterop> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/internal/featureflags/ReactNativeFeatureFlagsCxxInterop;";

  static bool commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool allowCollapsableChildren(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool allowRecursiveCommitsWithSynchronousMountOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool batchRenderingUpdatesInEventLoop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool destroyFabricSurfacesInReactInstanceManager(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableBackgroundExecutor(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableCleanTextInputYogaNode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableGranularShadowTreeStateReconciliation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableMicrotasks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableSynchronousStateUpdates(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableUIConsistency(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool forceBatchingMountItemsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxEnabledDebug(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool lazyAnimationCallbacks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool preventDoubleTextMeasure(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool setAndroidLayoutDirection(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useImmediateExecutorInAndroidBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useModernRuntimeScheduler(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRuntimeShadowNodeReferenceUpdate(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRuntimeShadowNodeReferenceUpdateOnLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useStateAlignmentMechanism(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void override(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>,
      jni::alias_ref<jobject> provider);

  static void dangerouslyReset(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void registerNatives();
};

} // namespace facebook::react

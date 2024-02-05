/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e570b62b4a208b2526169361c3a6be6a>>
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
#include <react/featureflags/ReactNativeFeatureFlagsProviderHolder.h>

namespace facebook::react {

bool JReactNativeFeatureFlagsCxxInterop::commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool JReactNativeFeatureFlagsCxxInterop::useModernRuntimeScheduler(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useModernRuntimeScheduler();
}

bool JReactNativeFeatureFlagsCxxInterop::enableMicrotasks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableMicrotasks();
}

bool JReactNativeFeatureFlagsCxxInterop::batchRenderingUpdatesInEventLoop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop();
}

bool JReactNativeFeatureFlagsCxxInterop::enableSpannableBuildingUnification(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableSpannableBuildingUnification();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCustomDrawOrderFabric(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCustomDrawOrderFabric();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFixForClippedSubviewsCrash(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFixForClippedSubviewsCrash();
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
        "useModernRuntimeScheduler",
        JReactNativeFeatureFlagsCxxInterop::useModernRuntimeScheduler),
      makeNativeMethod(
        "enableMicrotasks",
        JReactNativeFeatureFlagsCxxInterop::enableMicrotasks),
      makeNativeMethod(
        "batchRenderingUpdatesInEventLoop",
        JReactNativeFeatureFlagsCxxInterop::batchRenderingUpdatesInEventLoop),
      makeNativeMethod(
        "enableSpannableBuildingUnification",
        JReactNativeFeatureFlagsCxxInterop::enableSpannableBuildingUnification),
      makeNativeMethod(
        "enableCustomDrawOrderFabric",
        JReactNativeFeatureFlagsCxxInterop::enableCustomDrawOrderFabric),
      makeNativeMethod(
        "enableFixForClippedSubviewsCrash",
        JReactNativeFeatureFlagsCxxInterop::enableFixForClippedSubviewsCrash),
  });
}

} // namespace facebook::react

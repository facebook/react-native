/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b7304c29a002ce5a8a612d7a08d798ff>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
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

  static bool useModernRuntimeScheduler(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableMicrotasks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool batchRenderingUpdatesInEventLoop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void override(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>,
      jni::alias_ref<jobject> provider);

  static void dangerouslyReset(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void registerNatives();
};

} // namespace facebook::react

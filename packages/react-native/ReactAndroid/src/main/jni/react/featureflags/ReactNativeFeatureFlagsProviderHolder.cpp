/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<feb0342515d10b3519675cd91efa65dc>>
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

#include "ReactNativeFeatureFlagsProviderHolder.h"

namespace facebook::react {

static jni::alias_ref<jni::JClass> getJClass() {
  static const auto jClass = facebook::jni::findClassStatic(
      "com/facebook/react/internal/featureflags/ReactNativeFeatureFlagsProvider");
  return jClass;
}

bool ReactNativeFeatureFlagsProviderHolder::commonTestFlag() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("commonTestFlag");
  return method(javaProvider_);
}

bool ReactNativeFeatureFlagsProviderHolder::useModernRuntimeScheduler() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("useModernRuntimeScheduler");
  return method(javaProvider_);
}

bool ReactNativeFeatureFlagsProviderHolder::enableMicrotasks() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("enableMicrotasks");
  return method(javaProvider_);
}

bool ReactNativeFeatureFlagsProviderHolder::batchRenderingUpdatesInEventLoop() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("batchRenderingUpdatesInEventLoop");
  return method(javaProvider_);
}

bool ReactNativeFeatureFlagsProviderHolder::enableSpannableBuildingUnification() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("enableSpannableBuildingUnification");
  return method(javaProvider_);
}

bool ReactNativeFeatureFlagsProviderHolder::enableCustomDrawOrderFabric() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("enableCustomDrawOrderFabric");
  return method(javaProvider_);
}

bool ReactNativeFeatureFlagsProviderHolder::enableFixForClippedSubviewsCrash() {
  static const auto method =
      getJClass()->getMethod<jboolean()>("enableFixForClippedSubviewsCrash");
  return method(javaProvider_);
}

} // namespace facebook::react

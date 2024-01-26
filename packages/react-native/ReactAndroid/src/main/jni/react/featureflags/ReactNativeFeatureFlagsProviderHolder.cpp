/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<6481de9ccf29dce1f9759c72cbaeb13d>>
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

} // namespace facebook::react

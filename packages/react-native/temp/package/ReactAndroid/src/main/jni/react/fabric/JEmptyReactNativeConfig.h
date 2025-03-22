/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/config/ReactNativeConfig.h>
#include <react/jni/ReadableNativeMap.h>
#include <memory>

namespace facebook::react {

class JEmptyReactNativeConfig
    : public jni::HybridClass<JEmptyReactNativeConfig> {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/EmptyReactNativeConfig;";

  static void registerNatives();

  jboolean getBool(const jni::alias_ref<jstring> param);

  jni::local_ref<jstring> getString(const jni::alias_ref<jstring> param);

  jlong getInt64(const jni::alias_ref<jstring> param);

  jdouble getDouble(const jni::alias_ref<jstring> param);

 private:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
  const EmptyReactNativeConfig reactNativeConfig_ = EmptyReactNativeConfig();
};

} // namespace facebook::react

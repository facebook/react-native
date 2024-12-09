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

/**
 * Implementation of ReactNativeConfig that wraps a ReactNativeConfig Java
 * object.
 */
class ReactNativeConfigHolder : public ReactNativeConfig {
 public:
  explicit ReactNativeConfigHolder(jni::alias_ref<jobject> reactNativeConfig)
      : reactNativeConfig_(make_global(reactNativeConfig)){};

 private:
  jni::global_ref<jobject> reactNativeConfig_;
};

} // namespace facebook::react

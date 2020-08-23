/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/config/ReactNativeConfig.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/ReadableNativeMap.h>
#include <memory>

namespace facebook {
namespace react {

/**
 * Implementation of ReactNativeConfig that wraps a FabricMobileConfig Java
 * object.
 */
class ReactNativeConfigHolder : public ReactNativeConfig {
 public:
  ReactNativeConfigHolder(jni::alias_ref<jobject> reactNativeConfig)
      : reactNativeConfig_(make_global(reactNativeConfig)){};

  bool getBool(const std::string &param) const override;
  std::string getString(const std::string &param) const override;
  int64_t getInt64(const std::string &param) const override;
  double getDouble(const std::string &param) const override;

 private:
  jni::global_ref<jobject> reactNativeConfig_;
};

} // namespace react
} // namespace facebook

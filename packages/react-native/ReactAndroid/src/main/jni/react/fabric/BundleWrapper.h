/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <fbjni/fbjni.h>
#include <jsireact/JSIExecutor.h>
#include <react/jni/JSLoader.h>

namespace facebook::react {

class BundleWrapper : public jni::HybridClass<BundleWrapper> {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/BundleWrapper;";

  static void registerNatives();

  [[nodiscard]] const std::shared_ptr<const BigStringBuffer> getBundle() const;

 private:
  static jni::local_ref<BundleWrapper::jhybriddata> initHybridFromFile(
      jni::alias_ref<jhybridobject> jThis,
      std::string fileName);

  static jni::local_ref<BundleWrapper::jhybriddata> initHybridFromAssets(
      jni::alias_ref<jhybridobject> jThis,
      jni::alias_ref<JAssetManager::javaobject> assetManager,
      const std::string& assetURL);

  friend HybridBase;

  explicit BundleWrapper(const std::shared_ptr<const BigStringBuffer>& bundle);

  const std::shared_ptr<const BigStringBuffer> bundle_;
};

} // namespace facebook::react

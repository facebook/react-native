/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <cxxreact/MessageQueueThread.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/config/ReactNativeConfig.h>
#include <react/runtime/JSRuntimeFactory.h>
#include <react/runtime/hermes/HermesInstance.h>
#include "../../jni/JJSRuntimeFactory.h"

namespace facebook::react {

class JHermesInstance
    : public jni::HybridClass<JHermesInstance, JJSRuntimeFactory> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/hermes/HermesInstance;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass> /* unused */,
      jni::alias_ref<jobject> reactNativeConfig,
      bool allocInOldGenBeforeTTI);

  static void registerNatives();

  JHermesInstance(
      std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
      bool allocInOldGenBeforeTTI)
      : reactNativeConfig_(std::move(reactNativeConfig)),
        allocInOldGenBeforeTTI_(allocInOldGenBeforeTTI){};

  std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept;

  ~JHermesInstance() {}

 private:
  friend HybridBase;

  std::shared_ptr<const ReactNativeConfig> reactNativeConfig_;
  bool allocInOldGenBeforeTTI_;
};

} // namespace facebook::react

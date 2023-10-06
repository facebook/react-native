/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <cxxreact/MessageQueueThread.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/runtime/JSEngineInstance.h>
#include <react/runtime/hermes/HermesInstance.h>
#include "../../jni/JJSEngineInstance.h"

namespace facebook::react {

class JHermesInstance
    : public jni::HybridClass<JHermesInstance, JJSEngineInstance> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/hermes/HermesInstance;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>);

  static void registerNatives();

  std::unique_ptr<jsi::Runtime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept;

  ~JHermesInstance() {}

 private:
  friend HybridBase;
};

} // namespace facebook::react

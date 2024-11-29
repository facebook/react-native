/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JHermesInstance.h"

#include <fbjni/fbjni.h>
#include <react/fabric/ReactNativeConfigHolder.h>

namespace facebook::react {

jni::local_ref<JHermesInstance::jhybriddata> JHermesInstance::initHybrid(
    jni::alias_ref<jclass> /* unused */,
    jni::alias_ref<jobject> reactNativeConfig,
    bool allocInOldGenBeforeTTI) {
  std::shared_ptr<const ReactNativeConfig> config = reactNativeConfig != nullptr
      ? std::make_shared<const ReactNativeConfigHolder>(reactNativeConfig)
      : nullptr;

  return makeCxxInstance(config, allocInOldGenBeforeTTI);
}

void JHermesInstance::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JHermesInstance::initHybrid),
  });
}

std::unique_ptr<JSRuntime> JHermesInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept {
  return HermesInstance::createJSRuntime(
      reactNativeConfig_, nullptr, msgQueueThread, allocInOldGenBeforeTTI_);
}

} // namespace facebook::react

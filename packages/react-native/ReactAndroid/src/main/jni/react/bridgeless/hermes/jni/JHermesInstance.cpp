// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "JHermesInstance.h"

#include <fb/fbjni.h>

namespace facebook {
namespace react {

jni::local_ref<JHermesInstance::jhybriddata> JHermesInstance::initHybrid(
    jni::alias_ref<jhybridobject>) {
  return makeCxxInstance();
}

void JHermesInstance::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JHermesInstance::initHybrid),
  });
}

std::unique_ptr<jsi::Runtime> JHermesInstance::createJSRuntime() noexcept {
  // TODO T105438175 Pass ReactNativeConfig to init Hermes with MobileConfig
  return HermesInstance::createJSRuntime();
}

} // namespace react
} // namespace facebook

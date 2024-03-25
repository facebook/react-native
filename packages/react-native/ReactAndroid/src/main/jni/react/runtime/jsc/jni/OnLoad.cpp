/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cxxreact/MessageQueueThread.h>
#include <fbjni/fbjni.h>
#include <jsc/JSCRuntime.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/runtime/JSRuntimeFactory.h>
#include <react/runtime/jni/JJSRuntimeFactory.h>

namespace facebook::react {

class JSCInstance : public jni::HybridClass<JSCInstance, JJSRuntimeFactory> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/JSCInstance;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>) {
    return makeCxxInstance();
  }

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JSCInstance::initHybrid),
    });
  }

  std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept {
    return std::make_unique<JSIRuntimeHolder>(jsc::makeJSCRuntime());
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::JSCInstance::registerNatives(); });
}

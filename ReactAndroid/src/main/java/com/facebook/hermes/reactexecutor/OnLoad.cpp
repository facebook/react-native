/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <../instrumentation/HermesMemoryDumper.h>
#include <HermesExecutorFactory.h>
#include <fbjni/fbjni.h>
#include <hermes/Public/GCConfig.h>
#include <hermes/Public/RuntimeConfig.h>
#include <jni.h>
#include <react/jni/JReactMarker.h>
#include <react/jni/JSLogging.h>
#include <react/jni/JavaScriptExecutorHolder.h>

#include <memory>

namespace facebook {
namespace react {

static ::hermes::vm::RuntimeConfig makeRuntimeConfig(
    jlong heapSizeMB,
    bool es6Symbol,
    jint bytecodeWarmupPercent) {
  namespace vm = ::hermes::vm;
  auto gcConfigBuilder =
      vm::GCConfig::Builder()
          .withMaxHeapSize(heapSizeMB << 20)
          .withName("RN")
          // For the next two arguments: avoid GC before TTI by initializing the
          // runtime to allocate directly in the old generation, but revert to
          // normal operation when we reach the (first) TTI point.
          .withAllocInYoung(false)
          .withRevertToYGAtTTI(true);

  return vm::RuntimeConfig::Builder()
      .withGCConfig(gcConfigBuilder.build())
      .withES6Symbol(es6Symbol)
      .withBytecodeWarmupPercent(bytecodeWarmupPercent)
      .build();
}

static void installBindings(jsi::Runtime &runtime) {
  react::Logger androidLogger =
      static_cast<void (*)(const std::string &, unsigned int)>(
          &reactAndroidLoggingHook);
  react::bindNativeLogger(runtime, androidLogger);
}

class HermesExecutorHolder
    : public jni::HybridClass<HermesExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/hermes/reactexecutor/HermesExecutor;";

  static jni::local_ref<jhybriddata> initHybridDefaultConfig(
      jni::alias_ref<jclass>) {
    JReactMarker::setLogPerfMarkerIfNeeded();

    return makeCxxInstance(
        std::make_unique<HermesExecutorFactory>(installBindings));
  }

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      jlong heapSizeMB,
      bool es6Symbol,
      jint bytecodeWarmupPercent) {
    JReactMarker::setLogPerfMarkerIfNeeded();
    auto runtimeConfig =
        makeRuntimeConfig(heapSizeMB, es6Symbol, bytecodeWarmupPercent);
    return makeCxxInstance(std::make_unique<HermesExecutorFactory>(
        installBindings, JSIExecutor::defaultTimeoutInvoker, runtimeConfig));
  }

  static bool canLoadFile(jni::alias_ref<jclass>, const std::string &path) {
    return true;
  }

  static void registerNatives() {
    registerHybrid(
        {makeNativeMethod("initHybrid", HermesExecutorHolder::initHybrid),
         makeNativeMethod(
             "initHybridDefaultConfig",
             HermesExecutorHolder::initHybridDefaultConfig),
         makeNativeMethod("canLoadFile", HermesExecutorHolder::canLoadFile)});
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::HermesExecutorHolder::registerNatives(); });
}

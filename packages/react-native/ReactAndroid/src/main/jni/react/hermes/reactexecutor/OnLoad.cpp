/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <HermesExecutorFactory.h>
#include <android/log.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <hermes/Public/GCConfig.h>
#include <hermes/Public/RuntimeConfig.h>
#include <jni.h>
#include <react/jni/JReactMarker.h>
#include <react/jni/JSLogging.h>
#include <react/jni/JavaScriptExecutorHolder.h>

#include <memory>

namespace facebook::react {

static void hermesFatalHandler(const std::string& reason) {
  LOG(ERROR) << "Hermes Fatal: " << reason << "\n";
  __android_log_assert(nullptr, "Hermes", "%s", reason.c_str());
}

static std::once_flag flag;

static ::hermes::vm::RuntimeConfig makeRuntimeConfig(jlong heapSizeMB) {
  namespace vm = ::hermes::vm;
  auto gcConfigBuilder = vm::GCConfig::Builder().withName("RN");
  if (heapSizeMB > 0) {
    gcConfigBuilder.withMaxHeapSize(heapSizeMB << 20);
  }

  return vm::RuntimeConfig::Builder()
      .withGCConfig(gcConfigBuilder.build())
      .withEnableSampleProfiling(true)
      .build();
}

static void installBindings(jsi::Runtime& runtime) {
  react::Logger androidLogger =
      static_cast<void (*)(const std::string&, unsigned int)>(
          &reactAndroidLoggingHook);
  react::bindNativeLogger(runtime, androidLogger);
}

class HermesExecutorHolder
    : public jni::HybridClass<HermesExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/hermes/reactexecutor/HermesExecutor;";

  static jni::local_ref<jhybriddata> initHybridDefaultConfig(
      jni::alias_ref<jclass>,
      bool enableDebugger,
      std::string debuggerName) {
    JReactMarker::setLogPerfMarkerIfNeeded();

    std::call_once(flag, []() {
      facebook::hermes::HermesRuntime::setFatalHandler(hermesFatalHandler);
    });
    auto factory = std::make_unique<HermesExecutorFactory>(installBindings);
    factory->setEnableDebugger(enableDebugger);
    if (!debuggerName.empty()) {
      factory->setDebuggerName(debuggerName);
    }
    return makeCxxInstance(std::move(factory));
  }

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      bool enableDebugger,
      std::string debuggerName,
      jlong heapSizeMB) {
    JReactMarker::setLogPerfMarkerIfNeeded();
    auto runtimeConfig = makeRuntimeConfig(heapSizeMB);
    std::call_once(flag, []() {
      facebook::hermes::HermesRuntime::setFatalHandler(hermesFatalHandler);
    });
    auto factory = std::make_unique<HermesExecutorFactory>(
        installBindings, JSIExecutor::defaultTimeoutInvoker, runtimeConfig);
    factory->setEnableDebugger(enableDebugger);
    if (!debuggerName.empty()) {
      factory->setDebuggerName(debuggerName);
    }
    return makeCxxInstance(std::move(factory));
  }

  static void registerNatives() {
    registerHybrid(
        {makeNativeMethod("initHybrid", HermesExecutorHolder::initHybrid),
         makeNativeMethod(
             "initHybridDefaultConfig",
             HermesExecutorHolder::initHybridDefaultConfig)});
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::HermesExecutorHolder::registerNatives(); });
}

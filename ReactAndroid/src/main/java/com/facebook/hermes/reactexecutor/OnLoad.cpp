/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <../instrumentation/HermesMemoryDumper.h>
#include <HermesExecutorFactory.h>
#include <android/log.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jni.h>
#include <react/jni/JReactMarker.h>
#include <react/jni/JSLogging.h>
#include <react/jni/JavaScriptExecutorHolder.h>
#include <react/jni/NativeTime.h>

#include <memory>

namespace facebook {
namespace react {

static void hermesFatalHandler(const std::string &reason) {
  LOG(ERROR) << "Hermes Fatal: " << reason << "\n";
  __android_log_assert(nullptr, "Hermes", "%s", reason.c_str());
}

static std::once_flag flag;

static void installBindings(jsi::Runtime &runtime) {
  react::Logger androidLogger =
      static_cast<void (*)(const std::string &, unsigned int)>(
          &reactAndroidLoggingHook);
  react::bindNativeLogger(runtime, androidLogger);

  react::PerformanceNow androidNativePerformanceNow =
      static_cast<double (*)()>(&reactAndroidNativePerformanceNowHook);
  react::bindNativePerformanceNow(runtime, androidNativePerformanceNow);
}

class HermesExecutorHolder
    : public jni::HybridClass<HermesExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/hermes/reactexecutor/HermesExecutor;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>) {
    JReactMarker::setLogPerfMarkerIfNeeded();

    std::call_once(flag, []() {
      facebook::hermes::HermesRuntime::setFatalHandler(hermesFatalHandler);
    });
    return makeCxxInstance(
        std::make_unique<HermesExecutorFactory>(installBindings));
  }

  static bool canLoadFile(jni::alias_ref<jclass>, const std::string &path) {
    return true;
  }

  static void registerNatives() {
    registerHybrid(
        {makeNativeMethod("initHybrid", HermesExecutorHolder::initHybrid),
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

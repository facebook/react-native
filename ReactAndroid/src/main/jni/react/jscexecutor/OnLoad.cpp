/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>
#include <jsc/JSCRuntime.h>
#include <jsireact/JSIExecutor.h>
#include <react/jni/JReactMarker.h>
#include <react/jni/JSLogging.h>
#include <react/jni/JavaScriptExecutorHolder.h>
#include <react/jni/NativeTime.h>
#include <react/jni/ReadableNativeMap.h>

#include <memory>

namespace facebook {
namespace react {

namespace {

class JSCExecutorFactory : public JSExecutorFactory {
 public:
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override {
    auto installBindings = [](jsi::Runtime &runtime) {
      react::Logger androidLogger =
          static_cast<void (*)(const std::string &, unsigned int)>(
              &reactAndroidLoggingHook);
      react::bindNativeLogger(runtime, androidLogger);

      react::PerformanceNow androidNativePerformanceNow =
          static_cast<double (*)()>(&reactAndroidNativePerformanceNowHook);
      react::bindNativePerformanceNow(runtime, androidNativePerformanceNow);
    };
    return std::make_unique<JSIExecutor>(
        jsc::makeJSCRuntime(),
        delegate,
        JSIExecutor::defaultTimeoutInvoker,
        installBindings);
  }
};

} // namespace

// This is not like JSCJavaScriptExecutor, which calls JSC directly.  This uses
// JSIExecutor with JSCRuntime.
class JSCExecutorHolder
    : public jni::HybridClass<JSCExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/jscexecutor/JSCExecutor;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      ReadableNativeMap *) {
    // This is kind of a weird place for stuff, but there's no other
    // good place for initialization which is specific to JSC on
    // Android.
    JReactMarker::setLogPerfMarkerIfNeeded();
    // TODO mhorowitz T28461666 fill in some missing nice to have glue
    return makeCxxInstance(std::make_unique<JSCExecutorFactory>());
  }

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JSCExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::JSCExecutorHolder::registerNatives(); });
}

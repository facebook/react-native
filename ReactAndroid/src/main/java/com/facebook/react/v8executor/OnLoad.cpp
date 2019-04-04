//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#include <fb/fbjni.h>
#include <folly/Memory.h>
#include <jsi/V8Runtime.h>
#include <jsireact/JSIExecutor.h>
#include <react/jni/JavaScriptExecutorHolder.h>
#include <react/jni/JReactMarker.h>
#include <react/jni/JSLogging.h>
#include <react/jni/ReadableNativeMap.h>

namespace facebook {
namespace v8runtime {
      std::unique_ptr<jsi::Runtime> makeV8Runtime();
} // namespace v8runtime
} // namespace facebook

namespace facebook {
namespace react {

namespace {

class V8ExecutorFactory : public JSExecutorFactory {
public:
  V8ExecutorFactory(folly::dynamic&& v8Config) :
    m_v8Config(std::move(v8Config)) {
  }

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override {
    return folly::make_unique<JSIExecutor>(
      facebook::v8runtime::makeV8Runtime(m_v8Config),
      delegate,
      [](const std::string& message, unsigned int logLevel) {
        reactAndroidLoggingHook(message, logLevel);
      },
      JSIExecutor::defaultTimeoutInvoker,
      nullptr);
  }

private:
  folly::dynamic m_v8Config;
};

}

// This is not like JSCJavaScriptExecutor, which calls JSC directly.  This uses
// JSIExecutor with V8Runtime.
class V8ExecutorHolder
    : public jni::HybridClass<V8ExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/v8executor/V8Executor;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>, ReadableNativeMap* v8Config) {
    // This is kind of a weird place for stuff, but there's no other
    // good place for initialization which is specific to JSC on
    // Android.
    JReactMarker::setLogPerfMarkerIfNeeded();
    // TODO mhorowitz T28461666 fill in some missing nice to have glue
    return makeCxxInstance(folly::make_unique<V8ExecutorFactory>(v8Config->consume()));
  }

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("initHybrid", V8ExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(vm, [] {
      facebook::react::V8ExecutorHolder::registerNatives();
  });
}

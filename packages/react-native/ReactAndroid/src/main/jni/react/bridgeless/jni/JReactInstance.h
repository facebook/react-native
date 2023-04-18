// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <fb/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/bridgeless/JSEngineInstance.h>
#include <react/bridgeless/PlatformTimerRegistry.h>
#include <react/bridgeless/ReactInstance.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/JRuntimeScheduler.h>
#include <react/jni/JSLoader.h>
#include <react/jni/ReadableNativeMap.h>

#include "JJSEngineInstance.h"
#include "JJSTimerExecutor.h"
#include "JJavaTimerManager.h"
#include "JReactExceptionManager.h"

namespace facebook {
namespace react {

class JReactInstance : public jni::HybridClass<JReactInstance> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/venice/ReactInstance;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject>,
      jni::alias_ref<JJSEngineInstance::javaobject> jsEngineInstance,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
      jni::alias_ref<JavaMessageQueueThread::javaobject>
          nativeMessageQueueThread,
      jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
      jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
      jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
      bool isProfiling);

  /*
   * Instantiates and returns an instance of `JSTimerExecutor`.
   */
  static jni::global_ref<JJSTimerExecutor::javaobject> createJSTimerExecutor(
      jni::alias_ref<jhybridobject> /* unused */);

  static void registerNatives();

  void loadJSBundleFromAssets(
      jni::alias_ref<JAssetManager::javaobject> assetManager,
      const std::string &assetURL);

  void loadJSBundleFromFile(
      const std::string &fileName,
      const std::string &sourceURL);

  void callFunctionOnModule(
      const std::string &moduleName,
      const std::string &methodName,
      NativeArray *args);

  jni::alias_ref<JRuntimeExecutor::javaobject>
  getUnbufferedRuntimeExecutor() noexcept;
  jni::alias_ref<JRuntimeExecutor::javaobject>
  getBufferedRuntimeExecutor() noexcept;
  jni::alias_ref<JRuntimeScheduler::javaobject> getRuntimeScheduler() noexcept;

  void registerSegment(int segmentId, const std::string &segmentPath) noexcept;

  void handleMemoryPressureJs(jint level);

 private:
  friend HybridBase;

  explicit JReactInstance(
      jni::alias_ref<JJSEngineInstance::javaobject> jsEngineInstance,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
      jni::alias_ref<JavaMessageQueueThread::javaobject>
          nativeMessageQueueThread,
      jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
      jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
      jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
      bool isProfiling) noexcept;

  jni::alias_ref<CallInvokerHolder::javaobject> getJSCallInvokerHolder();
  jni::alias_ref<CallInvokerHolder::javaobject> getNativeCallInvokerHolder();

  std::unique_ptr<ReactInstance> instance_;
  jni::global_ref<JRuntimeExecutor::javaobject> unbufferedRuntimeExecutor_;
  jni::global_ref<JRuntimeExecutor::javaobject> bufferedRuntimeExecutor_;
  jni::global_ref<JRuntimeScheduler::javaobject> runtimeScheduler_;
  jni::global_ref<CallInvokerHolder::javaobject> jsCallInvokerHolder_;
  jni::global_ref<CallInvokerHolder::javaobject> nativeCallInvokerHolder_;
  jni::global_ref<JReactExceptionManager::javaobject> jReactExceptionManager_;
};

} // namespace react
} // namespace facebook

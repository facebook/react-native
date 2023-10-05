/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactInstance.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include <cxxreact/JSBigString.h>
#include <cxxreact/RecoverableError.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <jsireact/JSIExecutor.h>
#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/JSLogging.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/runtime/BridgelessJSCallInvoker.h>
#include <react/runtime/BridgelessNativeMethodCallInvoker.h>
#include "JavaTimerRegistry.h"

namespace facebook::react {

JReactInstance::JReactInstance(
    jni::alias_ref<JJSEngineInstance::javaobject> jsEngineInstance,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeMessageQueueThread,
    jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
    jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
    jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
    jni::alias_ref<JBindingsInstaller::javaobject> jBindingsInstaller,
    bool isProfiling) noexcept {
  // TODO(janzer): Lazily create runtime
  auto sharedJSMessageQueueThread =
      std::make_shared<JMessageQueueThread>(jsMessageQueueThread);
  auto sharedNativeMessageQueueThread =
      std::make_shared<JMessageQueueThread>(nativeMessageQueueThread);

  // Create the timer manager (for JS timers)
  auto timerRegistry =
      std::make_unique<JavaTimerRegistry>(jni::make_global(javaTimerManager));
  auto timerManager = std::make_shared<TimerManager>(std::move(timerRegistry));
  jsTimerExecutor->cthis()->setTimerManager(timerManager);

  jReactExceptionManager_ = jni::make_global(jReactExceptionManager);
  auto jsErrorHandlingFunc = [this](MapBuffer errorMap) noexcept {
    if (jReactExceptionManager_ != nullptr) {
      auto jErrorMap =
          JReadableMapBuffer::createWithContents(std::move(errorMap));
      jReactExceptionManager_->reportJsException(jErrorMap.get());
    }
  };

  jBindingsInstaller_ = jni::make_global(jBindingsInstaller);

  instance_ = std::make_unique<ReactInstance>(
      jsEngineInstance->cthis()->createJSRuntime(sharedJSMessageQueueThread),
      sharedJSMessageQueueThread,
      timerManager,
      std::move(jsErrorHandlingFunc));

  auto bufferedRuntimeExecutor = instance_->getBufferedRuntimeExecutor();
  timerManager->setRuntimeExecutor(bufferedRuntimeExecutor);

  ReactInstance::JSRuntimeFlags options = {.isProfiling = isProfiling};
  instance_->initializeRuntime(options, [this](jsi::Runtime& runtime) {
    react::Logger androidLogger =
        static_cast<void (*)(const std::string&, unsigned int)>(
            &reactAndroidLoggingHook);
    react::bindNativeLogger(runtime, androidLogger);
    if (jBindingsInstaller_ != nullptr) {
      auto appBindingInstaller =
          jBindingsInstaller_->cthis()->getBindingsInstallFunc();
      if (appBindingInstaller != nullptr) {
        appBindingInstaller(runtime);
      }
    }
  });

  auto unbufferedRuntimeExecutor = instance_->getUnbufferedRuntimeExecutor();
  // Set up the JS and native modules call invokers (for TurboModules)
  auto jsInvoker =
      std::make_unique<BridgelessJSCallInvoker>(unbufferedRuntimeExecutor);
  jsCallInvokerHolder_ = jni::make_global(
      CallInvokerHolder::newObjectCxxArgs(std::move(jsInvoker)));
  auto nativeMethodCallInvoker =
      std::make_unique<BridgelessNativeMethodCallInvoker>(
          sharedNativeMessageQueueThread);
  nativeMethodCallInvokerHolder_ =
      jni::make_global(NativeMethodCallInvokerHolder::newObjectCxxArgs(
          std::move(nativeMethodCallInvoker)));

  // Storing this here to make sure the Java reference doesn't get destroyed
  unbufferedRuntimeExecutor_ = jni::make_global(
      JRuntimeExecutor::newObjectCxxArgs(unbufferedRuntimeExecutor));
  bufferedRuntimeExecutor_ = jni::make_global(
      JRuntimeExecutor::newObjectCxxArgs(bufferedRuntimeExecutor));
  runtimeScheduler_ = jni::make_global(
      JRuntimeScheduler::newObjectCxxArgs(instance_->getRuntimeScheduler()));
}

jni::local_ref<JReactInstance::jhybriddata> JReactInstance::initHybrid(
    jni::alias_ref<jhybridobject> /* unused */,
    jni::alias_ref<JJSEngineInstance::javaobject> jsEngineInstance,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeMessageQueueThread,
    jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
    jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
    jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
    jni::alias_ref<JBindingsInstaller::javaobject> jBindingsInstaller,
    bool isProfiling) {
  return makeCxxInstance(
      jsEngineInstance,
      jsMessageQueueThread,
      nativeMessageQueueThread,
      javaTimerManager,
      jsTimerExecutor,
      jReactExceptionManager,
      jBindingsInstaller,
      isProfiling);
}

void JReactInstance::loadJSBundleFromAssets(
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string& assetURL) {
  const int kAssetsLength = 9; // strlen("assets://");
  auto sourceURL = assetURL.substr(kAssetsLength);

  auto manager = extractAssetManager(assetManager);
  auto script = loadScriptFromAssets(manager, sourceURL);
  instance_->loadScript(std::move(script), sourceURL);
}

void JReactInstance::loadJSBundleFromFile(
    const std::string& fileName,
    const std::string& sourceURL) {
  std::unique_ptr<const JSBigFileString> script;
  RecoverableError::runRethrowingAsRecoverable<std::system_error>(
      [&fileName, &script]() { script = JSBigFileString::fromPath(fileName); });
  instance_->loadScript(std::move(script), sourceURL);
}

/**
 * This is needed to initialize TurboModules; in the future this will be
 * replaced with something similar to runtimeExecutor, which we'll use for
 * Fabric as well.
 * TODO T44251068 Replace with runtimeExecutor
 */
jni::alias_ref<CallInvokerHolder::javaobject>
JReactInstance::getJSCallInvokerHolder() {
  return jsCallInvokerHolder_;
}

jni::alias_ref<NativeMethodCallInvokerHolder::javaobject>
JReactInstance::getNativeMethodCallInvokerHolder() {
  return nativeMethodCallInvokerHolder_;
}

jni::global_ref<JJSTimerExecutor::javaobject>
JReactInstance::createJSTimerExecutor(
    jni::alias_ref<jhybridobject> /* unused */) {
  return jni::make_global(JJSTimerExecutor::newObjectCxxArgs());
}

void JReactInstance::callFunctionOnModule(
    const std::string& moduleName,
    const std::string& methodName,
    NativeArray* args) {
  instance_->callFunctionOnModule(moduleName, methodName, args->consume());
}

jni::alias_ref<JRuntimeExecutor::javaobject>
JReactInstance::getUnbufferedRuntimeExecutor() noexcept {
  return unbufferedRuntimeExecutor_;
}

jni::alias_ref<JRuntimeExecutor::javaobject>
JReactInstance::getBufferedRuntimeExecutor() noexcept {
  return bufferedRuntimeExecutor_;
}

jni::alias_ref<JRuntimeScheduler::javaobject>
JReactInstance::getRuntimeScheduler() noexcept {
  return runtimeScheduler_;
}

void JReactInstance::registerSegment(
    int segmentId,
    const std::string& segmentPath) noexcept {
  instance_->registerSegment((uint32_t)segmentId, segmentPath);
}

void JReactInstance::handleMemoryPressureJs(jint level) {
  instance_->handleMemoryPressureJs(level);
}

void JReactInstance::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JReactInstance::initHybrid),
      makeNativeMethod(
          "createJSTimerExecutor", JReactInstance::createJSTimerExecutor),
      makeNativeMethod(
          "loadJSBundleFromAssets", JReactInstance::loadJSBundleFromAssets),
      makeNativeMethod(
          "loadJSBundleFromFile", JReactInstance::loadJSBundleFromFile),
      makeNativeMethod(
          "getJSCallInvokerHolder", JReactInstance::getJSCallInvokerHolder),
      makeNativeMethod(
          "getNativeMethodCallInvokerHolder",
          JReactInstance::getNativeMethodCallInvokerHolder),
      makeNativeMethod(
          "callFunctionOnModule", JReactInstance::callFunctionOnModule),
      makeNativeMethod(
          "getUnbufferedRuntimeExecutor",
          JReactInstance::getUnbufferedRuntimeExecutor),
      makeNativeMethod(
          "getBufferedRuntimeExecutor",
          JReactInstance::getBufferedRuntimeExecutor),
      makeNativeMethod(
          "getRuntimeScheduler", JReactInstance::getRuntimeScheduler),

      makeNativeMethod(
          "registerSegmentNative", JReactInstance::registerSegment),
      makeNativeMethod(
          "handleMemoryPressureJs", JReactInstance::handleMemoryPressureJs),
  });
}

} // namespace facebook::react

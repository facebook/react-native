/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CatalystInstanceImpl.h"

#include <condition_variable>
#include <memory>
#include <mutex>
#include <sstream>
#include <vector>

#include <ReactCommon/CallInvokerHolder.h>
#include <cxxreact/CxxNativeModule.h>
#include <cxxreact/Instance.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/JSBundleType.h>
#include <cxxreact/JSIndexedRAMBundle.h>
#include <cxxreact/MethodCall.h>
#include <cxxreact/ModuleRegistry.h>
#include <cxxreact/RAMBundleRegistry.h>
#include <cxxreact/RecoverableError.h>
#include <fb/log.h>
#include <fbjni/ByteBuffer.h>
#include <folly/dynamic.h>

#include "CxxModuleWrapper.h"
#include "JNativeRunnable.h"
#include "JavaScriptExecutorHolder.h"
#include "JniJSModulesUnbundle.h"
#include "NativeArray.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

class Exception : public jni::JavaClass<Exception> {
 public:
};

class JInstanceCallback : public InstanceCallback {
 public:
  explicit JInstanceCallback(
      alias_ref<ReactCallback::javaobject> jobj,
      std::shared_ptr<JMessageQueueThread> messageQueueThread)
      : jobj_(make_global(jobj)),
        messageQueueThread_(std::move(messageQueueThread)) {}

  void onBatchComplete() override {
    messageQueueThread_->runOnQueue([this] {
      static auto method = ReactCallback::javaClassStatic()->getMethod<void()>(
          "onBatchComplete");
      method(jobj_);
    });
  }

  void incrementPendingJSCalls() override {
    // For C++ modules, this can be called from an arbitrary thread
    // managed by the module, via callJSCallback or callJSFunction.  So,
    // we ensure that it is registered with the JVM.
    jni::ThreadScope guard;
    static auto method = ReactCallback::javaClassStatic()->getMethod<void()>(
        "incrementPendingJSCalls");
    method(jobj_);
  }

  void decrementPendingJSCalls() override {
    jni::ThreadScope guard;
    static auto method = ReactCallback::javaClassStatic()->getMethod<void()>(
        "decrementPendingJSCalls");
    method(jobj_);
  }

 private:
  global_ref<ReactCallback::javaobject> jobj_;
  std::shared_ptr<JMessageQueueThread> messageQueueThread_;
};

} // namespace

jni::local_ref<CatalystInstanceImpl::jhybriddata>
CatalystInstanceImpl::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

CatalystInstanceImpl::CatalystInstanceImpl()
    : instance_(std::make_unique<Instance>()) {}

CatalystInstanceImpl::~CatalystInstanceImpl() {
  if (moduleMessageQueue_ != NULL) {
    moduleMessageQueue_->quitSynchronous();
  }
}

void CatalystInstanceImpl::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
      makeNativeMethod(
          "initializeBridge", CatalystInstanceImpl::initializeBridge),
      makeNativeMethod(
          "jniExtendNativeModules", CatalystInstanceImpl::extendNativeModules),
      makeNativeMethod(
          "jniSetSourceURL", CatalystInstanceImpl::jniSetSourceURL),
      makeNativeMethod(
          "jniRegisterSegment", CatalystInstanceImpl::jniRegisterSegment),
      makeNativeMethod(
          "jniLoadScriptFromAssets",
          CatalystInstanceImpl::jniLoadScriptFromAssets),
      makeNativeMethod(
          "jniLoadScriptFromFile", CatalystInstanceImpl::jniLoadScriptFromFile),
      makeNativeMethod(
          "jniCallJSFunction", CatalystInstanceImpl::jniCallJSFunction),
      makeNativeMethod(
          "jniCallJSCallback", CatalystInstanceImpl::jniCallJSCallback),
      makeNativeMethod(
          "setGlobalVariable", CatalystInstanceImpl::setGlobalVariable),
      makeNativeMethod(
          "getJavaScriptContext", CatalystInstanceImpl::getJavaScriptContext),
      makeNativeMethod(
          "getJSCallInvokerHolder",
          CatalystInstanceImpl::getJSCallInvokerHolder),
      makeNativeMethod(
          "getNativeCallInvokerHolder",
          CatalystInstanceImpl::getNativeCallInvokerHolder),
      makeNativeMethod(
          "jniHandleMemoryPressure",
          CatalystInstanceImpl::handleMemoryPressure),
  });

  JNativeRunnable::registerNatives();
}

void CatalystInstanceImpl::initializeBridge(
    jni::alias_ref<ReactCallback::javaobject> callback,
    // This executor is actually a factory holder.
    JavaScriptExecutorHolder *jseh,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
        javaModules,
    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject>
        cxxModules) {
  // TODO mhorowitz: how to assert here?
  // Assertions.assertCondition(mBridge == null, "initializeBridge should be
  // called once");
  moduleMessageQueue_ =
      std::make_shared<JMessageQueueThread>(nativeModulesQueue);

  // This used to be:
  //
  // Java CatalystInstanceImpl -> C++ CatalystInstanceImpl -> Bridge ->
  // Bridge::Callback
  // --weak--> ReactCallback -> Java CatalystInstanceImpl
  //
  // Now the weak ref is a global ref.  So breaking the loop depends on
  // CatalystInstanceImpl#destroy() calling mHybridData.resetNative(), which
  // should cause all the C++ pointers to be cleaned up (except C++
  // CatalystInstanceImpl might be kept alive for a short time by running
  // callbacks). This also means that all native calls need to be pre-checked
  // to avoid NPE.

  // See the comment in callJSFunction.  Once js calls switch to strings, we
  // don't need jsModuleDescriptions any more, all the way up and down the
  // stack.

  moduleRegistry_ = std::make_shared<ModuleRegistry>(buildNativeModuleList(
      std::weak_ptr<Instance>(instance_),
      javaModules,
      cxxModules,
      moduleMessageQueue_));

  instance_->initializeBridge(
      std::make_unique<JInstanceCallback>(callback, moduleMessageQueue_),
      jseh->getExecutorFactory(),
      std::make_unique<JMessageQueueThread>(jsQueue),
      moduleRegistry_);
}

void CatalystInstanceImpl::extendNativeModules(
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
        javaModules,
    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject>
        cxxModules) {
  moduleRegistry_->registerModules(buildNativeModuleList(
      std::weak_ptr<Instance>(instance_),
      javaModules,
      cxxModules,
      moduleMessageQueue_));
}

void CatalystInstanceImpl::jniSetSourceURL(const std::string &sourceURL) {
  instance_->setSourceURL(sourceURL);
}

void CatalystInstanceImpl::jniRegisterSegment(
    int segmentId,
    const std::string &path) {
  instance_->registerBundle((uint32_t)segmentId, path);
}

void CatalystInstanceImpl::jniLoadScriptFromAssets(
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string &assetURL,
    bool loadSynchronously) {
  const int kAssetsLength = 9; // strlen("assets://");
  auto sourceURL = assetURL.substr(kAssetsLength);

  auto manager = extractAssetManager(assetManager);
  auto script = loadScriptFromAssets(manager, sourceURL);
  if (JniJSModulesUnbundle::isUnbundle(manager, sourceURL)) {
    auto bundle = JniJSModulesUnbundle::fromEntryFile(manager, sourceURL);
    auto registry = RAMBundleRegistry::singleBundleRegistry(std::move(bundle));
    instance_->loadRAMBundle(
        std::move(registry), std::move(script), sourceURL, loadSynchronously);
    return;
  } else if (Instance::isIndexedRAMBundle(&script)) {
    instance_->loadRAMBundleFromString(std::move(script), sourceURL);
  } else {
    instance_->loadScriptFromString(
        std::move(script), sourceURL, loadSynchronously);
  }
}

void CatalystInstanceImpl::jniLoadScriptFromFile(
    const std::string &fileName,
    const std::string &sourceURL,
    bool loadSynchronously) {
  if (Instance::isIndexedRAMBundle(fileName.c_str())) {
    instance_->loadRAMBundleFromFile(fileName, sourceURL, loadSynchronously);
  } else {
    std::unique_ptr<const JSBigFileString> script;
    RecoverableError::runRethrowingAsRecoverable<std::system_error>(
        [&fileName, &script]() {
          script = JSBigFileString::fromPath(fileName);
        });
    instance_->loadScriptFromString(
        std::move(script), sourceURL, loadSynchronously);
  }
}

void CatalystInstanceImpl::jniCallJSFunction(
    std::string module,
    std::string method,
    NativeArray *arguments) {
  // We want to share the C++ code, and on iOS, modules pass module/method
  // names as strings all the way through to JS, and there's no way to do
  // string -> id mapping on the objc side.  So on Android, we convert the
  // number to a string, here which gets passed as-is to JS.  There, they they
  // used as ids if isFinite(), which handles this case, and looked up as
  // strings otherwise.  Eventually, we'll probably want to modify the stack
  // from the JS proxy through here to use strings, too.
  instance_->callJSFunction(
      std::move(module), std::move(method), arguments->consume());
}

void CatalystInstanceImpl::jniCallJSCallback(
    jint callbackId,
    NativeArray *arguments) {
  instance_->callJSCallback(callbackId, arguments->consume());
}

void CatalystInstanceImpl::setGlobalVariable(
    std::string propName,
    std::string &&jsonValue) {
  // This is only ever called from Java with short strings, and only
  // for testing, so no need to try hard for zero-copy here.

  instance_->setGlobalVariable(
      std::move(propName),
      std::make_unique<JSBigStdString>(std::move(jsonValue)));
}

jlong CatalystInstanceImpl::getJavaScriptContext() {
  return (jlong)(intptr_t)instance_->getJavaScriptContext();
}

void CatalystInstanceImpl::handleMemoryPressure(int pressureLevel) {
  instance_->handleMemoryPressure(pressureLevel);
}

jni::alias_ref<CallInvokerHolder::javaobject>
CatalystInstanceImpl::getJSCallInvokerHolder() {
  if (!jsCallInvokerHolder_) {
    jsCallInvokerHolder_ = jni::make_global(
        CallInvokerHolder::newObjectCxxArgs(instance_->getJSCallInvoker()));
  }

  return jsCallInvokerHolder_;
}

jni::alias_ref<CallInvokerHolder::javaobject>
CatalystInstanceImpl::getNativeCallInvokerHolder() {
  if (!nativeCallInvokerHolder_) {
    class NativeThreadCallInvoker : public CallInvoker {
     private:
      std::shared_ptr<JMessageQueueThread> messageQueueThread_;

     public:
      NativeThreadCallInvoker(
          std::shared_ptr<JMessageQueueThread> messageQueueThread)
          : messageQueueThread_(messageQueueThread) {}
      void invokeAsync(std::function<void()> &&work) override {
        messageQueueThread_->runOnQueue(std::move(work));
      }
      void invokeSync(std::function<void()> &&work) override {
        messageQueueThread_->runOnQueueSync(std::move(work));
      }
    };

    std::shared_ptr<CallInvoker> nativeInvoker =
        std::make_shared<NativeThreadCallInvoker>(moduleMessageQueue_);

    std::shared_ptr<CallInvoker> decoratedNativeInvoker =
        instance_->getDecoratedNativeCallInvoker(nativeInvoker);

    nativeCallInvokerHolder_ = jni::make_global(
        CallInvokerHolder::newObjectCxxArgs(decoratedNativeInvoker));
  }

  return nativeCallInvokerHolder_;
}

} // namespace react
} // namespace facebook

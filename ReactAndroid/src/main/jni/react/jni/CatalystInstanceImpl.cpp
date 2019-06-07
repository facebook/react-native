// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "CatalystInstanceImpl.h"

#include <mutex>
#include <condition_variable>
#include <sstream>
#include <vector>

#include <cxxreact/CxxNativeModule.h>
#include <cxxreact/Instance.h>
#include <cxxreact/BundleLoader.h>
#include <cxxreact/DeltaBundleLoader.h>
#include <cxxreact/MethodCall.h>
#include <cxxreact/ModuleRegistry.h>
#include <cxxreact/RecoverableError.h>
#include <fb/log.h>
#include <fb/fbjni/ByteBuffer.h>
#include <folly/dynamic.h>
#include <folly/Memory.h>
#include <jni/Countable.h>
#include <jni/LocalReference.h>
#include <jsireact/JSCallInvokerHolder.h>

#include "CxxModuleWrapper.h"
#include "JavaScriptExecutorHolder.h"
#include "JNativeRunnable.h"
#include "NativeArray.h"
#include "AssetBundleLoader.h"
#include "FileBundleLoader.h"

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
  : jobj_(make_global(jobj)), messageQueueThread_(std::move(messageQueueThread)) {}

  void onBatchComplete() override {
    messageQueueThread_->runOnQueue([this] {
      static auto method =
        ReactCallback::javaClassStatic()->getMethod<void()>("onBatchComplete");
      method(jobj_);
    });
  }

  void incrementPendingJSCalls() override {
    // For C++ modules, this can be called from an arbitrary thread
    // managed by the module, via callJSCallback or callJSFunction.  So,
    // we ensure that it is registered with the JVM.
    jni::ThreadScope guard;
    static auto method =
      ReactCallback::javaClassStatic()->getMethod<void()>("incrementPendingJSCalls");
    method(jobj_);
  }

  void decrementPendingJSCalls() override {
    jni::ThreadScope guard;
    static auto method =
      ReactCallback::javaClassStatic()->getMethod<void()>("decrementPendingJSCalls");
    method(jobj_);
  }

 private:
  global_ref<ReactCallback::javaobject> jobj_;
  std::shared_ptr<JMessageQueueThread> messageQueueThread_;
};

}

jni::local_ref<CatalystInstanceImpl::jhybriddata> CatalystInstanceImpl::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

CatalystInstanceImpl::CatalystInstanceImpl()
  : instance_(folly::make_unique<Instance>()) {}

CatalystInstanceImpl::~CatalystInstanceImpl() {
  if (moduleMessageQueue_ != NULL) {
    moduleMessageQueue_->quitSynchronous();
  }
}

void CatalystInstanceImpl::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
    makeNativeMethod("initializeBridge", CatalystInstanceImpl::initializeBridge),
    makeNativeMethod("jniExtendNativeModules", CatalystInstanceImpl::extendNativeModules),
    makeNativeMethod("jniSetSourceURL", CatalystInstanceImpl::jniSetSourceURL),
    makeNativeMethod("jniLoadScriptFromAssets", CatalystInstanceImpl::jniLoadScriptFromAssets),
    makeNativeMethod("jniLoadScriptFromFile", CatalystInstanceImpl::jniLoadScriptFromFile),
    makeNativeMethod("jniLoadScriptFromDeltaBundle", CatalystInstanceImpl::jniLoadScriptFromDeltaBundle),
    makeNativeMethod("jniCallJSFunction", CatalystInstanceImpl::jniCallJSFunction),
    makeNativeMethod("jniCallJSCallback", CatalystInstanceImpl::jniCallJSCallback),
    makeNativeMethod("setGlobalVariable", CatalystInstanceImpl::setGlobalVariable),
    makeNativeMethod("getJavaScriptContext", CatalystInstanceImpl::getJavaScriptContext),
    makeNativeMethod("getJSCallInvokerHolder", CatalystInstanceImpl::getJSCallInvokerHolder),
    makeNativeMethod("jniHandleMemoryPressure", CatalystInstanceImpl::handleMemoryPressure),
  });

  JNativeRunnable::registerNatives();
}

void CatalystInstanceImpl::initializeBridge(
    jni::alias_ref<ReactCallback::javaobject> callback,
    // This executor is actually a factory holder.
    JavaScriptExecutorHolder* jseh,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeModulesQueue,
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules) {
  // TODO mhorowitz: how to assert here?
  // Assertions.assertCondition(mBridge == null, "initializeBridge should be called once");
  moduleMessageQueue_ = std::make_shared<JMessageQueueThread>(nativeModulesQueue);

  // This used to be:
  //
  // Java CatalystInstanceImpl -> C++ CatalystInstanceImpl -> Bridge -> Bridge::Callback
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

  moduleRegistry_ = std::make_shared<ModuleRegistry>(
    buildNativeModuleList(
       std::weak_ptr<Instance>(instance_),
       javaModules,
       cxxModules,
       moduleMessageQueue_));

  instance_->initializeBridge(
    std::make_unique<JInstanceCallback>(
    callback,
    moduleMessageQueue_),
    jseh->getExecutorFactory(),
    folly::make_unique<JMessageQueueThread>(jsQueue),
    moduleRegistry_);
}

void CatalystInstanceImpl::extendNativeModules(
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules) {
  moduleRegistry_->registerModules(buildNativeModuleList(
    std::weak_ptr<Instance>(instance_),
    javaModules,
    cxxModules,
    moduleMessageQueue_));
}

void CatalystInstanceImpl::jniSetSourceURL(const std::string& sourceURL) {
  instance_->runApplicationInRemoteDebugger(sourceURL);
}

void CatalystInstanceImpl::jniLoadScriptFromAssets(
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string& assetURL,
    bool loadSynchronously) {
  std::unique_ptr<BundleLoader> bundleLoader = std::make_unique<AssetBundleLoader>(assetManager);
  instance_->runApplication(assetURL, std::move(bundleLoader), loadSynchronously);
}

void CatalystInstanceImpl::jniLoadScriptFromFile(
    const std::string& sourceURL,
    jni::alias_ref<JavaDevBundlesContainer::javaobject> bundlesContainer,
    bool loadSynchronously) {
  std::unique_ptr<FileBundleLoader> bundleLoader = std::make_unique<FileBundleLoader>(bundlesContainer);
  instance_->runApplication(sourceURL, std::move(bundleLoader), loadSynchronously);
}

void CatalystInstanceImpl::jniLoadScriptFromDeltaBundle(
    const std::string& sourceURL,
    jni::alias_ref<NativeDeltaClient::jhybridobject> jDeltaClient,
    bool loadSynchronously) {
  auto deltaClient = jDeltaClient->cthis()->getDeltaClient();
  std::unique_ptr<BundleLoader> bundleLoader = std::make_unique<DeltaBundleLoader>(deltaClient);
  instance_->runApplication(sourceURL, std::move(bundleLoader), loadSynchronously);
}

void CatalystInstanceImpl::jniCallJSFunction(std::string module, std::string method, NativeArray* arguments) {
  // We want to share the C++ code, and on iOS, modules pass module/method
  // names as strings all the way through to JS, and there's no way to do
  // string -> id mapping on the objc side.  So on Android, we convert the
  // number to a string, here which gets passed as-is to JS.  There, they they
  // used as ids if isFinite(), which handles this case, and looked up as
  // strings otherwise.  Eventually, we'll probably want to modify the stack
  // from the JS proxy through here to use strings, too.
  instance_->callJSFunction(std::move(module),
                            std::move(method),
                            arguments->consume());
}

void CatalystInstanceImpl::jniCallJSCallback(jint callbackId, NativeArray* arguments) {
  instance_->callJSCallback(callbackId, arguments->consume());
}

void CatalystInstanceImpl::setGlobalVariable(std::string propName,
                                             std::string&& jsonValue) {
  // This is only ever called from Java with short strings, and only
  // for testing, so no need to try hard for zero-copy here.

  instance_->setGlobalVariable(std::move(propName),
                               folly::make_unique<JSBigStdString>(std::move(jsonValue)));
}

jlong CatalystInstanceImpl::getJavaScriptContext() {
  return (jlong) (intptr_t) instance_->getJavaScriptContext();
}

void CatalystInstanceImpl::handleMemoryPressure(int pressureLevel) {
  instance_->handleMemoryPressure(pressureLevel);
}

jni::alias_ref<JSCallInvokerHolder::javaobject> CatalystInstanceImpl::getJSCallInvokerHolder() {
  if (!javaInstanceHolder_) {
    jsCallInvoker_ = std::make_shared<BridgeJSCallInvoker>(instance_);
    javaInstanceHolder_ = jni::make_global(JSCallInvokerHolder::newObjectCxxArgs(jsCallInvoker_));
  }

  return javaInstanceHolder_;
}

}}

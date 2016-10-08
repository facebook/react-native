// Copyright 2004-present Facebook. All Rights Reserved.

#include "CatalystInstanceImpl.h"

#include <mutex>
#include <condition_variable>

#include <folly/dynamic.h>
#include <folly/Memory.h>

#include <fb/log.h>

#include <jni/Countable.h>
#include <jni/LocalReference.h>

#include <cxxreact/Instance.h>
#include <cxxreact/MethodCall.h>
#include <cxxreact/ModuleRegistry.h>

#include "JSLoader.h"
#include "JavaScriptExecutorHolder.h"
#include "JniJSModulesUnbundle.h"
#include "ModuleRegistryHolder.h"
#include "NativeArray.h"
#include "JNativeRunnable.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {


class Exception : public jni::JavaClass<Exception> {
 public:
  static auto constexpr kJavaDescriptor = "Ljava/lang/Exception;";
};

class JInstanceCallback : public InstanceCallback {
 public:
  explicit JInstanceCallback(alias_ref<ReactCallback::javaobject> jobj)
    : jobj_(make_global(jobj)) {}

  void onBatchComplete() override {
    static auto method =
      ReactCallback::javaClassStatic()->getMethod<void()>("onBatchComplete");
    method(jobj_);
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
    static auto method =
      ReactCallback::javaClassStatic()->getMethod<void()>("decrementPendingJSCalls");
    method(jobj_);
  }

  void onNativeException(const std::string& what) override {
    static auto exCtor =
      Exception::javaClassStatic()->getConstructor<Exception::javaobject(jstring)>();
    static auto method =
      ReactCallback::javaClassStatic()->getMethod<void(Exception::javaobject)>("onNativeException");

    method(jobj_, Exception::javaClassStatic()->newObject(
             exCtor, jni::make_jstring(what).get()).get());
  }

  ExecutorToken createExecutorToken() override {
    auto jobj = JExecutorToken::newObjectCxxArgs();
    return jobj->cthis()->getExecutorToken(jobj);
  }

  void onExecutorStopped(ExecutorToken) override {
    // TODO(cjhopman): implement this.
  }

 private:
  global_ref<ReactCallback::javaobject> jobj_;
};

}

jni::local_ref<CatalystInstanceImpl::jhybriddata> CatalystInstanceImpl::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

CatalystInstanceImpl::CatalystInstanceImpl()
    : instance_(folly::make_unique<Instance>()) {}

void CatalystInstanceImpl::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
      makeNativeMethod("initializeBridge", CatalystInstanceImpl::initializeBridge),
      makeNativeMethod("loadScriptFromAssets",
                       "(Landroid/content/res/AssetManager;Ljava/lang/String;)V",
                       CatalystInstanceImpl::loadScriptFromAssets),
      makeNativeMethod("loadScriptFromFile", CatalystInstanceImpl::loadScriptFromFile),
      makeNativeMethod("loadScriptFromOptimizedBundle",
                       CatalystInstanceImpl::loadScriptFromOptimizedBundle),
      makeNativeMethod("callJSFunction", CatalystInstanceImpl::callJSFunction),
      makeNativeMethod("callJSCallback", CatalystInstanceImpl::callJSCallback),
      makeNativeMethod("getMainExecutorToken", CatalystInstanceImpl::getMainExecutorToken),
      makeNativeMethod("setGlobalVariable", CatalystInstanceImpl::setGlobalVariable),
      makeNativeMethod("handleMemoryPressureUiHidden", CatalystInstanceImpl::handleMemoryPressureUiHidden),
      makeNativeMethod("handleMemoryPressureModerate", CatalystInstanceImpl::handleMemoryPressureModerate),
      makeNativeMethod("handleMemoryPressureCritical", CatalystInstanceImpl::handleMemoryPressureCritical),
      makeNativeMethod("supportsProfiling", CatalystInstanceImpl::supportsProfiling),
      makeNativeMethod("startProfiler", CatalystInstanceImpl::startProfiler),
      makeNativeMethod("stopProfiler", CatalystInstanceImpl::stopProfiler),
  });

  JNativeRunnable::registerNatives();
}

void CatalystInstanceImpl::initializeBridge(
    jni::alias_ref<ReactCallback::javaobject> callback,
    // This executor is actually a factory holder.
    JavaScriptExecutorHolder* jseh,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
    jni::alias_ref<JavaMessageQueueThread::javaobject> moduleQueue,
    ModuleRegistryHolder* mrh) {
  // TODO mhorowitz: how to assert here?
  // Assertions.assertCondition(mBridge == null, "initializeBridge should be called once");

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

  instance_->initializeBridge(folly::make_unique<JInstanceCallback>(callback),
                              jseh->getExecutorFactory(),
                              folly::make_unique<JMessageQueueThread>(jsQueue),
                              folly::make_unique<JMessageQueueThread>(moduleQueue),
                              mrh->getModuleRegistry());
}

void CatalystInstanceImpl::loadScriptFromAssets(jobject assetManager,
                                                const std::string& assetURL) {
  const int kAssetsLength = 9;  // strlen("assets://");
  auto sourceURL = assetURL.substr(kAssetsLength);

  auto manager = react::extractAssetManager(assetManager);
  auto script = react::loadScriptFromAssets(manager, sourceURL);
  if (JniJSModulesUnbundle::isUnbundle(manager, sourceURL)) {
    instance_->loadUnbundle(
      folly::make_unique<JniJSModulesUnbundle>(manager, sourceURL),
      std::move(script),
      sourceURL);
    return;
  } else {
    instance_->loadScriptFromString(std::move(script), sourceURL);
  }
}

void CatalystInstanceImpl::loadScriptFromFile(jni::alias_ref<jstring> fileName,
                                              const std::string& sourceURL) {
  return instance_->loadScriptFromFile(fileName ? fileName->toStdString() : "",
                                       sourceURL);
}

void CatalystInstanceImpl::loadScriptFromOptimizedBundle(const std::string& bundlePath,
                                                         const std::string& sourceURL,
                                                         jint flags) {
  return instance_->loadScriptFromOptimizedBundle(std::move(bundlePath),
                                                  std::move(sourceURL),
                                                  flags);
}

void CatalystInstanceImpl::callJSFunction(
    JExecutorToken* token, std::string module, std::string method, NativeArray* arguments) {
  // We want to share the C++ code, and on iOS, modules pass module/method
  // names as strings all the way through to JS, and there's no way to do
  // string -> id mapping on the objc side.  So on Android, we convert the
  // number to a string, here which gets passed as-is to JS.  There, they they
  // used as ids if isFinite(), which handles this case, and looked up as
  // strings otherwise.  Eventually, we'll probably want to modify the stack
  // from the JS proxy through here to use strings, too.
  instance_->callJSFunction(token->getExecutorToken(nullptr),
                            std::move(module),
                            std::move(method),
                            std::move(arguments->array));
}

void CatalystInstanceImpl::callJSCallback(JExecutorToken* token, jint callbackId, NativeArray* arguments) {
  instance_->callJSCallback(token->getExecutorToken(nullptr), callbackId, std::move(arguments->array));
}

local_ref<JExecutorToken::JavaPart> CatalystInstanceImpl::getMainExecutorToken() {
  return JExecutorToken::extractJavaPartFromToken(instance_->getMainExecutorToken());
}

void CatalystInstanceImpl::setGlobalVariable(std::string propName,
                                             std::string&& jsonValue) {
  // This is only ever called from Java with short strings, and only
  // for testing, so no need to try hard for zero-copy here.

  instance_->setGlobalVariable(std::move(propName),
                               folly::make_unique<JSBigStdString>(std::move(jsonValue)));
}

void CatalystInstanceImpl::handleMemoryPressureUiHidden() {
  instance_->handleMemoryPressureUiHidden();
}

void CatalystInstanceImpl::handleMemoryPressureModerate() {
  instance_->handleMemoryPressureModerate();
}

void CatalystInstanceImpl::handleMemoryPressureCritical() {
  instance_->handleMemoryPressureCritical();
}

jboolean CatalystInstanceImpl::supportsProfiling() {
  if (!instance_) {
    return false;
  }
  return instance_->supportsProfiling();
}

void CatalystInstanceImpl::startProfiler(const std::string& title) {
  if (!instance_) {
    return;
  }
  return instance_->startProfiler(title);
}

void CatalystInstanceImpl::stopProfiler(const std::string& title, const std::string& filename) {
  if (!instance_) {
    return;
  }
  return instance_->stopProfiler(title, filename);
}

}}

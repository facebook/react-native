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
#include <cxxreact/JSBundleType.h>
#include <cxxreact/JSIndexedRAMBundle.h>
#include <cxxreact/MethodCall.h>
#include <cxxreact/ModuleRegistry.h>
#include <cxxreact/CxxNativeModule.h>

#include "CxxModuleWrapper.h"
#include "JavaScriptExecutorHolder.h"
#include "JniJSModulesUnbundle.h"
#include "JNativeRunnable.h"
#include "JSLoader.h"
#include "NativeArray.h"

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

  ExecutorToken createExecutorToken() override {
    auto jobj = JExecutorToken::newObjectCxxArgs();
    return jobj->cthis()->getExecutorToken(jobj);
  }

  void onExecutorStopped(ExecutorToken) override {}

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
  // TODO: 16669252: this prevents onCatalystInstanceDestroy from being called
  moduleMessageQueue_->quitSynchronous();
}

void CatalystInstanceImpl::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", CatalystInstanceImpl::initHybrid),
    makeNativeMethod("initializeBridge", CatalystInstanceImpl::initializeBridge),
    makeNativeMethod("jniSetSourceURL", CatalystInstanceImpl::jniSetSourceURL),
    makeNativeMethod("jniLoadScriptFromAssets", CatalystInstanceImpl::jniLoadScriptFromAssets),
    makeNativeMethod("jniLoadScriptFromFile", CatalystInstanceImpl::jniLoadScriptFromFile),
    makeNativeMethod("jniCallJSFunction", CatalystInstanceImpl::jniCallJSFunction),
    makeNativeMethod("jniCallJSCallback", CatalystInstanceImpl::jniCallJSCallback),
    makeNativeMethod("getMainExecutorToken", CatalystInstanceImpl::getMainExecutorToken),
    makeNativeMethod("setGlobalVariable", CatalystInstanceImpl::setGlobalVariable),
    makeNativeMethod("getJavaScriptContext", CatalystInstanceImpl::getJavaScriptContext),
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

  instance_->initializeBridge(
    folly::make_unique<JInstanceCallback>(callback, moduleMessageQueue_),
    jseh->getExecutorFactory(),
    folly::make_unique<JMessageQueueThread>(jsQueue),
    buildModuleRegistry(
      std::weak_ptr<Instance>(instance_), javaModules, cxxModules, moduleMessageQueue_));
}

void CatalystInstanceImpl::jniSetSourceURL(const std::string& sourceURL) {
  instance_->setSourceURL(sourceURL);
}

void CatalystInstanceImpl::jniLoadScriptFromAssets(
    jni::alias_ref<JAssetManager::javaobject> assetManager,
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

bool CatalystInstanceImpl::isIndexedRAMBundle(const char *sourcePath) {
  std::ifstream bundle_stream(sourcePath, std::ios_base::in);
  if (!bundle_stream) {
    return false;
  }
  BundleHeader header;
  bundle_stream.read(reinterpret_cast<char *>(&header), sizeof(header));
  bundle_stream.close();
  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

void CatalystInstanceImpl::jniLoadScriptFromFile(const std::string& fileName,
                                                 const std::string& sourceURL) {
  auto zFileName = fileName.c_str();
  if (isIndexedRAMBundle(zFileName)) {
    auto bundle = folly::make_unique<JSIndexedRAMBundle>(zFileName);
    auto startupScript = bundle->getStartupCode();
    instance_->loadUnbundle(
      std::move(bundle),
      std::move(startupScript),
      sourceURL);
  } else {
    instance_->loadScriptFromFile(fileName, sourceURL);
  }
}

void CatalystInstanceImpl::jniCallJSFunction(
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
                            arguments->consume());
}

void CatalystInstanceImpl::jniCallJSCallback(JExecutorToken* token, jint callbackId, NativeArray* arguments) {
  instance_->callJSCallback(token->getExecutorToken(nullptr), callbackId, arguments->consume());
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

jlong CatalystInstanceImpl::getJavaScriptContext() {
  return (jlong) (intptr_t) instance_->getJavaScriptContext();
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

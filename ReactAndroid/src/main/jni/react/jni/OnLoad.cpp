// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <string>

#include <fb/fbjni.h>
#include <fb/glog_init.h>
#include <fb/log.h>

#include "AndroidJSCFactory.h"
#include "CatalystInstanceImpl.h"
#include "CxxModuleWrapper.h"
#include "JavaScriptExecutorHolder.h"
#include "JCallback.h"
#include "NativeDeltaClient.h"
#include "ProxyExecutor.h"
#include "WritableNativeArray.h"
#include "WritableNativeMap.h"

#ifdef WITH_INSPECTOR
#include "JInspector.h"
#endif

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

// TODO: can we avoid these wrapper classes, and instead specialize the logic in CatalystInstanceImpl
class JSCJavaScriptExecutorHolder : public HybridClass<JSCJavaScriptExecutorHolder,
                                                       JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/JSCJavaScriptExecutor;";

  static local_ref<jhybriddata> initHybrid(alias_ref<jclass>, ReadableNativeMap* jscConfig) {
    return makeCxxInstance(makeAndroidJSCExecutorFactory(jscConfig->consume()));
  }

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("initHybrid", JSCJavaScriptExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

struct JavaJSExecutor : public JavaClass<JavaJSExecutor> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/JavaJSExecutor;";
};

class ProxyJavaScriptExecutorHolder : public HybridClass<ProxyJavaScriptExecutorHolder,
                                                         JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ProxyJavaScriptExecutor;";

  static local_ref<jhybriddata> initHybrid(
    alias_ref<jclass>, alias_ref<JavaJSExecutor::javaobject> executorInstance) {
    return makeCxxInstance(
      std::make_shared<ProxyExecutorOneTimeFactory>(
        make_global(executorInstance)));
  }

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("initHybrid", ProxyJavaScriptExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

}

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return initialize(vm, [] {
    gloginit::initialize();
    JSCJavaScriptExecutorHolder::registerNatives();
    ProxyJavaScriptExecutorHolder::registerNatives();
    CatalystInstanceImpl::registerNatives();
    CxxModuleWrapperBase::registerNatives();
    CxxModuleWrapper::registerNatives();
    JCxxCallbackImpl::registerNatives();
    NativeArray::registerNatives();
    NativeDeltaClient::registerNatives();
    ReadableNativeArray::registerNatives();
    WritableNativeArray::registerNatives();
    NativeMap::registerNatives();
    ReadableNativeMap::registerNatives();
    WritableNativeMap::registerNatives();
    ReadableNativeMapKeySetIterator::registerNatives();

    #ifdef WITH_INSPECTOR
    JInspector::registerNatives();
    #endif
  });
}

} }

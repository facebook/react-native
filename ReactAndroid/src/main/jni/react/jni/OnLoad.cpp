/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>

#include <glog/logging.h>

#include <fb/glog_init.h>
#include <fb/log.h>
#include <fbjni/fbjni.h>

#include "CatalystInstanceImpl.h"
#include "CxxModuleWrapper.h"
#include "JCallback.h"
#include "JavaScriptExecutorHolder.h"
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

struct JavaJSExecutor : public JavaClass<JavaJSExecutor> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/JavaJSExecutor;";
};

class ProxyJavaScriptExecutorHolder : public HybridClass<
                                          ProxyJavaScriptExecutorHolder,
                                          JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/ProxyJavaScriptExecutor;";

  static local_ref<jhybriddata> initHybrid(
      alias_ref<jclass>,
      alias_ref<JavaJSExecutor::javaobject> executorInstance) {
    return makeCxxInstance(std::make_shared<ProxyExecutorOneTimeFactory>(
        make_global(executorInstance)));
  }

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod(
            "initHybrid", ProxyJavaScriptExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *reserved) {
  return initialize(vm, [] {
    gloginit::initialize();
    FLAGS_minloglevel = 0;
    ProxyJavaScriptExecutorHolder::registerNatives();
    CatalystInstanceImpl::registerNatives();
    CxxModuleWrapperBase::registerNatives();
    CxxModuleWrapper::registerNatives();
    JCxxCallbackImpl::registerNatives();
    NativeArray::registerNatives();
    ReadableNativeArray::registerNatives();
    WritableNativeArray::registerNatives();
    NativeMap::registerNatives();
    ReadableNativeMap::registerNatives();
    WritableNativeMap::registerNatives();

#ifdef WITH_INSPECTOR
    JInspector::registerNatives();
#endif
  });
}

} // namespace react
} // namespace facebook

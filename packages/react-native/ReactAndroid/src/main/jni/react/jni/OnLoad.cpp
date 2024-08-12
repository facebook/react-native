/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>

#include <glog/logging.h>

#include <fb/glog_init.h>
#include <fbjni/fbjni.h>

#include "CatalystInstanceImpl.h"
#include "CxxModuleWrapperBase.h"
#include "JCallback.h"
#include "JDynamicNative.h"
#include "JInspector.h"
#include "JReactMarker.h"
#include "JavaScriptExecutorHolder.h"
#include "ProxyExecutor.h"
#include "ReactInstanceManagerInspectorTarget.h"
#include "WritableNativeArray.h"
#include "WritableNativeMap.h"

#ifndef WITH_GLOGINIT
#define WITH_GLOGINIT 1
#endif

#ifdef WITH_XPLATINIT
#include <fb/xplat_init.h>
#endif

namespace facebook::react {

namespace {

struct JavaJSExecutor : public jni::JavaClass<JavaJSExecutor> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/JavaJSExecutor;";
};

class ProxyJavaScriptExecutorHolder
    : public jni::
          HybridClass<ProxyJavaScriptExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/ProxyJavaScriptExecutor;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      jni::alias_ref<JavaJSExecutor::javaobject> executorInstance) {
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

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
#ifdef WITH_XPLATINIT
  return facebook::xplat::initialize(vm, [] {
#else
  return jni::initialize(vm, [] {
#endif
#if WITH_GLOGINIT
    gloginit::initialize();
    FLAGS_minloglevel = 0;
#endif

    ProxyJavaScriptExecutorHolder::registerNatives();
    CatalystInstanceImpl::registerNatives();
    CxxModuleWrapperBase::registerNatives();
    JCxxCallbackImpl::registerNatives();
    NativeArray::registerNatives();
    ReadableNativeArray::registerNatives();
    WritableNativeArray::registerNatives();
    NativeMap::registerNatives();
    ReadableNativeMap::registerNatives();
    WritableNativeMap::registerNatives();
    JDynamicNative::registerNatives();
    JReactMarker::registerNatives();
    JInspector::registerNatives();
    ReactInstanceManagerInspectorTarget::registerNatives();
  });
}

} // namespace facebook::react

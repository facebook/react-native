// Copyright 2004-present Facebook. All Rights Reserved.

#include <folly/dynamic.h>
#include <fb/fbjni.h>
#include <fb/glog_init.h>
#include <fb/log.h>
#include <cxxreact/Executor.h>
#include <cxxreact/JSCExecutor.h>
#include <cxxreact/Platform.h>
#include <jschelpers/Value.h>
#include "CatalystInstanceImpl.h"
#include "CxxModuleWrapper.h"
#include "JavaScriptExecutorHolder.h"
#include "JSCPerfLogging.h"
#include "ProxyExecutor.h"
#include "JCallback.h"
#include "JSLogging.h"

#ifdef WITH_INSPECTOR
#include "JInspector.h"
#endif

#include "WritableNativeMap.h"
#include "WritableNativeArray.h"

#include <string>

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

class JSCJavaScriptExecutorHolder : public HybridClass<JSCJavaScriptExecutorHolder,
                                                       JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/JSCJavaScriptExecutor;";

  static local_ref<jhybriddata> initHybrid(alias_ref<jclass>, ReadableNativeArray* jscConfigArray) {
    // See JSCJavaScriptExecutor.Factory() for the other side of this hack.
    folly::dynamic jscConfigMap = jscConfigArray->consume()[0];
    return makeCxxInstance(std::make_shared<JSCExecutorFactory>(std::move(jscConfigMap)));
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

class JReactMarker : public JavaClass<JReactMarker> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ReactMarker;";

  static void logMarker(const std::string& marker) {
    static auto cls = javaClassStatic();
    static auto meth = cls->getStaticMethod<void(std::string)>("logMarker");
    meth(cls, marker);
  }

  static void logMarker(const std::string& marker, const std::string& tag) {
    static auto cls = javaClassStatic();
    static auto meth = cls->getStaticMethod<void(std::string, std::string)>("logMarker");
    meth(cls, marker, tag);
  }
};

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
  static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

  // Since SystemClock.uptimeMillis() is commonly used for performance measurement in Java
  // and uptimeMillis() internally uses clock_gettime(CLOCK_MONOTONIC),
  // we use the same API here.
  // We need that to make sure we use the same time system on both JS and Java sides.
  // Links to the source code:
  // https://android.googlesource.com/platform/frameworks/native/+/jb-mr1-release/libs/utils/SystemClock.cpp
  // https://android.googlesource.com/platform/system/core/+/master/libutils/Timers.cpp
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  return Value::makeNumber(ctx, (nano / (double)NANOSECONDS_IN_MILLISECOND));
}

static void logPerfMarker(const ReactMarker::ReactMarkerId markerId, const char* tag) {
  switch (markerId) {
    case ReactMarker::RUN_JS_BUNDLE_START:
      JReactMarker::logMarker("RUN_JS_BUNDLE_START", tag);
      break;
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      JReactMarker::logMarker("RUN_JS_BUNDLE_END");
      break;
    case ReactMarker::CREATE_REACT_CONTEXT_STOP:
      JReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
      break;
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
      JReactMarker::logMarker("loadApplicationScript_startStringConvert");
      break;
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
      JReactMarker::logMarker("loadApplicationScript_endStringConvert");
      break;
    case ReactMarker::NATIVE_REQUIRE_START:
    case ReactMarker::NATIVE_REQUIRE_STOP:
      // These are not used on Android.
      break;
  }
}

}

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return initialize(vm, [] {
    gloginit::initialize();
    // Inject some behavior into react/
    ReactMarker::logTaggedMarker = logPerfMarker;
    PerfLogging::installNativeHooks = addNativePerfLoggingHooks;
    JSNativeHooks::loggingHook = nativeLoggingHook;
    JSNativeHooks::nowHook = nativePerformanceNow;
    JSCJavaScriptExecutorHolder::registerNatives();
    ProxyJavaScriptExecutorHolder::registerNatives();
    CatalystInstanceImpl::registerNatives();
    CxxModuleWrapperBase::registerNatives();
    CxxModuleWrapper::registerNatives();
    JCxxCallbackImpl::registerNatives();
    #ifdef WITH_INSPECTOR
    JInspector::registerNatives();
    #endif

    NativeArray::registerNatives();
    ReadableNativeArray::registerNatives();
    WritableNativeArray::registerNatives();
    NativeMap::registerNatives();
    ReadableNativeMap::registerNatives();
    WritableNativeMap::registerNatives();
    ReadableNativeMapKeySetIterator::registerNatives();
  });
}

}}

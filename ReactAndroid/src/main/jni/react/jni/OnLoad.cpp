// Copyright 2004-present Facebook. All Rights Reserved.

#include <android/asset_manager_jni.h>
#include <android/input.h>
#include <fb/log.h>
#include <fb/glog_init.h>
#include <folly/json.h>
#include <jni/Countable.h>
#include <fb/Environment.h>
#include <fb/fbjni.h>
#include <jni/LocalReference.h>
#include <jni/LocalString.h>
#include <jni/WeakReference.h>
#include <fb/fbjni/Exceptions.h>
#include <react/Bridge.h>
#include <react/Executor.h>
#include <react/JSCExecutor.h>
#include <react/JSModulesUnbundle.h>
#include <react/MethodCall.h>
#include <react/Platform.h>
#include "JExecutorToken.h"
#include "JExecutorTokenFactory.h"
#include "JNativeRunnable.h"
#include "JSLoader.h"
#include "NativeCommon.h"
#include "ReadableNativeArray.h"
#include "ProxyExecutor.h"
#include "OnLoad.h"
#include "JMessageQueueThread.h"
#include "JniJSModulesUnbundle.h"
#include "JSLogging.h"
#include "JSCPerfLogging.h"
#include "WebWorkers.h"
#include "WritableNativeMap.h"
#include <algorithm>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

namespace runnable {

struct NativeRunnable : public Countable {
  std::function<void()> callable;
};

static jclass gNativeRunnableClass;
static jmethodID gNativeRunnableCtor;

static LocalReference<jobject> createNativeRunnable(JNIEnv* env, decltype(NativeRunnable::callable)&& callable) {
  LocalReference<jobject> jRunnable{env->NewObject(gNativeRunnableClass, gNativeRunnableCtor)};
  if (env->ExceptionCheck()) {
    return nullptr;
  }
  auto nativeRunnable = createNew<NativeRunnable>();
  nativeRunnable->callable = std::move(callable);
  setCountableForJava(env, jRunnable.get(), std::move(nativeRunnable));
  return jRunnable;
}

static void run(JNIEnv* env, jobject jNativeRunnable) {
  auto nativeRunnable = extractRefPtr<NativeRunnable>(env, jNativeRunnable);
  nativeRunnable->callable();
}

} // namespace runnable

namespace queue {

static jmethodID gRunOnQueueThreadMethod;

static void enqueueNativeRunnableOnQueue(JNIEnv* env, jobject callbackQueueThread, jobject nativeRunnable) {
  env->CallVoidMethod(callbackQueueThread, gRunOnQueueThreadMethod, nativeRunnable);
}

} // namespace queue

namespace bridge {

static jmethodID gCallbackMethod;
static jmethodID gOnBatchCompleteMethod;
static jmethodID gOnExecutorUnregisteredMethod;
static jmethodID gLogMarkerMethod;

struct CountableBridge : Bridge, Countable {
  using Bridge::Bridge;
};

static void logMarker(const std::string& marker) {
  JNIEnv* env = Environment::current();
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
  jstring jmarker = env->NewStringUTF(marker.c_str());
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, jmarker);
  env->DeleteLocalRef(markerClass);
  env->DeleteLocalRef(jmarker);
}

static void makeJavaCall(JNIEnv* env, ExecutorToken executorToken, jobject callback, const MethodCall& call) {
  if (call.arguments.isNull()) {
    return;
  }

  #ifdef WITH_FBSYSTRACE
  if (call.callId != -1) {
    fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", call.callId);
  }
  #endif

  auto newArray = ReadableNativeArray::newObjectCxxArgs(std::move(call.arguments));
  env->CallVoidMethod(
      callback,
      gCallbackMethod,
      static_cast<JExecutorTokenHolder*>(executorToken.getPlatformExecutorToken().get())->getJobj(),
      call.moduleId,
      call.methodId,
      newArray.get());
}

static void signalBatchComplete(JNIEnv* env, jobject callback) {
  env->CallVoidMethod(callback, gOnBatchCompleteMethod);
}

class PlatformBridgeCallback : public BridgeCallback {
public:
  PlatformBridgeCallback(
      RefPtr<WeakReference> weakCallback_,
      RefPtr<WeakReference> weakCallbackQueueThread_) :
    weakCallback_(std::move(weakCallback_)),
    weakCallbackQueueThread_(std::move(weakCallbackQueueThread_)) {}

  void executeCallbackOnCallbackQueueThread(std::function<void(ResolvedWeakReference&)>&& runnable) {
    auto env = Environment::current();
    if (env->ExceptionCheck()) {
      FBLOGW("Dropped callback because of pending exception");
      return;
    }

    ResolvedWeakReference callbackQueueThread(weakCallbackQueueThread_);
    if (!callbackQueueThread) {
      FBLOGW("Dropped callback because callback queue thread went away");
      return;
    }

    auto runnableWrapper = std::bind([weakCallback=weakCallback_] (std::function<void(ResolvedWeakReference&)>& runnable) {
      auto env = Environment::current();
      if (env->ExceptionCheck()) {
        FBLOGW("Dropped calls because of pending exception");
        return;
      }
      ResolvedWeakReference callback(weakCallback);
      if (callback) {
        runnable(callback);
      }
    }, std::move(runnable));

    auto jNativeRunnable = runnable::createNativeRunnable(env, std::move(runnableWrapper));
    queue::enqueueNativeRunnableOnQueue(env, callbackQueueThread, jNativeRunnable.get());
  }

  virtual void onCallNativeModules(
      ExecutorToken executorToken,
      const std::string& callJSON,
      bool isEndOfBatch) override {
    executeCallbackOnCallbackQueueThread([executorToken, callJSON, isEndOfBatch] (ResolvedWeakReference& callback) {
      JNIEnv* env = Environment::current();
      for (auto& call : react::parseMethodCalls(callJSON)) {
        makeJavaCall(env, executorToken, callback, call);
        if (env->ExceptionCheck()) {
          return;
        }
      }
      if (isEndOfBatch) {
        signalBatchComplete(env, callback);
      }
    });
  }

  virtual void onExecutorUnregistered(ExecutorToken executorToken) override {
    executeCallbackOnCallbackQueueThread([executorToken] (ResolvedWeakReference& callback) {
      JNIEnv *env = Environment::current();
      env->CallVoidMethod(
          callback,
          gOnExecutorUnregisteredMethod,
          static_cast<JExecutorTokenHolder*>(executorToken.getPlatformExecutorToken().get())->getJobj());
    });
  }
private:
  RefPtr<WeakReference> weakCallback_;
  RefPtr<WeakReference> weakCallbackQueueThread_;
};

static void create(JNIEnv* env, jobject obj, jobject executor, jobject callback,
                   jobject callbackQueueThread) {
  auto weakCallback = createNew<WeakReference>(callback);
  auto weakCallbackQueueThread = createNew<WeakReference>(callbackQueueThread);
  auto bridgeCallback = folly::make_unique<PlatformBridgeCallback>(weakCallback, weakCallbackQueueThread);
  auto nativeExecutorFactory = extractRefPtr<CountableJSExecutorFactory>(env, executor);
  auto executorTokenFactory = folly::make_unique<JExecutorTokenFactory>();
  auto bridge = createNew<CountableBridge>(nativeExecutorFactory.get(), std::move(executorTokenFactory), std::move(bridgeCallback));
  setCountableForJava(env, obj, std::move(bridge));
}

static void destroy(JNIEnv* env, jobject jbridge) {
  auto bridge = extractRefPtr<CountableBridge>(env, jbridge);
  try {
    bridge->destroy();
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void loadApplicationScript(
    const RefPtr<CountableBridge>& bridge,
    const std::string& script,
    const std::string& sourceUri) {
  try {
    bridge->loadApplicationScript(script, sourceUri);
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void loadApplicationUnbundle(
    const RefPtr<CountableBridge>& bridge,
    AAssetManager *assetManager,
    const std::string& startupCode,
    const std::string& startupFileName) {
  try {
    bridge->loadApplicationUnbundle(
      std::unique_ptr<JSModulesUnbundle>(
        new JniJSModulesUnbundle(assetManager, startupFileName)),
      startupCode,
      startupFileName);
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void loadScriptFromAssets(JNIEnv* env, jobject obj, jobject assetManager,
                                 jstring assetName) {
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
  auto manager = AAssetManager_fromJava(env, assetManager);
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto assetNameStr = fromJString(env, assetName);

  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromAssets_start"));
  auto script = react::loadScriptFromAssets(manager, assetNameStr);
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_"
    "loadApplicationScript",
    "assetName", assetNameStr);
  #endif

  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromAssets_read"));
  if (JniJSModulesUnbundle::isUnbundle(manager, assetNameStr)) {
    loadApplicationUnbundle(bridge, manager, script, assetNameStr);
  } else {
    loadApplicationScript(bridge, script, "file://" + assetNameStr);
  }
  if (env->ExceptionCheck()) {
    return;
  }
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromAssets_done"));
}

static void loadScriptFromFile(JNIEnv* env, jobject obj, jstring fileName, jstring sourceURL) {
  jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");

  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto fileNameStr = fileName == NULL ? "" : fromJString(env, fileName);
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromFile_start"));
  auto script = fileName == NULL ? "" : react::loadScriptFromFile(fileNameStr);
  #ifdef WITH_FBSYSTRACE
  auto sourceURLStr = sourceURL == NULL ? fileNameStr : fromJString(env, sourceURL);
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_"
    "loadApplicationScript",
    "sourceURL", sourceURLStr);
  #endif
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromFile_read"));
  loadApplicationScript(bridge, script, fromJString(env, sourceURL));
  if (env->ExceptionCheck()) {
    return;
  }
  env->CallStaticVoidMethod(markerClass, gLogMarkerMethod, env->NewStringUTF("loadScriptFromFile_exec"));
}

static void callFunction(JNIEnv* env, jobject obj, JExecutorToken::jhybridobject jExecutorToken, jstring module, jstring method,
                         NativeArray::jhybridobject args, jstring tracingName) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto arguments = cthis(wrap_alias(args));
  try {
    bridge->callFunction(
      cthis(wrap_alias(jExecutorToken))->getExecutorToken(wrap_alias(jExecutorToken)),
      fromJString(env, module),
      fromJString(env, method),
      std::move(arguments->array),
      fromJString(env, tracingName)
    );
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void invokeCallback(JNIEnv* env, jobject obj, JExecutorToken::jhybridobject jExecutorToken, jint callbackId,
                           NativeArray::jhybridobject args) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto arguments = cthis(wrap_alias(args));
  try {
    bridge->invokeCallback(
      cthis(wrap_alias(jExecutorToken))->getExecutorToken(wrap_alias(jExecutorToken)),
      (double) callbackId,
      std::move(arguments->array)
    );
  } catch (...) {
    translatePendingCppExceptionToJavaException();
  }
}

static void setGlobalVariable(JNIEnv* env, jobject obj, jstring propName, jstring jsonValue) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->setGlobalVariable(fromJString(env, propName), fromJString(env, jsonValue));
}

static jlong getJavaScriptContext(JNIEnv *env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  return (uintptr_t) bridge->getJavaScriptContext();
}

static jobject getMainExecutorToken(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  auto token = bridge->getMainExecutorToken();
  return static_cast<JExecutorTokenHolder*>(token.getPlatformExecutorToken().get())->getJobj();
}

static jboolean supportsProfiling(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  return bridge->supportsProfiling() ? JNI_TRUE : JNI_FALSE;
}

static void startProfiler(JNIEnv* env, jobject obj, jstring title) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->startProfiler(fromJString(env, title));
}

static void stopProfiler(JNIEnv* env, jobject obj, jstring title, jstring filename) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->stopProfiler(fromJString(env, title), fromJString(env, filename));
}

static void handleMemoryPressureUiHidden(JNIEnv* env, jobject obj) {
  LOG(WARNING) << "handleMemoryPressureUiHidden";
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->handleMemoryPressureUiHidden();
}

static void handleMemoryPressureModerate(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->handleMemoryPressureModerate();
}

static void handleMemoryPressureCritical(JNIEnv* env, jobject obj) {
  auto bridge = extractRefPtr<CountableBridge>(env, obj);
  bridge->handleMemoryPressureCritical();
}

} // namespace bridge

namespace executors {

static std::string getApplicationDir(const char* methodName) {
  // Get the Application Context object
  auto getApplicationClass = findClassLocal(
                              "com/facebook/react/common/ApplicationHolder");
  auto getApplicationMethod = getApplicationClass->getStaticMethod<jobject()>(
                              "getApplication",
                              "()Landroid/app/Application;"
                              );
  auto application = getApplicationMethod(getApplicationClass);

  // Get getCacheDir() from the context
  auto getDirMethod = findClassLocal("android/app/Application")
                       ->getMethod<jobject()>(methodName,
                                              "()Ljava/io/File;"
                                                  );
  auto dirObj = getDirMethod(application);

  // Call getAbsolutePath() on the returned File object
  auto getAbsolutePathMethod = findClassLocal("java/io/File")
                                ->getMethod<jstring()>("getAbsolutePath");
  return getAbsolutePathMethod(dirObj)->toStdString();
}

static std::string getApplicationCacheDir() {
  return getApplicationDir("getCacheDir");
}

static std::string getApplicationPersistentDir() {
  return getApplicationDir("getFilesDir");
}

struct CountableJSCExecutorFactory : CountableJSExecutorFactory  {
public:
  CountableJSCExecutorFactory(folly::dynamic jscConfig) : m_jscConfig(jscConfig) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(Bridge *bridge) override {
    m_jscConfig["PersistentDirectory"] = getApplicationPersistentDir();
    return JSCExecutorFactory(getApplicationCacheDir(), m_jscConfig).createJSExecutor(bridge);
  }

private:
  folly::dynamic m_jscConfig;
};

static void createJSCExecutor(alias_ref<jobject> obj, WritableNativeMap* jscConfig) {
  auto executor = createNew<CountableJSCExecutorFactory>(jscConfig->consume());
  setCountableForJava(Environment::current(), obj.get(), std::move(executor));
}

static void createProxyExecutor(JNIEnv *env, jobject obj, jobject executorInstance) {
  auto executor =
    createNew<ProxyExecutorOneTimeFactory>(make_global(adopt_local(executorInstance)));
  setCountableForJava(env, obj, std::move(executor));
}

} // namespace executors

}

jmethodID getLogMarkerMethod() {
  return bridge::gLogMarkerMethod;
}

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return initialize(vm, [] {
    facebook::gloginit::initialize();
    // Inject some behavior into react/
    ReactMarker::logMarker = bridge::logMarker;
    WebWorkerUtil::createWebWorkerThread = WebWorkers::createWebWorkerThread;
    WebWorkerUtil::loadScriptFromAssets =
      [] (const std::string& assetName) {
        return loadScriptFromAssets(assetName);
      };
    WebWorkerUtil::loadScriptFromNetworkSync = WebWorkers::loadScriptFromNetworkSync;
    MessageQueues::getCurrentMessageQueueThread =
      [] {
        return std::unique_ptr<MessageQueueThread>(
            JMessageQueueThread::currentMessageQueueThread().release());
      };
    PerfLogging::installNativeHooks = addNativePerfLoggingHooks;
    JSLogging::nativeHook = nativeLoggingHook;

    NativeArray::registerNatives();
    ReadableNativeArray::registerNatives();
    WritableNativeArray::registerNatives();
    JNativeRunnable::registerNatives();
    registerJSLoaderNatives();

    NativeMap::registerNatives();
    ReadableNativeMap::registerNatives();
    WritableNativeMap::registerNatives();
    ReadableNativeMapKeySetIterator::registerNatives();

    registerNatives("com/facebook/react/bridge/JSCJavaScriptExecutor", {
      makeNativeMethod("initialize", executors::createJSCExecutor),
    });

    registerNatives("com/facebook/react/bridge/ProxyJavaScriptExecutor", {
        makeNativeMethod(
          "initialize", "(Lcom/facebook/react/bridge/JavaJSExecutor;)V",
          executors::createProxyExecutor),
    });

    // get the current env
    JNIEnv* env = Environment::current();

    jclass callbackClass = env->FindClass("com/facebook/react/bridge/ReactCallback");
    bridge::gCallbackMethod = env->GetMethodID(callbackClass, "call", "(Lcom/facebook/react/bridge/ExecutorToken;IILcom/facebook/react/bridge/ReadableNativeArray;)V");
    bridge::gOnBatchCompleteMethod = env->GetMethodID(callbackClass, "onBatchComplete", "()V");
    bridge::gOnExecutorUnregisteredMethod = env->GetMethodID(callbackClass, "onExecutorUnregistered", "(Lcom/facebook/react/bridge/ExecutorToken;)V");

    jclass markerClass = env->FindClass("com/facebook/react/bridge/ReactMarker");
    bridge::gLogMarkerMethod = env->GetStaticMethodID(markerClass, "logMarker", "(Ljava/lang/String;)V");

    registerNatives("com/facebook/react/bridge/ReactBridge", {
        makeNativeMethod("initialize", "(Lcom/facebook/react/bridge/JavaScriptExecutor;Lcom/facebook/react/bridge/ReactCallback;Lcom/facebook/react/bridge/queue/MessageQueueThread;)V", bridge::create),
        makeNativeMethod("destroy", bridge::destroy),
        makeNativeMethod(
          "loadScriptFromAssets", "(Landroid/content/res/AssetManager;Ljava/lang/String;)V",
          bridge::loadScriptFromAssets),
        makeNativeMethod("loadScriptFromFile", bridge::loadScriptFromFile),
        makeNativeMethod("callFunction", bridge::callFunction),
        makeNativeMethod("invokeCallback", bridge::invokeCallback),
        makeNativeMethod("setGlobalVariable", bridge::setGlobalVariable),
        makeNativeMethod("getMainExecutorToken", "()Lcom/facebook/react/bridge/ExecutorToken;", bridge::getMainExecutorToken),
        makeNativeMethod("supportsProfiling", bridge::supportsProfiling),
        makeNativeMethod("startProfiler", bridge::startProfiler),
        makeNativeMethod("stopProfiler", bridge::stopProfiler),
        makeNativeMethod("handleMemoryPressureUiHidden", bridge::handleMemoryPressureUiHidden),
        makeNativeMethod("handleMemoryPressureModerate", bridge::handleMemoryPressureModerate),
        makeNativeMethod("handleMemoryPressureCritical", bridge::handleMemoryPressureCritical),
        makeNativeMethod("getJavaScriptContextNativePtrExperimental", bridge::getJavaScriptContext),
    });

    jclass nativeRunnableClass = env->FindClass("com/facebook/react/bridge/queue/NativeRunnableDeprecated");
    runnable::gNativeRunnableClass = (jclass)env->NewGlobalRef(nativeRunnableClass);
    runnable::gNativeRunnableCtor = env->GetMethodID(nativeRunnableClass, "<init>", "()V");
    wrap_alias(nativeRunnableClass)->registerNatives({
        makeNativeMethod("run", runnable::run),
    });

    jclass messageQueueThreadClass =
      env->FindClass("com/facebook/react/bridge/queue/MessageQueueThread");
    queue::gRunOnQueueThreadMethod =
      env->GetMethodID(messageQueueThreadClass, "runOnQueue", "(Ljava/lang/Runnable;)V");
  });
}

} }

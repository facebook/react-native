// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCExecutor.h"

#include <algorithm>
#include <condition_variable>
#include <mutex>
#include <sstream>
#include <string>
#include <glog/logging.h>
#include <folly/json.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/Conv.h>
#include <sys/time.h>

#include "FollySupport.h"
#include "JSCHelpers.h"
#include "Platform.h"
#include "SystraceSection.h"
#include "Value.h"

#if defined(WITH_JSC_EXTRA_TRACING) || DEBUG
#include "JSCTracing.h"
#endif

#ifdef WITH_JSC_EXTRA_TRACING
#include "JSCLegacyProfiler.h"
#include "JSCLegacyTracing.h"
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

#ifdef WITH_JSC_MEMORY_PRESSURE
#include <jsc_memory.h>
#endif

#ifdef WITH_FB_MEMORY_PROFILING
#include "JSCMemory.h"
#endif

#ifdef WITH_FB_JSC_TUNING
#include <jsc_config_android.h>
#endif

#ifdef JSC_HAS_PERF_STATS_API
#include "JSCPerfStats.h"
#endif

namespace facebook {
namespace react {

namespace {

template<JSValueRef (JSCExecutor::*method)(size_t, const JSValueRef[])>
inline JSObjectCallAsFunctionCallback exceptionWrapMethod() {
  struct funcWrapper {
    static JSValueRef call(
        JSContextRef ctx,
        JSObjectRef function,
        JSObjectRef thisObject,
        size_t argumentCount,
        const JSValueRef arguments[],
        JSValueRef *exception) {
      try {
        auto globalObj = JSContextGetGlobalObject(ctx);
        auto executor = static_cast<JSCExecutor*>(JSObjectGetPrivate(globalObj));
        return (executor->*method)(argumentCount, arguments);
      } catch (...) {
        try {
          auto functionName = Object(ctx, function).getProperty("name").toString().str();
          *exception = translatePendingCppExceptionToJSError(ctx, functionName.c_str());
        } catch (...) {
          *exception = makeJSError(ctx, "Failed to get function name while handling exception");
        }
        return JSValueMakeUndefined(ctx);
      }
    }
  };

  return &funcWrapper::call;
}

}

static JSValueRef nativeInjectHMRUpdate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);

static std::string executeJSCallWithJSC(
    JSGlobalContextRef ctx,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) throw(JSException) {
  SystraceSection s("JSCExecutor.executeJSCall",
                    "method", methodName);

  // Evaluate script with JSC
  folly::dynamic jsonArgs(arguments.begin(), arguments.end());
  auto js = folly::to<folly::fbstring>(
      "__fbBatchedBridge.", methodName, ".apply(null, ",
      folly::toJson(jsonArgs), ")");
  auto result = evaluateScript(ctx, String(js.c_str()), nullptr);
  return Value(ctx, result).toJSONString();
}

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate, std::shared_ptr<MessageQueueThread> jsQueue) {
  return std::unique_ptr<JSExecutor>(
    new JSCExecutor(delegate, jsQueue, m_cacheDir, m_jscConfig));
}

JSCExecutor::JSCExecutor(std::shared_ptr<ExecutorDelegate> delegate,
                         std::shared_ptr<MessageQueueThread> messageQueueThread,
                         const std::string& cacheDir,
                         const folly::dynamic& jscConfig) throw(JSException) :
    m_delegate(delegate),
    m_deviceCacheDir(cacheDir),
    m_messageQueueThread(messageQueueThread),
    m_jscConfig(jscConfig) {
  initOnJSVMThread();

  SystraceSection s("setBatchedBridgeConfig");

  folly::dynamic nativeModuleConfig = folly::dynamic::array();

  {
    SystraceSection s("collectNativeModuleNames");
    std::vector<std::string> names = delegate->moduleNames();
    for (auto& name : delegate->moduleNames()) {
      nativeModuleConfig.push_back(folly::dynamic::array(std::move(name)));
    }
  }

  folly::dynamic config =
    folly::dynamic::object("remoteModuleConfig", std::move(nativeModuleConfig));

  SystraceSection t("setGlobalVariable");
  setGlobalVariable(
    "__fbBatchedBridgeConfig",
    folly::make_unique<JSBigStdString>(detail::toStdString(folly::toJson(config))));
}

JSCExecutor::JSCExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> messageQueueThread,
    int workerId,
    JSCExecutor *owner,
    std::string scriptURL,
    std::unordered_map<std::string, std::string> globalObjAsJSON,
    const folly::dynamic& jscConfig) :
    m_delegate(delegate),
    m_workerId(workerId),
    m_owner(owner),
    m_deviceCacheDir(owner->m_deviceCacheDir),
    m_messageQueueThread(messageQueueThread),
    m_jscConfig(jscConfig) {
  // We post initOnJSVMThread here so that the owner doesn't have to wait for
  // initialization on its own thread
  m_messageQueueThread->runOnQueue([this, scriptURL,
                                    globalObjAsJSON=std::move(globalObjAsJSON)] () {
    initOnJSVMThread();

    installNativeHook<&JSCExecutor::nativePostMessage>("postMessage");

    for (auto& it : globalObjAsJSON) {
      setGlobalVariable(std::move(it.first),
                        folly::make_unique<JSBigStdString>(std::move(it.second)));
    }

    // Try to load the script from the network if script is a URL
    // NB: For security, this will only work in debug builds
    std::unique_ptr<const JSBigString> script;
    if (scriptURL.find("http://") == 0 || scriptURL.find("https://") == 0) {
      std::stringstream outfileBuilder;
      outfileBuilder << m_deviceCacheDir << "/workerScript" << m_workerId << ".js";
      script = folly::make_unique<JSBigStdString>(
        WebWorkerUtil::loadScriptFromNetworkSync(scriptURL, outfileBuilder.str()));
    } else {
      // TODO(9604438): Protect against script does not exist
      script = WebWorkerUtil::loadScriptFromAssets(scriptURL);
    }

    // TODO(9994180): Throw on error
    loadApplicationScript(std::move(script), std::move(scriptURL));
  });
}

JSCExecutor::~JSCExecutor() {
  CHECK(*m_isDestroyed) << "JSCExecutor::destroy() must be called before its destructor!";
}

void JSCExecutor::destroy() {
  *m_isDestroyed = true;
  m_messageQueueThread->runOnQueueSync([this] () {
    terminateOnJSVMThread();
  });
}

void JSCExecutor::initOnJSVMThread() throw(JSException) {
  SystraceSection s("JSCExecutor.initOnJSVMThread");

  #if defined(WITH_FB_JSC_TUNING)
  configureJSCForAndroid(m_jscConfig);
  #endif

  JSClassRef globalClass = nullptr;
  {
    SystraceSection s("JSClassCreate");
    globalClass = JSClassCreate(&kJSClassDefinitionEmpty);
  }
  {
    SystraceSection s("JSGlobalContextCreateInGroup");
    m_context = JSGlobalContextCreateInGroup(nullptr, globalClass);
  }
  JSClassRelease(globalClass);

  // Add a pointer to ourselves so we can retrieve it later in our hooks
  JSObjectSetPrivate(JSContextGetGlobalObject(m_context), this);

  installNativeHook<&JSCExecutor::nativeRequireModuleConfig>("nativeRequireModuleConfig");
  installNativeHook<&JSCExecutor::nativeFlushQueueImmediate>("nativeFlushQueueImmediate");
  installNativeHook<&JSCExecutor::nativeStartWorker>("nativeStartWorker");
  installNativeHook<&JSCExecutor::nativePostMessageToWorker>("nativePostMessageToWorker");
  installNativeHook<&JSCExecutor::nativeTerminateWorker>("nativeTerminateWorker");
  installGlobalFunction(m_context, "nativeInjectHMRUpdate", nativeInjectHMRUpdate);
  installNativeHook<&JSCExecutor::nativeCallSyncHook>("nativeCallSyncHook");

  installGlobalFunction(m_context, "nativeLoggingHook", JSNativeHooks::loggingHook);
  installGlobalFunction(m_context, "nativePerformanceNow", JSNativeHooks::nowHook);

  #if defined(WITH_JSC_EXTRA_TRACING) || DEBUG
  addNativeTracingHooks(m_context);
  #endif

  #ifdef WITH_JSC_EXTRA_TRACING
  addNativeProfilingHooks(m_context);
  addNativeTracingLegacyHooks(m_context);
  PerfLogging::installNativeHooks(m_context);
  #endif

  #ifdef WITH_FB_MEMORY_PROFILING
  addNativeMemoryHooks(m_context);
  #endif

  #ifdef JSC_HAS_PERF_STATS_API
  addJSCPerfStatsHooks(m_context);
  #endif

  #if defined(WITH_FB_JSC_TUNING)
  configureJSContextForAndroid(m_context, m_jscConfig, m_deviceCacheDir);
  #endif
}

void JSCExecutor::terminateOnJSVMThread() {
  // terminateOwnedWebWorker mutates m_ownedWorkers so collect all the workers
  // to terminate first
  std::vector<int> workerIds;
  for (auto& it : m_ownedWorkers) {
    workerIds.push_back(it.first);
  }
  for (int workerId : workerIds) {
    terminateOwnedWebWorker(workerId);
  }

  JSGlobalContextRelease(m_context);
  m_context = nullptr;
}

void JSCExecutor::loadApplicationScript(std::unique_ptr<const JSBigString> script, std::string sourceURL) throw(JSException) {
  SystraceSection s("JSCExecutor::loadApplicationScript",
                    "sourceURL", sourceURL);

  #ifdef WITH_FBSYSTRACE
  fbsystrace_begin_section(
    TRACE_TAG_REACT_CXX_BRIDGE,
    "JSCExecutor::loadApplicationScript-createExpectingAscii");
  #endif

  ReactMarker::logMarker("loadApplicationScript_startStringConvert");
  String jsScript = jsStringFromBigString(*script);
  ReactMarker::logMarker("loadApplicationScript_endStringConvert");

  #ifdef WITH_FBSYSTRACE
  fbsystrace_end_section(TRACE_TAG_REACT_CXX_BRIDGE);
  #endif

  String jsSourceURL(sourceURL.c_str());
  evaluateScript(m_context, jsScript, jsSourceURL);
  flush();
  ReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
}

void JSCExecutor::setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle> unbundle) {
  if (!m_unbundle) {
    installNativeHook<&JSCExecutor::nativeRequire>("nativeRequire");
  }
  m_unbundle = std::move(unbundle);
}

void JSCExecutor::flush() throw(JSException) {
  // TODO: Make this a first class function instead of evaling. #9317773
  std::string calls = executeJSCallWithJSC(m_context, "flushedQueue", std::vector<folly::dynamic>());
  m_delegate->callNativeModules(*this, std::move(calls), true);
}

void JSCExecutor::callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) throw(JSException) {
  // TODO:  Make this a first class function instead of evaling. #9317773
  // TODO(cjhopman): This copies args.
  std::vector<folly::dynamic> call{
    moduleId,
    methodId,
    std::move(arguments),
  };
  std::string calls = executeJSCallWithJSC(m_context, "callFunctionReturnFlushedQueue", std::move(call));
  m_delegate->callNativeModules(*this, std::move(calls), true);
}

void JSCExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) throw(JSException) {
  // TODO: Make this a first class function instead of evaling. #9317773
  // TODO(cjhopman): This copies args.
  std::vector<folly::dynamic> call{
    (double) callbackId,
    std::move(arguments)
  };
  std::string calls = executeJSCallWithJSC(m_context, "invokeCallbackAndReturnFlushedQueue", std::move(call));
  m_delegate->callNativeModules(*this, std::move(calls), true);
}

void JSCExecutor::setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue) throw(JSException) {
  SystraceSection s("JSCExecutor.setGlobalVariable",
                    "propName", propName);

  auto globalObject = JSContextGetGlobalObject(m_context);
  String jsPropertyName(propName.c_str());

  String jsValueJSON = jsStringFromBigString(*jsonValue);
  auto valueToInject = JSValueMakeFromJSONString(m_context, jsValueJSON);

  JSObjectSetProperty(m_context, globalObject, jsPropertyName, valueToInject, 0, NULL);
}

void* JSCExecutor::getJavaScriptContext() {
  return m_context;
}

bool JSCExecutor::supportsProfiling() {
  #ifdef WITH_FBSYSTRACE
  return true;
  #else
  return false;
  #endif
}

void JSCExecutor::startProfiler(const std::string &titleString) {
  #ifdef WITH_JSC_EXTRA_TRACING
  JSStringRef title = JSStringCreateWithUTF8CString(titleString.c_str());
  #if WITH_REACT_INTERNAL_SETTINGS
  JSStartProfiling(m_context, title, false);
  #else
  JSStartProfiling(m_context, title);
  #endif
  JSStringRelease(title);
  #endif
}

void JSCExecutor::stopProfiler(const std::string &titleString, const std::string& filename) {
  #ifdef WITH_JSC_EXTRA_TRACING
  JSStringRef title = JSStringCreateWithUTF8CString(titleString.c_str());
  facebook::react::stopAndOutputProfilingFile(m_context, title, filename.c_str());
  JSStringRelease(title);
  #endif
}

void JSCExecutor::handleMemoryPressureUiHidden() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::UI_HIDDEN);
  #endif
}

void JSCExecutor::handleMemoryPressureModerate() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::MODERATE);
  #endif
}

void JSCExecutor::handleMemoryPressureCritical() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::CRITICAL);
  #endif
}

void JSCExecutor::flushQueueImmediate(std::string queueJSON) {
  m_delegate->callNativeModules(*this, std::move(queueJSON), false);
}

void JSCExecutor::loadModule(uint32_t moduleId) {
  auto module = m_unbundle->getModule(moduleId);
  auto sourceUrl = String::createExpectingAscii(module.name);
  auto source = String::createExpectingAscii(module.code);
  evaluateScript(m_context, source, sourceUrl);
}

int JSCExecutor::addWebWorker(
    std::string scriptURL,
    JSValueRef workerRef,
    JSValueRef globalObjRef) {
  static std::atomic_int nextWorkerId(1);
  int workerId = nextWorkerId++;

  Object globalObj = Value(m_context, globalObjRef).asObject();

  auto workerJscConfig = m_jscConfig;
  workerJscConfig["isWebWorker"] = true;

  std::shared_ptr<MessageQueueThread> workerMQT =
    WebWorkerUtil::createWebWorkerThread(workerId, m_messageQueueThread.get());
  std::unique_ptr<JSCExecutor> worker;
  workerMQT->runOnQueueSync([this, &worker, &workerMQT, &scriptURL, &globalObj, workerId, &workerJscConfig] () {
    worker.reset(new JSCExecutor(m_delegate, workerMQT, workerId, this, std::move(scriptURL),
                                 globalObj.toJSONMap(), workerJscConfig));
  });

  Object workerObj = Value(m_context, workerRef).asObject();
  workerObj.makeProtected();

  JSCExecutor *workerPtr = worker.get();
  std::shared_ptr<MessageQueueThread> sharedMessageQueueThread = worker->m_messageQueueThread;
  m_delegate->registerExecutor(
      std::move(worker),
      std::move(sharedMessageQueueThread));

  m_ownedWorkers.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(workerId),
      std::forward_as_tuple(workerPtr, std::move(workerObj)));

  return workerId;
}

void JSCExecutor::postMessageToOwnedWebWorker(int workerId, JSValueRef message) {
  auto worker = m_ownedWorkers.at(workerId).executor;
  std::string msgString = Value(m_context, message).toJSONString();

  std::shared_ptr<bool> isWorkerDestroyed = worker->m_isDestroyed;
  worker->m_messageQueueThread->runOnQueue([isWorkerDestroyed, worker, msgString] () {
    if (*isWorkerDestroyed) {
      return;
    }
    worker->receiveMessageFromOwner(msgString);
  });
}

void JSCExecutor::postMessageToOwner(JSValueRef msg) {
  std::string msgString = Value(m_context, msg).toJSONString();
  std::shared_ptr<bool> ownerIsDestroyed = m_owner->m_isDestroyed;
  m_owner->m_messageQueueThread->runOnQueue([workerId=m_workerId, owner=m_owner, ownerIsDestroyed, msgString] () {
    if (*ownerIsDestroyed) {
      return;
    }
    owner->receiveMessageFromOwnedWebWorker(workerId, msgString);
  });
}

void JSCExecutor::receiveMessageFromOwnedWebWorker(int workerId, const std::string& json) {
  Object* workerObj;
  try {
    workerObj = &m_ownedWorkers.at(workerId).jsObj;
  } catch (std::out_of_range& e) {
    // Worker was already terminated
    return;
  }

  Value onmessageValue = workerObj->getProperty("onmessage");
  if (onmessageValue.isUndefined()) {
    return;
  }

  JSValueRef args[] = { createMessageObject(json) };
  onmessageValue.asObject().callAsFunction(1, args);

  flush();
}

void JSCExecutor::receiveMessageFromOwner(const std::string& msgString) {
  CHECK(m_owner) << "Received message in a Executor that doesn't have an owner!";

  JSValueRef args[] = { createMessageObject(msgString) };
  Value onmessageValue = Object::getGlobalObject(m_context).getProperty("onmessage");
  onmessageValue.asObject().callAsFunction(1, args);
}

void JSCExecutor::terminateOwnedWebWorker(int workerId) {
  auto& workerRegistration = m_ownedWorkers.at(workerId);
  std::shared_ptr<MessageQueueThread> workerMQT = workerRegistration.executor->m_messageQueueThread;
  m_ownedWorkers.erase(workerId);

  workerMQT->runOnQueueSync([this, &workerMQT] {
    workerMQT->quitSynchronous();
    std::unique_ptr<JSExecutor> worker = m_delegate->unregisterExecutor(*this);
    worker->destroy();
    worker.reset();
  });
}

Object JSCExecutor::createMessageObject(const std::string& msgJson) {
  Value rebornJSMsg = Value::fromJSON(m_context, String(msgJson.c_str()));
  Object messageObject = Object::create(m_context);
  messageObject.setProperty("data", rebornJSMsg);
  return messageObject;
}

// Native JS hooks
template<JSValueRef (JSCExecutor::*method)(size_t, const JSValueRef[])>
void JSCExecutor::installNativeHook(const char* name) {
  installGlobalFunction(m_context, name, exceptionWrapMethod<method>());
}

JSValueRef JSCExecutor::nativePostMessage(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }
  JSValueRef msg = arguments[0];
  postMessageToOwner(msg);

  return JSValueMakeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeRequire(
  size_t argumentCount,
  const JSValueRef arguments[]) {

  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }

  double moduleId = Value(m_context, arguments[0]).asNumber();
  if (moduleId <= (double) std::numeric_limits<uint32_t>::max() && moduleId >= 0.0) {
    try {
      loadModule(moduleId);
    } catch (const std::exception&) {
      throw std::invalid_argument(folly::to<std::string>("Received invalid module ID: ", moduleId));
    }
  } else {
    throw std::invalid_argument(folly::to<std::string>("Received invalid module ID: ", moduleId));
  }
  return JSValueMakeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeRequireModuleConfig(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }

  std::string moduleName = Value(m_context, arguments[0]).toString().str();
  folly::dynamic config = m_delegate->getModuleConfig(moduleName);
  return JSValueMakeString(m_context, String(folly::toJson(config).c_str()));
}

JSValueRef JSCExecutor::nativeFlushQueueImmediate(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }

  std::string resStr = Value(m_context, arguments[0]).toJSONString();
  flushQueueImmediate(std::move(resStr));
  return JSValueMakeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeStartWorker(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 3) {
    throw std::invalid_argument("Got wrong number of args");
  }

  std::string scriptFile = Value(m_context, arguments[0]).toString().str();

  JSValueRef worker = arguments[1];
  JSValueRef globalObj = arguments[2];

  int workerId = addWebWorker(scriptFile, worker, globalObj);

  return JSValueMakeNumber(m_context, workerId);
}

JSValueRef JSCExecutor::nativePostMessageToWorker(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 2) {
    throw std::invalid_argument("Got wrong number of args");
  }

  double workerDouble = Value(m_context, arguments[0]).asNumber();
  if (workerDouble != workerDouble) {
    throw std::invalid_argument("Got invalid worker id");
  }

  postMessageToOwnedWebWorker((int) workerDouble, arguments[1]);

  return JSValueMakeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeTerminateWorker(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }

  double workerDouble = Value(m_context, arguments[0]).asNumber();
  if (workerDouble != workerDouble) {
    std::invalid_argument("Got invalid worker id");
  }

  terminateOwnedWebWorker((int) workerDouble);

  return JSValueMakeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeCallSyncHook(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 3) {
    throw std::invalid_argument("Got wrong number of args");
  }

  unsigned int moduleId = Value(m_context, arguments[0]).asUnsignedInteger();
  unsigned int methodId = Value(m_context, arguments[1]).asUnsignedInteger();
  std::string argsJson = Value(m_context, arguments[2]).toJSONString();

  MethodCallResult result = m_delegate->callSerializableNativeHook(
      *this,
      moduleId,
      methodId,
      argsJson);
  if (result.isUndefined) {
    return JSValueMakeUndefined(m_context);
  }
  return Value::fromJSON(m_context, String(folly::toJson(result.result).c_str()));
}

static JSValueRef nativeInjectHMRUpdate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  String execJSString = Value(ctx, arguments[0]).toString();
  String jsURL = Value(ctx, arguments[1]).toString();
  evaluateScript(ctx, execJSString, jsURL);
  return JSValueMakeUndefined(ctx);
}

} }

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
#include <sys/time.h>

#include "Bridge.h"
#include "JSCHelpers.h"
#include "Platform.h"
#include "Value.h"

#ifdef WITH_JSC_EXTRA_TRACING
#include "JSCTracing.h"
#include "JSCLegacyProfiler.h"
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

#ifdef WITH_JSC_MEMORY_PRESSURE
#include <jsc_memory.h>
#endif

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
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

static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

namespace facebook {
namespace react {

static std::unordered_map<JSContextRef, JSCExecutor*> s_globalContextRefToJSCExecutor;

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);
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
    const std::vector<folly::dynamic>& arguments) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(
      TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor.executeJSCall",
      "method", methodName);
  #endif

  // Evaluate script with JSC
  folly::dynamic jsonArgs(arguments.begin(), arguments.end());
  auto js = folly::to<folly::fbstring>(
      "__fbBatchedBridge.", methodName, ".apply(null, ",
      folly::toJson(jsonArgs), ")");
  auto result = evaluateScript(ctx, String(js.c_str()), nullptr);
  return Value(ctx, result).toJSONString();
}

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(Bridge *bridge) {
  return std::unique_ptr<JSExecutor>(new JSCExecutor(bridge, cacheDir_, m_jscConfig));
}

JSCExecutor::JSCExecutor(Bridge *bridge, const std::string& cacheDir, const folly::dynamic& jscConfig) :
    m_bridge(bridge),
    m_deviceCacheDir(cacheDir),
    m_messageQueueThread(MessageQueues::getCurrentMessageQueueThread()),
    m_jscConfig(jscConfig) {
  initOnJSVMThread();
}

JSCExecutor::JSCExecutor(
    Bridge *bridge,
    int workerId,
    JSCExecutor *owner,
    const std::string& script,
    const std::unordered_map<std::string, std::string>& globalObjAsJSON,
    const folly::dynamic& jscConfig) :
    m_bridge(bridge),
    m_workerId(workerId),
    m_owner(owner),
    m_deviceCacheDir(owner->m_deviceCacheDir),
    m_messageQueueThread(MessageQueues::getCurrentMessageQueueThread()),
    m_jscConfig(jscConfig) {
  // We post initOnJSVMThread here so that the owner doesn't have to wait for
  // initialization on its own thread
  m_messageQueueThread->runOnQueue([this, script, globalObjAsJSON] () {
    initOnJSVMThread();

    installGlobalFunction(m_context, "postMessage", nativePostMessage);

    for (auto& it : globalObjAsJSON) {
      setGlobalVariable(it.first, it.second);
    }

    // Try to load the script from the network if script is a URL
    // NB: For security, this will only work in debug builds
    std::string scriptSrc;
    if (script.find("http://") == 0 || script.find("https://") == 0) {
      std::stringstream outfileBuilder;
      outfileBuilder << m_deviceCacheDir << "/workerScript" << m_workerId << ".js";
      scriptSrc = WebWorkerUtil::loadScriptFromNetworkSync(script, outfileBuilder.str());
    } else {
      // TODO(9604438): Protect against script does not exist
      scriptSrc = WebWorkerUtil::loadScriptFromAssets(script);
    }

    // TODO(9994180): Throw on error
    loadApplicationScript(scriptSrc, script);
  });
}

JSCExecutor::~JSCExecutor() {
  CHECK(*m_isDestroyed) << "JSCExecutor::destroy() must be called before its destructor!";
}

void JSCExecutor::destroy() {
  *m_isDestroyed = true;
  if (m_messageQueueThread->isOnThread()) {
    terminateOnJSVMThread();
  } else {
    m_messageQueueThread->runOnQueueSync([this] () {
      terminateOnJSVMThread();
    });
  }
}

void JSCExecutor::initOnJSVMThread() {
  #if defined(WITH_FB_JSC_TUNING) && !defined(WITH_JSC_INTERNAL)
  configureJSCForAndroid(m_jscConfig);
  #endif
  m_context = JSGlobalContextCreateInGroup(nullptr, nullptr);
  s_globalContextRefToJSCExecutor[m_context] = this;
  installGlobalFunction(m_context, "nativeFlushQueueImmediate", nativeFlushQueueImmediate);
  installGlobalFunction(m_context, "nativePerformanceNow", nativePerformanceNow);
  installGlobalFunction(m_context, "nativeStartWorker", nativeStartWorker);
  installGlobalFunction(m_context, "nativePostMessageToWorker", nativePostMessageToWorker);
  installGlobalFunction(m_context, "nativeTerminateWorker", nativeTerminateWorker);
  installGlobalFunction(m_context, "nativeInjectHMRUpdate", nativeInjectHMRUpdate);

  installGlobalFunction(m_context, "nativeLoggingHook", JSLogging::nativeHook);

  #if defined(WITH_JSC_INTERNAL) && defined(WITH_FB_JSC_TUNING)
  configureJSCForAndroid();
  #endif

  #ifdef WITH_JSC_EXTRA_TRACING
  addNativeTracingHooks(m_context);
  addNativeProfilingHooks(m_context);
  PerfLogging::installNativeHooks(m_context);
  #endif

  #ifdef WITH_FB_MEMORY_PROFILING
  addNativeMemoryHooks(m_context);
  #endif

  #ifdef JSC_HAS_PERF_STATS_API
  addJSCPerfStatsHooks(m_context);
  #endif

  #if defined(WITH_FB_JSC_TUNING) && !defined(WITH_JSC_INTERNAL)
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

  m_batchedBridge.reset();
  m_flushedQueueObj.reset();

  s_globalContextRefToJSCExecutor.erase(m_context);
  JSGlobalContextRelease(m_context);
  m_context = nullptr;
}

// Checks if the user is in the pre-parsing cache & StringRef QE.
// Should be removed when these features are no longer gated.
bool JSCExecutor::usePreparsingAndStringRef(){
  return m_jscConfig.getDefault("PreparsingStringRef", true).getBool();
}

void JSCExecutor::loadApplicationScript(
    const std::string& script,
    const std::string& sourceURL) {
  ReactMarker::logMarker("loadApplicationScript_startStringConvert");
#if WITH_FBJSCEXTENSIONS
  JSStringRef jsScriptRef;
  if (usePreparsingAndStringRef()){
    jsScriptRef = JSStringCreateWithUTF8CStringExpectAscii(script.c_str(), script.size());
  } else {
    jsScriptRef = JSStringCreateWithUTF8CString(script.c_str());
  }

  String jsScript = String::adopt(jsScriptRef);
#else
  String jsScript = String::createExpectingAscii(script);
#endif

  ReactMarker::logMarker("loadApplicationScript_endStringConvert");

  String jsSourceURL(sourceURL.c_str());
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor::loadApplicationScript",
    "sourceURL", sourceURL);
  #endif
  evaluateScript(m_context, jsScript, jsSourceURL);
  flush();
  ReactMarker::logMarker("RUN_JS_BUNDLE_END");
  ReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
}

void JSCExecutor::loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) {
  if (!m_unbundle) {
    installGlobalFunction(m_context, "nativeRequire", nativeRequire);
  }
  m_unbundle = std::move(unbundle);
  loadApplicationScript(startupCode, sourceURL);
}

bool JSCExecutor::ensureBatchedBridgeObject() {
  if (m_batchedBridge) {
    return true;
  }

  Value batchedBridgeValue = Object::getGlobalObject(m_context).getProperty("__fbBatchedBridge");
  if (batchedBridgeValue.isUndefined()) {
    return false;
  }
  m_batchedBridge = folly::make_unique<Object>(batchedBridgeValue.asObject());
  m_flushedQueueObj = folly::make_unique<Object>(m_batchedBridge->getProperty("flushedQueue").asObject());
  return true;
}

void JSCExecutor::flush() {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(
      TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor.flush");
  #endif

  if (!ensureBatchedBridgeObject()) {
    throwJSExecutionException(
        "Couldn't get the native call queue: bridge configuration isn't available. This shouldn't be possible. Congratulations.");
  }

  std::string calls = m_flushedQueueObj->callAsFunction().toJSONString();
  m_bridge->callNativeModules(*this, calls, true);
}

void JSCExecutor::callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) {
  if (!ensureBatchedBridgeObject()) {
    throwJSExecutionException(
        "Couldn't call JS module %s, method %s: bridge configuration isn't available. This "
        "probably means you're calling a JS module method before bridge setup has completed or without a JS bundle loaded.",
        moduleId.c_str(),
        methodId.c_str());
  }

  std::vector<folly::dynamic> call {
      moduleId,
      methodId,
      std::move(arguments),
  };
  std::string calls = executeJSCallWithJSC(m_context, "callFunctionReturnFlushedQueue", std::move(call));
  m_bridge->callNativeModules(*this, calls, true);
}

void JSCExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  if (!ensureBatchedBridgeObject()) {
    throwJSExecutionException(
        "Couldn't invoke JS callback %d: bridge configuration isn't available. This shouldn't be possible. Congratulations.", (int) callbackId);
  }

  std::vector<folly::dynamic> call {
      (double) callbackId,
      std::move(arguments)
  };
  std::string calls = executeJSCallWithJSC(m_context, "invokeCallbackAndReturnFlushedQueue", std::move(call));
  m_bridge->callNativeModules(*this, calls, true);
}

void JSCExecutor::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  auto globalObject = JSContextGetGlobalObject(m_context);
  String jsPropertyName(propName.c_str());

  String jsValueJSON(jsonValue.c_str());
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
  #if WITH_JSC_INTERNAL
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
  m_bridge->callNativeModules(*this, queueJSON, false);
}

void JSCExecutor::loadModule(uint32_t moduleId) {
  auto module = m_unbundle->getModule(moduleId);
  auto sourceUrl = String::createExpectingAscii(module.name);
  auto source = String::createExpectingAscii(module.code);
  evaluateScript(m_context, source, sourceUrl);
}

int JSCExecutor::addWebWorker(
    const std::string& script,
    JSValueRef workerRef,
    JSValueRef globalObjRef) {
  static std::atomic_int nextWorkerId(1);
  int workerId = nextWorkerId++;

  Object globalObj = Value(m_context, globalObjRef).asObject();

  auto workerMQT = WebWorkerUtil::createWebWorkerThread(workerId, m_messageQueueThread.get());
  std::unique_ptr<JSCExecutor> worker;
  workerMQT->runOnQueueSync([this, &worker, &script, &globalObj, workerId] () {
    worker.reset(new JSCExecutor(m_bridge, workerId, this, script, globalObj.toJSONMap(), m_jscConfig));
  });

  Object workerObj = Value(m_context, workerRef).asObject();
  workerObj.makeProtected();

  JSCExecutor *workerPtr = worker.get();
  std::shared_ptr<MessageQueueThread> sharedMessageQueueThread = worker->m_messageQueueThread;
  ExecutorToken token = m_bridge->registerExecutor(
      std::move(worker),
      std::move(sharedMessageQueueThread));

  m_ownedWorkers.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(workerId),
      std::forward_as_tuple(workerPtr, token, std::move(workerObj)));

  return workerId;
}

void JSCExecutor::postMessageToOwnedWebWorker(int workerId, JSValueRef message, JSValueRef *exn) {
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
  ExecutorToken workerExecutorToken = workerRegistration.executorToken;
  m_ownedWorkers.erase(workerId);

  std::unique_ptr<JSExecutor> worker = m_bridge->unregisterExecutor(workerExecutorToken);
  worker->destroy();
  worker.reset();
  workerMQT->quitSynchronous();
}

Object JSCExecutor::createMessageObject(const std::string& msgJson) {
  Value rebornJSMsg = Value::fromJSON(m_context, String(msgJson.c_str()));
  Object messageObject = Object::create(m_context);
  messageObject.setProperty("data", rebornJSMsg);
  return messageObject;
}

// Native JS hooks
JSValueRef JSCExecutor::nativePostMessage(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = makeJSCException(ctx, "postMessage got wrong number of arguments");
    return JSValueMakeUndefined(ctx);
  }
  JSValueRef msg = arguments[0];
  JSCExecutor *webWorker = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));

  webWorker->postMessageToOwner(msg);

  return JSValueMakeUndefined(ctx);
}

static JSValueRef makeInvalidModuleIdJSCException(
    JSContextRef ctx,
    const JSValueRef id,
    JSValueRef *exception) {
  std::string message = "Received invalid module ID: ";
  message += String::adopt(JSValueToStringCopy(ctx, id, exception)).str();
  return makeJSCException(ctx, message.c_str());
}

JSValueRef JSCExecutor::nativeRequire(
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception) {

  if (argumentCount != 1) {
    *exception = makeJSCException(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = makeJSCException(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  double moduleId = JSValueToNumber(ctx, arguments[0], exception);
  if (moduleId <= (double) std::numeric_limits<uint32_t>::max() && moduleId >= 0.0) {
    try {
      executor->loadModule(moduleId);
    } catch (JSModulesUnbundle::ModuleNotFound&) {
      *exception = makeInvalidModuleIdJSCException(ctx, arguments[0], exception);
    }
  } else {
    *exception = makeInvalidModuleIdJSCException(ctx, arguments[0], exception);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef createErrorString(JSContextRef ctx, const char *msg) {
  return JSValueMakeString(ctx, String(msg));
}

JSValueRef JSCExecutor::nativeFlushQueueImmediate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  std::string resStr = Value(ctx, arguments[0]).toJSONString();

  executor->flushQueueImmediate(resStr);

  return JSValueMakeUndefined(ctx);
}

JSValueRef JSCExecutor::nativeStartWorker(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 3) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  std::string scriptFile = Value(ctx, arguments[0]).toString().str();

  JSValueRef worker = arguments[1];
  JSValueRef globalObj = arguments[2];

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  int workerId = executor->addWebWorker(scriptFile, worker, globalObj);

  return JSValueMakeNumber(ctx, workerId);
}

JSValueRef JSCExecutor::nativePostMessageToWorker(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 2) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  double workerDouble = JSValueToNumber(ctx, arguments[0], exception);
  if (workerDouble != workerDouble) {
    *exception = createErrorString(ctx, "Got invalid worker id");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  executor->postMessageToOwnedWebWorker((int) workerDouble, arguments[1], exception);

  return JSValueMakeUndefined(ctx);
}

JSValueRef JSCExecutor::nativeTerminateWorker(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  double workerDouble = JSValueToNumber(ctx, arguments[0], exception);
  if (workerDouble != workerDouble) {
    *exception = createErrorString(ctx, "Got invalid worker id");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  executor->terminateOwnedWebWorker((int) workerDouble);

  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  // This is equivalent to android.os.SystemClock.elapsedRealtime() in native
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC_RAW, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  return JSValueMakeNumber(ctx, (nano / (double)NANOSECONDS_IN_MILLISECOND));
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

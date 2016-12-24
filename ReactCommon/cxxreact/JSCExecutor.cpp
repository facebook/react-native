// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCExecutor.h"

#include <algorithm>
#include <condition_variable>
#include <mutex>
#include <sstream>
#include <string>
#include <glog/logging.h>
#include <folly/json.h>
#include <folly/Exception.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/Conv.h>
#include <fcntl.h>
#include <sys/time.h>
#include <system_error>

#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

#ifdef WITH_INSPECTOR
#include <inspector/Inspector.h>
#endif

#include "Platform.h"
#include "SystraceSection.h"
#include "JSCNativeModules.h"
#include "JSCSamplingProfiler.h"
#include "JSCUtils.h"
#include "JSModulesUnbundle.h"
#include "ModuleRegistry.h"
#include "RecoverableError.h"

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

#if defined(WITH_FB_JSC_TUNING) && defined(__ANDROID__)
#include <jsc_config_android.h>
#endif

#ifdef JSC_HAS_PERF_STATS_API
#include "JSCPerfStats.h"
#endif

namespace facebook {
namespace react {

using namespace detail;

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
        auto executor = Object::getGlobalObject(ctx).getPrivate<JSCExecutor>();
        return (executor->*method)(argumentCount, arguments);
      } catch (...) {
        *exception = translatePendingCppExceptionToJSError(ctx, function);
        return Value::makeUndefined(ctx);
      }
    }
  };

  return &funcWrapper::call;
}

template<JSValueRef (JSCExecutor::*method)(JSObjectRef object, JSStringRef propertyName)>
inline JSObjectGetPropertyCallback exceptionWrapMethod() {
  struct funcWrapper {
    static JSValueRef call(
         JSContextRef ctx,
         JSObjectRef object,
         JSStringRef propertyName,
         JSValueRef *exception) {
      try {
        auto executor = Object::getGlobalObject(ctx).getPrivate<JSCExecutor>();
        return (executor->*method)(object, propertyName);
      } catch (...) {
        *exception = translatePendingCppExceptionToJSError(ctx, object);
        return Value::makeUndefined(ctx);
      }
    }
  };

  return &funcWrapper::call;
}

}

#if DEBUG
static JSValueRef nativeInjectHMRUpdate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  String execJSString = Value(ctx, arguments[0]).toString();
  String jsURL = Value(ctx, arguments[1]).toString();
  evaluateScript(ctx, execJSString, jsURL);
  return Value::makeUndefined(ctx);
}
#endif

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
    m_nativeModules(delegate ? delegate->getModuleRegistry() : nullptr),
    m_jscConfig(jscConfig) {
  initOnJSVMThread();

  {
    SystraceSection s("nativeModuleProxy object");
    installGlobalProxy(m_context, "nativeModuleProxy",
                       exceptionWrapMethod<&JSCExecutor::getNativeModule>());
  }
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
    m_nativeModules(delegate->getModuleRegistry()),
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
  if (m_messageQueueThread.get()) {
    m_messageQueueThread->runOnQueueSync([this] () {
      terminateOnJSVMThread();
    });
  } else {
    terminateOnJSVMThread();
  }
}

void JSCExecutor::setContextName(const std::string& name) {
  String jsName = String(m_context, name.c_str());
  JSC_JSGlobalContextSetName(m_context, jsName);
}

void JSCExecutor::initOnJSVMThread() throw(JSException) {
  SystraceSection s("JSCExecutor.initOnJSVMThread");

  #if defined(__APPLE__)
  const bool useCustomJSC = m_jscConfig.getDefault("UseCustomJSC", false).getBool();
  if (useCustomJSC) {
    JSC_configureJSCForIOS(true);
  }
  #else
  const bool useCustomJSC = false;
  #endif

  #if defined(WITH_FB_JSC_TUNING) && defined(__ANDROID__)
  configureJSCForAndroid(m_jscConfig);
  #endif

  // Create a custom global class, so we can store data in it later using JSObjectSetPrivate
  JSClassRef globalClass = nullptr;
  {
    SystraceSection s("JSClassCreate");
    globalClass = JSC_JSClassCreate(useCustomJSC, &kJSClassDefinitionEmpty);
  }
  {
    SystraceSection s("JSGlobalContextCreateInGroup");
    m_context = JSC_JSGlobalContextCreateInGroup(useCustomJSC, nullptr, globalClass);
  }
  JSC_JSClassRelease(useCustomJSC, globalClass);

  // Add a pointer to ourselves so we can retrieve it later in our hooks
  Object::getGlobalObject(m_context).setPrivate(this);

  #ifdef WITH_INSPECTOR
  Inspector::instance().registerGlobalContext("main", m_context);
  #endif

  installNativeHook<&JSCExecutor::nativeFlushQueueImmediate>("nativeFlushQueueImmediate");
  installNativeHook<&JSCExecutor::nativeCallSyncHook>("nativeCallSyncHook");

  // Webworker support
  installNativeHook<&JSCExecutor::nativeStartWorker>("nativeStartWorker");
  installNativeHook<&JSCExecutor::nativePostMessageToWorker>("nativePostMessageToWorker");
  installNativeHook<&JSCExecutor::nativeTerminateWorker>("nativeTerminateWorker");
  installNativeHook<&JSCExecutor::nativeCallSyncHook>("nativeCallSyncHook");

  installGlobalFunction(m_context, "nativeLoggingHook", JSNativeHooks::loggingHook);
  installGlobalFunction(m_context, "nativePerformanceNow", JSNativeHooks::nowHook);

  #if DEBUG
  installGlobalFunction(m_context, "nativeInjectHMRUpdate", nativeInjectHMRUpdate);
  #endif

  #if defined(WITH_JSC_EXTRA_TRACING) || DEBUG
  addNativeTracingHooks(m_context);
  #endif

  #ifdef WITH_JSC_EXTRA_TRACING
  addNativeProfilingHooks(m_context);
  addNativeTracingLegacyHooks(m_context);
  PerfLogging::installNativeHooks(m_context);

  initSamplingProfilerOnMainJSCThread(m_context);
  #endif

  #ifdef WITH_FB_MEMORY_PROFILING
  addNativeMemoryHooks(m_context);
  #endif

  #ifdef JSC_HAS_PERF_STATS_API
  addJSCPerfStatsHooks(m_context);
  #endif

  #if defined(WITH_FB_JSC_TUNING) && defined(__ANDROID__)
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

  m_nativeModules.reset();

  #ifdef WITH_INSPECTOR
  Inspector::instance().unregisterGlobalContext(m_context);
  #endif

  JSC_JSGlobalContextRelease(m_context);
  m_context = nullptr;
}

#ifdef WITH_FBJSCEXTENSIONS
static const char* explainLoadSourceError(JSLoadSourceError err) {
  switch (err) {
  case JSLoadSourceErrorNone:
    return "No error encountered during source load";

  case JSLoadSourceErrorOnRead:
    return "Error reading source";

  case JSLoadSourceErrorNotCompiled:
    return "Source is not compiled";

  case JSLoadSourceErrorVersionMismatch:
    return "Source version not supported";

  case JSLoadSourceErrorUnknown:
    return "Unknown error occurred when loading source";

  default:
    return "Bad error code";
  }
}
#endif

#ifdef WITH_FBJSCEXTENSIONS
void JSCExecutor::loadApplicationScript(
    std::string bundlePath,
    std::string sourceURL,
    int flags) {
  SystraceSection s("JSCExecutor::loadApplicationScript",
                    "sourceURL", sourceURL);

  if (!(flags & (UNPACKED_JS_SOURCE | UNPACKED_BYTECODE))) {
    throw RecoverableError("Optimized bundle with no unpacked source or bytecode");
  }

  String jsSourceURL(m_context, sourceURL.c_str());
  JSSourceCodeRef sourceCode = nullptr;
  SCOPE_EXIT {
    if (sourceCode) {
      JSReleaseSourceCode(sourceCode);
    }
  };

  if (flags & UNPACKED_BYTECODE) {
    int fd = open((bundlePath + UNPACKED_BYTECODE_SUFFIX).c_str(), O_RDONLY);
    RecoverableError::runRethrowingAsRecoverable<std::system_error>([fd]() {
        folly::checkUnixError(fd, "Couldn't open compiled bundle");
      });
    SCOPE_EXIT { close(fd); };

    JSLoadSourceError jsError;
    sourceCode = JSCreateCompiledSourceCode(fd, jsSourceURL, &jsError);

    if (!sourceCode) {
      throw RecoverableError(explainLoadSourceError(jsError));
    }
  } else {
    auto jsScriptBigString = JSBigOptimizedBundleString::fromOptimizedBundle(bundlePath);
    if (!jsScriptBigString->isAscii()) {
      LOG(WARNING) << "Bundle is not ASCII encoded - falling back to the slow path";
      return loadApplicationScript(std::move(jsScriptBigString), sourceURL);
    }

    sourceCode = JSCreateSourceCode(
      jsScriptBigString->fd(),
      jsSourceURL,
      jsScriptBigString->hash(),
      true);
  }

  ReactMarker::logMarker("RUN_JS_BUNDLE_START");

  evaluateSourceCode(m_context, sourceCode, jsSourceURL);

  bindBridge();

  flush();
  ReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
  ReactMarker::logMarker("RUN_JS_BUNDLE_END");
}
#endif

#ifdef WITH_FBJSCEXTENSIONS
void JSCExecutor::loadApplicationScript(
    int fd,
    std::string sourceURL)
{
  String jsSourceURL(m_context, sourceURL.c_str());

  JSLoadSourceError jsError;
  auto bcSourceCode = JSCreateCompiledSourceCode(fd, jsSourceURL, &jsError);

  switch (jsError) {
  case JSLoadSourceErrorOnRead:
  case JSLoadSourceErrorNotCompiled:
    // Not bytecode, fall through.
    return JSExecutor::loadApplicationScript(fd, sourceURL);

  case JSLoadSourceErrorNone:
    if (!bcSourceCode) {
      throw std::runtime_error("Unexpected error opening compiled bundle");
    }
    break;

  case JSLoadSourceErrorVersionMismatch:
  case JSLoadSourceErrorUnknown:
    throw RecoverableError(explainLoadSourceError(jsError));
  }

  ReactMarker::logMarker("RUN_JS_BUNDLE_START");

  evaluateSourceCode(m_context, bcSourceCode, jsSourceURL);

  // TODO(luk): t13903306 Remove this check once we make native modules
  // working for java2js
  if (m_delegate) {
    bindBridge();
    flush();
  }

  ReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
  ReactMarker::logMarker("RUN_JS_BUNDLE_END");
}
#endif

void JSCExecutor::loadApplicationScript(std::unique_ptr<const JSBigString> script, std::string sourceURL) throw(JSException) {
  SystraceSection s("JSCExecutor::loadApplicationScript",
                    "sourceURL", sourceURL);

  #ifdef WITH_FBSYSTRACE
  fbsystrace_begin_section(
    TRACE_TAG_REACT_CXX_BRIDGE,
    "JSCExecutor::loadApplicationScript-createExpectingAscii");
  #endif

  ReactMarker::logMarker("RUN_JS_BUNDLE_START");

  ReactMarker::logMarker("loadApplicationScript_startStringConvert");
  String jsScript = jsStringFromBigString(m_context, *script);
  ReactMarker::logMarker("loadApplicationScript_endStringConvert");

  #ifdef WITH_FBSYSTRACE
  fbsystrace_end_section(TRACE_TAG_REACT_CXX_BRIDGE);
  #endif

  String jsSourceURL(m_context, sourceURL.c_str());
  evaluateScript(m_context, jsScript, jsSourceURL);

  // TODO(luk): t13903306 Remove this check once we make native modules working for java2js
  if (m_delegate) {
    bindBridge();
    flush();
  }
  ReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
  ReactMarker::logMarker("RUN_JS_BUNDLE_END");
}

void JSCExecutor::setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle> unbundle) {
  if (!m_unbundle) {
    installNativeHook<&JSCExecutor::nativeRequire>("nativeRequire");
  }
  m_unbundle = std::move(unbundle);
}

void JSCExecutor::bindBridge() throw(JSException) {
  SystraceSection s("JSCExecutor::bindBridge");
  auto global = Object::getGlobalObject(m_context);
  auto batchedBridgeValue = global.getProperty("__fbBatchedBridge");
  if (batchedBridgeValue.isUndefined()) {
    throwJSExecutionException("Could not get BatchedBridge, make sure your bundle is packaged correctly");
  }

  auto batchedBridge = batchedBridgeValue.asObject();
  m_callFunctionReturnFlushedQueueJS = batchedBridge.getProperty("callFunctionReturnFlushedQueue").asObject();
  m_invokeCallbackAndReturnFlushedQueueJS = batchedBridge.getProperty("invokeCallbackAndReturnFlushedQueue").asObject();
  m_flushedQueueJS = batchedBridge.getProperty("flushedQueue").asObject();
  m_callFunctionReturnResultAndFlushedQueueJS = batchedBridge.getProperty("callFunctionReturnResultAndFlushedQueue").asObject();
}

void JSCExecutor::callNativeModules(Value&& value) {
  SystraceSection s("JSCExecutor::callNativeModules");
  try {
    auto calls = value.toJSONString();
    m_delegate->callNativeModules(*this, folly::parseJson(calls), true);
  } catch (...) {
    std::string message = "Error in callNativeModules()";
    try {
      message += ":" + value.toString().str();
    } catch (...) {
      // ignored
    }
    std::throw_with_nested(std::runtime_error(message));
  }
}

void JSCExecutor::flush() {
  SystraceSection s("JSCExecutor::flush");
  callNativeModules(m_flushedQueueJS->callAsFunction({}));
}

void JSCExecutor::callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) {
  SystraceSection s("JSCExecutor::callFunction");
  // This weird pattern is because Value is not default constructible.
  // The lambda is inlined, so there's no overhead.

  auto result = [&] {
    try {
      return m_callFunctionReturnFlushedQueueJS->callAsFunction({
        Value(m_context, String::createExpectingAscii(m_context, moduleId)),
        Value(m_context, String::createExpectingAscii(m_context, methodId)),
        Value::fromDynamic(m_context, std::move(arguments))
      });
    } catch (...) {
      std::throw_with_nested(
        std::runtime_error("Error calling function: " + moduleId + ":" + methodId));
    }
  }();

  callNativeModules(std::move(result));
}

void JSCExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  SystraceSection s("JSCExecutor::invokeCallback");
  auto result = [&] {
    try {
      return m_invokeCallbackAndReturnFlushedQueueJS->callAsFunction({
        Value::makeNumber(m_context, callbackId),
        Value::fromDynamic(m_context, std::move(arguments))
      });
    } catch (...) {
      std::throw_with_nested(
        std::runtime_error(folly::to<std::string>("Error invoking callback.", callbackId)));
    }
  }();

  callNativeModules(std::move(result));
}

Value JSCExecutor::callFunctionSyncWithValue(
    const std::string& module, const std::string& method, Value args) {
  SystraceSection s("JSCExecutor::callFunction");

  Object result = m_callFunctionReturnResultAndFlushedQueueJS->callAsFunction({
    Value(m_context, String::createExpectingAscii(m_context, module)),
    Value(m_context, String::createExpectingAscii(m_context, method)),
    std::move(args),
  }).asObject();

  Value length = result.getProperty("length");

  if (!length.isNumber() || length.asInteger() != 2) {
    std::runtime_error("Return value of a callFunction must be an array of size 2");
  }

  callNativeModules(result.getPropertyAtIndex(1));
  return result.getPropertyAtIndex(0);
}

void JSCExecutor::setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue) {
  try {
    SystraceSection s("JSCExecutor.setGlobalVariable",
                      "propName", propName);

    auto valueToInject = Value::fromJSON(m_context, jsStringFromBigString(m_context, *jsonValue));
    Object::getGlobalObject(m_context).setProperty(propName.c_str(), valueToInject);
  } catch (...) {
    std::throw_with_nested(std::runtime_error("Error setting global variable: " + propName));
  }
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
  String title(m_context, titleString.c_str());
  #if WITH_REACT_INTERNAL_SETTINGS
  JSStartProfiling(m_context, title, false);
  #else
  JSStartProfiling(m_context, title);
  #endif
  #endif
}

void JSCExecutor::stopProfiler(const std::string &titleString, const std::string& filename) {
  #ifdef WITH_JSC_EXTRA_TRACING
  String title(m_context, titleString.c_str());
  facebook::react::stopAndOutputProfilingFile(m_context, title, filename.c_str());
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

void JSCExecutor::flushQueueImmediate(Value&& queue) {
  auto queueStr = queue.toJSONString();
  m_delegate->callNativeModules(*this, folly::parseJson(queueStr), false);
}

void JSCExecutor::loadModule(uint32_t moduleId) {
  auto module = m_unbundle->getModule(moduleId);
  auto sourceUrl = String::createExpectingAscii(m_context, module.name);
  auto source = String::createExpectingAscii(m_context, module.code);
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
  Value rebornJSMsg = Value::fromJSON(m_context, String(m_context, msgJson.c_str()));
  Object messageObject = Object::create(m_context);
  messageObject.setProperty("data", rebornJSMsg);
  return messageObject;
}

// Native JS hooks
template<JSValueRef (JSCExecutor::*method)(size_t, const JSValueRef[])>
void JSCExecutor::installNativeHook(const char* name) {
  installGlobalFunction(m_context, name, exceptionWrapMethod<method>());
}

JSValueRef JSCExecutor::getNativeModule(JSObjectRef object, JSStringRef propertyName) {
  if (JSC_JSStringIsEqualToUTF8CString(m_context, propertyName, "name")) {
    return Value(m_context, String(m_context, "NativeModules"));
  }

  return m_nativeModules.getModule(m_context, propertyName);
}

JSValueRef JSCExecutor::nativePostMessage(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }
  JSValueRef msg = arguments[0];
  postMessageToOwner(msg);

  return Value::makeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeRequire(
  size_t argumentCount,
  const JSValueRef arguments[]) {

  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }

  double moduleId = Value(m_context, arguments[0]).asNumber();
  if (moduleId <= 0) {
    throw std::invalid_argument(folly::to<std::string>("Received invalid module ID: ",
      Value(m_context, arguments[0]).toString().str()));
  }

  loadModule(moduleId);
  return Value::makeUndefined(m_context);
}

JSValueRef JSCExecutor::nativeFlushQueueImmediate(
    size_t argumentCount,
    const JSValueRef arguments[]) {
  if (argumentCount != 1) {
    throw std::invalid_argument("Got wrong number of args");
  }

  flushQueueImmediate(Value(m_context, arguments[0]));
  return Value::makeUndefined(m_context);
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

  return Value::makeNumber(m_context, workerId);
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

  return Value::makeUndefined(m_context);
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

  return Value::makeUndefined(m_context);
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
    return Value::makeUndefined(m_context);
  }
  return Value::fromDynamic(m_context, result.result);
}

} }

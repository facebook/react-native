// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCExecutor.h"

#include <algorithm>
#include <condition_variable>
#include <fcntl.h>
#include <mutex>
#include <sstream>
#include <string>
#include <sys/time.h>
#include <sys/socket.h>
#include <system_error>

#include <arpa/inet.h>
#include <folly/Conv.h>
#include <folly/Exception.h>
#include <folly/json.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <glog/logging.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>
#include <jsinspector/InspectorInterfaces.h>

#include "JSBigString.h"
#include "JSBundleType.h"
#include "JSCLegacyTracing.h"
#include "JSCMemory.h"
#include "JSCNativeModules.h"
#include "JSCPerfStats.h"
#include "JSCSamplingProfiler.h"
#include "JSCTracing.h"
#include "JSCUtils.h"
#include "JSModulesUnbundle.h"
#include "ModuleRegistry.h"
#include "Platform.h"
#include "RAMBundleRegistry.h"
#include "RecoverableError.h"
#include "SystraceSection.h"

#if defined(WITH_JSC_MEMORY_PRESSURE)
#include <jsc_memory.h>
#endif

#if defined(WITH_FB_JSC_TUNING) && defined(__ANDROID__)
#include <jsc_config_android.h>
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
              auto executor = Object::getGlobalObject(ctx).getPrivate<JSCExecutor>();
              if (executor && executor->getJavaScriptContext()) { // Executor not invalidated
                return (executor->*method)(argumentCount, arguments);
              }
            } catch (...) {
              *exception = translatePendingCppExceptionToJSError(ctx, function);
            }
            return Value::makeUndefined(ctx);
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
              if (executor && executor->getJavaScriptContext()) { // Executor not invalidated
                return (executor->*method)(object, propertyName);
              }
            } catch (...) {
              *exception = translatePendingCppExceptionToJSError(ctx, object);
            }
            return Value::makeUndefined(ctx);
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
      return folly::make_unique<JSCExecutor>(delegate, jsQueue, m_jscConfig);
    }

    JSCExecutor::JSCExecutor(std::shared_ptr<ExecutorDelegate> delegate,
                             std::shared_ptr<MessageQueueThread> messageQueueThread,
                             const folly::dynamic& jscConfig) throw(JSException) :
    m_delegate(delegate),
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

    static bool canUseInspector(JSContextRef context) {
#ifdef WITH_INSPECTOR
#if defined(__APPLE__)
      return isCustomJSCPtr(context); // WITH_INSPECTOR && Apple
#else
      return true; // WITH_INSPECTOR && Android
#endif
#else
      return false; // !WITH_INSPECTOR
#endif
    }

    static bool canUseSamplingProfiler(JSContextRef context) {
#if defined(__APPLE__) || defined(WITH_JSC_EXTRA_TRACING)
      return JSC_JSSamplingProfilerEnabled(context);
#else
      return false;
#endif
    }

    void JSCExecutor::initOnJSVMThread() throw(JSException) {
      SystraceSection s("JSCExecutor::initOnJSVMThread");

#if defined(__APPLE__)
      const bool useCustomJSC = m_jscConfig.getDefault("UseCustomJSC", false).getBool();
      if (useCustomJSC) {
        JSC_configureJSCForIOS(true, toJson(m_jscConfig));
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
        SystraceSection s_("JSClassCreate");
        JSClassDefinition definition = kJSClassDefinitionEmpty;
        definition.attributes |= kJSClassAttributeNoAutomaticPrototype;
        globalClass = JSC_JSClassCreate(useCustomJSC, &definition);
      }
      {
        SystraceSection s_("JSGlobalContextCreateInGroup");
        m_context = JSC_JSGlobalContextCreateInGroup(useCustomJSC, nullptr, globalClass);
      }
      JSC_JSClassRelease(useCustomJSC, globalClass);

      // Add a pointer to ourselves so we can retrieve it later in our hooks
      Object::getGlobalObject(m_context).setPrivate(this);

      if (canUseInspector(m_context)) {
        const std::string ownerId = m_jscConfig.getDefault("OwnerIdentity", "unknown").getString();
        const std::string appId = m_jscConfig.getDefault("AppIdentity", "unknown").getString();
        const std::string deviceId = m_jscConfig.getDefault("DeviceIdentity", "unknown").getString();
        auto checkIsInspectedRemote = [ownerId, appId, deviceId]() {
          return isNetworkInspected(ownerId, appId, deviceId);
        };

        auto& globalInspector = facebook::react::getInspectorInstance();
        JSC_JSGlobalContextEnableDebugger(m_context, globalInspector, ownerId.c_str(), checkIsInspectedRemote);
      }

      installNativeHook<&JSCExecutor::nativeFlushQueueImmediate>("nativeFlushQueueImmediate");
      installNativeHook<&JSCExecutor::nativeCallSyncHook>("nativeCallSyncHook");

      installGlobalFunction(m_context, "nativeLoggingHook", JSCNativeHooks::loggingHook);
      installGlobalFunction(m_context, "nativePerformanceNow", JSCNativeHooks::nowHook);

#if DEBUG
      installGlobalFunction(m_context, "nativeInjectHMRUpdate", nativeInjectHMRUpdate);
#endif

      addNativeTracingHooks(m_context);
      addNativeTracingLegacyHooks(m_context);
      addJSCMemoryHooks(m_context);
      addJSCPerfStatsHooks(m_context);

      JSCNativeHooks::installPerfHooks(m_context);

      if (canUseSamplingProfiler(m_context)) {
        initSamplingProfilerOnMainJSCThread(m_context);
      }
    }

    bool JSCExecutor::isNetworkInspected(const std::string &owner, const std::string &app, const std::string &device) {
#ifdef WITH_FB_DBG_ATTACH_BEFORE_EXEC
      auto connect_socket = [](int socket_desc, std::string address, int port) {
        if (socket_desc < 0) {
          ::close(socket_desc);
          return false;
        }

        struct timeval tv;
        tv.tv_sec = 1;
        tv.tv_usec = 0;
        auto sock_opt_rcv_resp = setsockopt(socket_desc, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof(struct timeval));
        if (sock_opt_rcv_resp < 0) {
          ::close(socket_desc);
          return false;
        }

        auto sock_opt_snd_resp = setsockopt(socket_desc, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof(struct timeval));
        if (sock_opt_snd_resp < 0) {
          ::close(socket_desc);
          return false;
        }

        struct sockaddr_in server;
        server.sin_addr.s_addr = inet_addr(address.c_str());
        server.sin_family = AF_INET;
        server.sin_port = htons(port);
        auto connect_resp = ::connect(socket_desc, (struct sockaddr *)&server, sizeof(server));
        if (connect_resp < 0) {
          ::close(socket_desc);
          return false;
        }

        return true;
      };

      int socket_desc = socket(AF_INET, SOCK_STREAM, 0);

      if (!connect_socket(socket_desc, "127.0.0.1", 8082)) {
#if defined(__ANDROID__)
        socket_desc = socket(AF_INET, SOCK_STREAM, 0);
        if (!connect_socket(socket_desc, "10.0.2.2", 8082) /* emulator */) {
          socket_desc = socket(AF_INET, SOCK_STREAM, 0);
          if (!connect_socket(socket_desc, "10.0.3.2", 8082) /* genymotion */) {
            return false;
          }
        }
#else //!defined(__ANDROID__)
        return false;
#endif //defined(__ANDROID__)
      }

      std::string escapedOwner = folly::uriEscape<std::string>(owner, folly::UriEscapeMode::QUERY);
      std::string escapedApp = folly::uriEscape<std::string>(app, folly::UriEscapeMode::QUERY);
      std::string escapedDevice = folly::uriEscape<std::string>(device, folly::UriEscapeMode::QUERY);
      std::string msg = folly::to<std::string>(
        "GET /autoattach?title=", escapedOwner,
        "&app=" , escapedApp,
        "&device=" , escapedDevice,
        " HTTP/1.1\r\n\r\n");
      auto send_resp = ::send(socket_desc, msg.c_str(), msg.length(), 0);
      if (send_resp < 0) {
        ::close(socket_desc);
        return false;
      }

      char server_reply[200];
      server_reply[199] = '\0';
      auto recv_resp = ::recv(socket_desc, server_reply,
                              sizeof(server_reply) - 1, 0);
      if (recv_resp < 0) {
        ::close(socket_desc);
        return false;
      }

      std::string response(server_reply);
      if (response.size() < 25) {
        ::close(socket_desc);
        return false;
      }
      auto responseCandidate = response.substr(response.size() - 25);
      auto found = responseCandidate.find("{\"autoattach\":true}") != std::string::npos;
      ::close(socket_desc);
      return found;
#else //!WITH_FB_DBG_ATTACH_BEFORE_EXEC
      return false;
#endif //WITH_FB_DBG_ATTACH_BEFORE_EXEC
    }

    void JSCExecutor::terminateOnJSVMThread() {
      JSGlobalContextRef context = m_context;
      m_context = nullptr;
      Object::getGlobalObject(context).setPrivate(nullptr);
      m_nativeModules.reset();

      if (canUseInspector(context)) {
        auto &globalInspector = facebook::react::getInspectorInstance();
        JSC_JSGlobalContextDisableDebugger(context, globalInspector);
      }

      JSC_JSGlobalContextRelease(context);
    }

#ifdef WITH_FBJSCEXTENSIONS
    static const char* explainLoadSourceStatus(JSLoadSourceStatus status) {
      switch (status) {
        case JSLoadSourceIsCompiled:
          return "No error encountered during source load";

        case JSLoadSourceErrorOnRead:
          return "Error reading source";

        case JSLoadSourceIsNotCompiled:
          return "Source is not compiled";

        case JSLoadSourceErrorVersionMismatch:
          return "Source version not supported";

        default:
          return "Bad error code";
      }
    }
#endif

    // basename_r isn't in all iOS SDKs, so use this simple version instead.
    static std::string simpleBasename(const std::string &path) {
      size_t pos = path.rfind("/");
      return (pos != std::string::npos) ? path.substr(pos) : path;
    }

    void JSCExecutor::loadApplicationScript(std::unique_ptr<const JSBigString> script, std::string sourceURL) {
      SystraceSection s("JSCExecutor::loadApplicationScript",
                        "sourceURL", sourceURL);

      std::string scriptName = simpleBasename(sourceURL);
      ReactMarker::logTaggedMarker(ReactMarker::RUN_JS_BUNDLE_START, scriptName.c_str());
      String jsSourceURL(m_context, sourceURL.c_str());

      // TODO t15069155: reduce the number of overrides here
#ifdef WITH_FBJSCEXTENSIONS
      if (auto fileStr = dynamic_cast<const JSBigFileString *>(script.get())) {
        JSContextLock lock(m_context);
        JSLoadSourceStatus jsStatus;
        auto bcSourceCode = JSCreateSourceCodeFromFile(fileStr->fd(), jsSourceURL, nullptr, &jsStatus);

        switch (jsStatus) {
          case JSLoadSourceIsCompiled:
            if (!bcSourceCode) {
              throw std::runtime_error("Unexpected error opening compiled bundle");
            }
            evaluateSourceCode(m_context, bcSourceCode, jsSourceURL);

            flush();

            ReactMarker::logMarker(ReactMarker::CREATE_REACT_CONTEXT_STOP);
            ReactMarker::logTaggedMarker(ReactMarker::RUN_JS_BUNDLE_STOP, scriptName.c_str());
            return;

          case JSLoadSourceErrorVersionMismatch:
            throw RecoverableError(explainLoadSourceStatus(jsStatus));

          case JSLoadSourceErrorOnRead:
          case JSLoadSourceIsNotCompiled:
            // Not bytecode, fall through.
            break;
        }
      }
#elif defined(__APPLE__)
      BundleHeader header;
      memcpy(&header, script->c_str(), std::min(script->size(), sizeof(BundleHeader)));
      auto scriptTag = parseTypeFromHeader(header);

      if (scriptTag == ScriptTag::BCBundle) {
        using file_ptr = std::unique_ptr<FILE, decltype(&fclose)>;
        file_ptr source(fopen(sourceURL.c_str(), "r"), fclose);
        int sourceFD = fileno(source.get());

        JSValueRef jsError;
        JSValueRef result = JSC_JSEvaluateBytecodeBundle(m_context, NULL, sourceFD, jsSourceURL, &jsError);
        if (result == nullptr) {
          throw JSException(m_context, jsError, jsSourceURL);
        }
      } else
#endif
      {
        String jsScript;
        JSContextLock lock(m_context);
        {
          SystraceSection s_("JSCExecutor::loadApplicationScript-createExpectingAscii");
          ReactMarker::logMarker(ReactMarker::JS_BUNDLE_STRING_CONVERT_START);
          jsScript = adoptString(std::move(script));
          ReactMarker::logMarker(ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP);
        }
#ifdef WITH_FBSYSTRACE
        fbsystrace_end_section(TRACE_TAG_REACT_CXX_BRIDGE);
#endif

        SystraceSection s_("JSCExecutor::loadApplicationScript-evaluateScript");
        evaluateScript(m_context, jsScript, jsSourceURL);
      }

      flush();

      ReactMarker::logMarker(ReactMarker::CREATE_REACT_CONTEXT_STOP);
      ReactMarker::logTaggedMarker(ReactMarker::RUN_JS_BUNDLE_STOP, scriptName.c_str());
    }

    void JSCExecutor::setBundleRegistry(std::unique_ptr<RAMBundleRegistry> bundleRegistry) {
      if (!m_bundleRegistry) {
        installNativeHook<&JSCExecutor::nativeRequire>("nativeRequire");
      }
      m_bundleRegistry = std::move(bundleRegistry);
    }

    void JSCExecutor::registerBundle(uint32_t bundleId, const std::string& bundlePath) {
      if (m_bundleRegistry) {
        m_bundleRegistry->registerBundle(bundleId, bundlePath);
      }
    }

    void JSCExecutor::bindBridge() throw(JSException) {
      SystraceSection s("JSCExecutor::bindBridge");
      std::call_once(m_bindFlag, [this] {
        auto global = Object::getGlobalObject(m_context);
        auto batchedBridgeValue = global.getProperty("__fbBatchedBridge");
        if (batchedBridgeValue.isUndefined()) {
          auto requireBatchedBridge = global.getProperty("__fbRequireBatchedBridge");
          if (!requireBatchedBridge.isUndefined()) {
            batchedBridgeValue = requireBatchedBridge.asObject().callAsFunction({});
          }
          if (batchedBridgeValue.isUndefined()) {
            throw JSException("Could not get BatchedBridge, make sure your bundle is packaged correctly");
          }
        }

        auto batchedBridge = batchedBridgeValue.asObject();
        m_callFunctionReturnFlushedQueueJS = batchedBridge.getProperty("callFunctionReturnFlushedQueue").asObject();
        m_invokeCallbackAndReturnFlushedQueueJS = batchedBridge.getProperty("invokeCallbackAndReturnFlushedQueue").asObject();
        m_flushedQueueJS = batchedBridge.getProperty("flushedQueue").asObject();
        m_callFunctionReturnResultAndFlushedQueueJS = batchedBridge.getProperty("callFunctionReturnResultAndFlushedQueue").asObject();
      });
    }

    void JSCExecutor::callNativeModules(Value&& value) {
      SystraceSection s("JSCExecutor::callNativeModules");
      // If this fails, you need to pass a fully functional delegate with a
      // module registry to the factory/ctor.
      CHECK(m_delegate) << "Attempting to use native modules without a delegate";
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

      if (m_flushedQueueJS) {
        callNativeModules(m_flushedQueueJS->callAsFunction({}));
        return;
      }

      // When a native module is called from JS, BatchedBridge.enqueueNativeCall()
      // is invoked.  For that to work, require('BatchedBridge') has to be called,
      // and when that happens, __fbBatchedBridge is set as a side effect.
      auto global = Object::getGlobalObject(m_context);
      auto batchedBridgeValue = global.getProperty("__fbBatchedBridge");
      // So here, if __fbBatchedBridge doesn't exist, then we know no native calls
      // have happened, and we were able to determine this without forcing
      // BatchedBridge to be loaded as a side effect.
      if (!batchedBridgeValue.isUndefined()) {
        // If calls were made, we bind to the JS bridge methods, and use them to
        // get the pending queue of native calls.
        bindBridge();
        callNativeModules(m_flushedQueueJS->callAsFunction({}));
      } else if (m_delegate) {
        // If we have a delegate, we need to call it; we pass a null list to
        // callNativeModules, since we know there are no native calls, without
        // calling into JS again.  If no calls were made and there's no delegate,
        // nothing happens, which is correct.
        callNativeModules(Value::makeNull(m_context));
      }
    }

    void JSCExecutor::callFunction(const std::string& moduleId, const std::string& methodId, const folly::dynamic& arguments) {
      SystraceSection s("JSCExecutor::callFunction");
      // This weird pattern is because Value is not default constructible.
      // The lambda is inlined, so there's no overhead.
      auto result = [&] {
        JSContextLock lock(m_context);
        try {
          if (!m_callFunctionReturnResultAndFlushedQueueJS) {
            bindBridge();
          }
          return m_callFunctionReturnFlushedQueueJS->callAsFunction({
            Value(m_context, String::createExpectingAscii(m_context, moduleId)),
            Value(m_context, String::createExpectingAscii(m_context, methodId)),
            Value::fromDynamic(m_context, std::move(arguments))
          });
        } catch (...) {
          std::throw_with_nested(
                                 std::runtime_error("Error calling " + moduleId + "." + methodId));
        }
      }();
      callNativeModules(std::move(result));
    }

    void JSCExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
      SystraceSection s("JSCExecutor::invokeCallback");
      auto result = [&] {
        JSContextLock lock(m_context);
        try {
          if (!m_invokeCallbackAndReturnFlushedQueueJS) {
            bindBridge();
          }
          return m_invokeCallbackAndReturnFlushedQueueJS->callAsFunction({
            Value::makeNumber(m_context, callbackId),
            Value::fromDynamic(m_context, std::move(arguments))
          });
        } catch (...) {
          std::throw_with_nested(
                                 std::runtime_error(folly::to<std::string>("Error invoking callback ", callbackId)));
        }
      }();
      callNativeModules(std::move(result));
    }

    Value JSCExecutor::callFunctionSyncWithValue(
                                                 const std::string& module, const std::string& method, Value args) {
      SystraceSection s("JSCExecutor::callFunction");
      Object result = [&] {
        JSContextLock lock(m_context);
        if (!m_callFunctionReturnResultAndFlushedQueueJS) {
          bindBridge();
        }
        return m_callFunctionReturnResultAndFlushedQueueJS->callAsFunction({
          Value(m_context, String::createExpectingAscii(m_context, module)),
          Value(m_context, String::createExpectingAscii(m_context, method)),
          std::move(args),
        }).asObject();
      }();

      Value length = result.getProperty("length");

      if (!length.isNumber() || length.asInteger() != 2) {
        std::runtime_error("Return value of a callFunction must be an array of size 2");
      }
      callNativeModules(result.getPropertyAtIndex(1));
      return result.getPropertyAtIndex(0);
    }

    void JSCExecutor::setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue) {
      try {
        SystraceSection s("JSCExecutor::setGlobalVariable", "propName", propName);
        auto valueToInject = Value::fromJSON(adoptString(std::move(jsonValue)));
        Object::getGlobalObject(m_context).setProperty(propName.c_str(), valueToInject);
      } catch (...) {
        std::throw_with_nested(std::runtime_error("Error setting global variable: " + propName));
      }
    }

    std::string JSCExecutor::getDescription() {
#if defined(__APPLE__)
      if (isCustomJSCPtr(m_context)) {
        return "Custom JSC";
      } else {
        return "System JSC";
      }
#else
      return "JSC";
#endif
    }

    String JSCExecutor::adoptString(std::unique_ptr<const JSBigString> script) {
#if defined(WITH_FBJSCEXTENSIONS)
      const JSBigString* string = script.release();
      auto jsString = JSStringCreateAdoptingExternal(string->c_str(), string->size(), (void*)string, [](void* s) {
        delete static_cast<JSBigString*>(s);
      });
      return String::adopt(m_context, jsString);
#else
      return script->isAscii()
      ? String::createExpectingAscii(m_context, script->c_str(), script->size())
      : String(m_context, script->c_str());
#endif
    }

    void* JSCExecutor::getJavaScriptContext() {
      return m_context;
    }

#ifdef WITH_JSC_MEMORY_PRESSURE
    void JSCExecutor::handleMemoryPressure(int pressureLevel) {
      JSHandleMemoryPressure(this, m_context, static_cast<JSMemoryPressure>(pressureLevel));
    }
#endif

    void JSCExecutor::flushQueueImmediate(Value&& queue) {
      auto queueStr = queue.toJSONString();
      m_delegate->callNativeModules(*this, folly::parseJson(queueStr), false);
    }

    void JSCExecutor::loadModule(uint32_t bundleId, uint32_t moduleId) {
      auto module = m_bundleRegistry->getModule(bundleId, moduleId);
      auto sourceUrl = String::createExpectingAscii(m_context, module.name);
      auto source = adoptString(std::unique_ptr<JSBigString>(new JSBigStdString(module.code)));
      evaluateScript(m_context, source, sourceUrl);
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

    JSValueRef JSCExecutor::nativeRequire(
                                          size_t argumentCount,
                                          const JSValueRef arguments[]) {
      uint32_t bundleId, moduleId;
      std::tie(bundleId, moduleId) = parseNativeRequireParameters(m_context, arguments, argumentCount);
      ReactMarker::logMarker(ReactMarker::NATIVE_REQUIRE_START);
      loadModule(bundleId, moduleId);
      ReactMarker::logMarker(ReactMarker::NATIVE_REQUIRE_STOP);
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

    JSValueRef JSCExecutor::nativeCallSyncHook(
                                               size_t argumentCount,
                                               const JSValueRef arguments[]) {
      if (argumentCount != 3) {
        throw std::invalid_argument("Got wrong number of args");
      }

      unsigned int moduleId = Value(m_context, arguments[0]).asUnsignedInteger();
      unsigned int methodId = Value(m_context, arguments[1]).asUnsignedInteger();
      folly::dynamic args = folly::parseJson(Value(m_context, arguments[2]).toJSONString());

      if (!args.isArray()) {
        throw std::invalid_argument(
                                    folly::to<std::string>("method parameters should be array, but are ", args.typeName()));
      }

      MethodCallResult result = m_delegate->callSerializableNativeHook(
                                                                       *this,
                                                                       moduleId,
                                                                       methodId,
                                                                       std::move(args));
      if (!result.hasValue()) {
        return Value::makeUndefined(m_context);
      }
      return Value::fromDynamic(m_context, result.value());
    }

  } }

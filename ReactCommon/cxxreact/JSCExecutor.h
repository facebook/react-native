// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <unordered_map>

#include <folly/json.h>
#include <folly/Optional.h>

#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

#include "Executor.h"
#include "ExecutorToken.h"
#include "JSCNativeModules.h"

namespace facebook {
namespace react {

class MessageQueueThread;

#define RN_JSC_EXECUTOR_EXPORT __attribute__((visibility("default")))

class RN_JSC_EXECUTOR_EXPORT JSCExecutorFactory : public JSExecutorFactory {
public:
  JSCExecutorFactory(const std::string& cacheDir, const folly::dynamic& jscConfig) :
  m_cacheDir(cacheDir),
  m_jscConfig(jscConfig) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;
private:
  std::string m_cacheDir;
  folly::dynamic m_jscConfig;
};

class JSCExecutor;
class WorkerRegistration : public noncopyable {
public:
  explicit WorkerRegistration(JSCExecutor* executor_, Object jsObj_) :
      executor(executor_),
      jsObj(std::move(jsObj_)) {}

  JSCExecutor *executor;
  Object jsObj;
};

template <typename T>
struct ValueEncoder;

class RN_JSC_EXECUTOR_EXPORT JSCExecutor : public JSExecutor {
public:
  /**
   * Must be invoked from thread this Executor will run on.
   */
  explicit JSCExecutor(std::shared_ptr<ExecutorDelegate> delegate,
                       std::shared_ptr<MessageQueueThread> messageQueueThread,
                       const std::string& cacheDir,
                       const folly::dynamic& jscConfig) throw(JSException);
  ~JSCExecutor() override;

  virtual void loadApplicationScript(
    std::unique_ptr<const JSBigString> script,
    std::string sourceURL) throw(JSException) override;

#ifdef WITH_FBJSCEXTENSIONS
  virtual void loadApplicationScript(
    std::string bundlePath,
    std::string sourceURL,
    int flags) override;
#endif

#ifdef WITH_FBJSCEXTENSIONS
  virtual void loadApplicationScript(
    int fd,
    std::string sourceURL) override;
#endif

  virtual void setJSModulesUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle) override;

  virtual void callFunction(
    const std::string& moduleId,
    const std::string& methodId,
    const folly::dynamic& arguments) override;

  virtual void invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;

  template <typename T>
  Value callFunctionSync(
      const std::string& module, const std::string& method, T&& args) {
    return callFunctionSyncWithValue(
      module, method, ValueEncoder<typename std::decay<T>::type>::toValue(
        m_context, std::forward<T>(args)));
  }

  virtual void setGlobalVariable(
    std::string propName,
    std::unique_ptr<const JSBigString> jsonValue) override;

  virtual void* getJavaScriptContext() override;

  virtual bool supportsProfiling() override;
  virtual void startProfiler(const std::string &titleString) override;
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) override;

  virtual void handleMemoryPressureUiHidden() override;
  virtual void handleMemoryPressureModerate() override;
  virtual void handleMemoryPressureCritical() override;

  virtual void destroy() override;

  void setContextName(const std::string& name);

private:
  JSGlobalContextRef m_context;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  int m_workerId = 0; // if this is a worker executor, this is non-zero
  JSCExecutor *m_owner = nullptr; // if this is a worker executor, this is non-null
  std::shared_ptr<bool> m_isDestroyed = std::shared_ptr<bool>(new bool(false));
  std::unordered_map<int, WorkerRegistration> m_ownedWorkers;
  std::string m_deviceCacheDir;
  std::shared_ptr<MessageQueueThread> m_messageQueueThread;
  std::unique_ptr<JSModulesUnbundle> m_unbundle;
  JSCNativeModules m_nativeModules;
  folly::dynamic m_jscConfig;

  folly::Optional<Object> m_invokeCallbackAndReturnFlushedQueueJS;
  folly::Optional<Object> m_callFunctionReturnFlushedQueueJS;
  folly::Optional<Object> m_flushedQueueJS;
  folly::Optional<Object> m_callFunctionReturnResultAndFlushedQueueJS;

  /**
   * WebWorker constructor. Must be invoked from thread this Executor will run on.
   */
  JSCExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> messageQueueThread,
      int workerId,
      JSCExecutor *owner,
      std::string scriptURL,
      std::unordered_map<std::string, std::string> globalObjAsJSON,
      const folly::dynamic& jscConfig);

  void initOnJSVMThread() throw(JSException);
  // This method is experimental, and may be modified or removed.
  Value callFunctionSyncWithValue(
    const std::string& module, const std::string& method, Value value);
  void terminateOnJSVMThread();
  void bindBridge() throw(JSException);
  void callNativeModules(Value&&);
  void flush();
  void flushQueueImmediate(Value&&);
  void loadModule(uint32_t moduleId);

  int addWebWorker(std::string scriptURL, JSValueRef workerRef, JSValueRef globalObjRef);
  void postMessageToOwnedWebWorker(int worker, JSValueRef message);
  void postMessageToOwner(JSValueRef result);
  void receiveMessageFromOwnedWebWorker(int workerId, const std::string& message);
  void receiveMessageFromOwner(const std::string &msgString);
  void terminateOwnedWebWorker(int worker);
  Object createMessageObject(const std::string& msgData);

  template<JSValueRef (JSCExecutor::*method)(size_t, const JSValueRef[])>
  void installNativeHook(const char* name);
  JSValueRef getNativeModule(JSObjectRef object, JSStringRef propertyName);

  JSValueRef nativeStartWorker(
      size_t argumentCount,
      const JSValueRef arguments[]);
  JSValueRef nativePostMessageToWorker(
      size_t argumentCount,
      const JSValueRef arguments[]);
  JSValueRef nativeTerminateWorker(
      size_t argumentCount,
      const JSValueRef arguments[]);
  JSValueRef nativePostMessage(
      size_t argumentCount,
      const JSValueRef arguments[]);
  JSValueRef nativeRequire(
      size_t argumentCount,
      const JSValueRef arguments[]);
  JSValueRef nativeFlushQueueImmediate(
      size_t argumentCount,
      const JSValueRef arguments[]);
  JSValueRef nativeCallSyncHook(
      size_t argumentCount,
      const JSValueRef arguments[]);
};

} }

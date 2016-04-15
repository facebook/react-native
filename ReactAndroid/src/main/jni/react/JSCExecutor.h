// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <folly/json.h>
#include <JavaScriptCore/JSContextRef.h>

#include "ExecutorToken.h"
#include "Executor.h"
#include "JSCHelpers.h"
#include "Value.h"

namespace facebook {
namespace react {

class MessageQueueThread;

class JSCExecutorFactory : public JSExecutorFactory {
public:
  JSCExecutorFactory(const std::string& cacheDir, const folly::dynamic& jscConfig) :
  cacheDir_(cacheDir),
  m_jscConfig(jscConfig) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(Bridge *bridge) override;
private:
  std::string cacheDir_;
  folly::dynamic m_jscConfig;
};

class JSCExecutor;
class WorkerRegistration : public noncopyable {
public:
  explicit WorkerRegistration(JSCExecutor* executor, ExecutorToken executorToken, Object jsObj) :
      executor(executor),
      executorToken(executorToken),
      jsObj(std::move(jsObj)) {}

  JSCExecutor *executor;
  ExecutorToken executorToken;
  Object jsObj;
};

class JSCExecutor : public JSExecutor {
public:
  /**
   * Must be invoked from thread this Executor will run on.
   */
  explicit JSCExecutor(Bridge *bridge, const std::string& cacheDir, const folly::dynamic& jscConfig);
  ~JSCExecutor() override;

  virtual void loadApplicationScript(
    const std::string& script,
    const std::string& sourceURL) override;
  virtual void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) override;
  virtual void callFunction(
    const std::string& moduleId,
    const std::string& methodId,
    const folly::dynamic& arguments) override;
  virtual void invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) override;
  virtual void* getJavaScriptContext() override;
  virtual bool supportsProfiling() override;
  virtual void startProfiler(const std::string &titleString) override;
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) override;
  virtual void handleMemoryPressureModerate() override;
  virtual void handleMemoryPressureCritical() override;
  virtual void destroy() override;

  void installNativeHook(const char *name, JSObjectCallAsFunctionCallback callback);

private:
  JSGlobalContextRef m_context;
  Bridge *m_bridge;
  int m_workerId = 0; // if this is a worker executor, this is non-zero
  JSCExecutor *m_owner = nullptr; // if this is a worker executor, this is non-null
  std::shared_ptr<bool> m_isDestroyed = std::shared_ptr<bool>(new bool(false));
  std::unordered_map<int, WorkerRegistration> m_ownedWorkers;
  std::string m_deviceCacheDir;
  std::shared_ptr<MessageQueueThread> m_messageQueueThread;
  std::unique_ptr<JSModulesUnbundle> m_unbundle;
  folly::dynamic m_jscConfig;
  std::unique_ptr<Object> m_batchedBridge;
  std::unique_ptr<Object> m_flushedQueueObj;

  /**
   * WebWorker constructor. Must be invoked from thread this Executor will run on.
   */
  explicit JSCExecutor(
      Bridge *bridge,
      int workerId,
      JSCExecutor *owner,
      const std::string& script,
      const std::unordered_map<std::string, std::string>& globalObjAsJSON,
      const folly::dynamic& jscConfig);

  void initOnJSVMThread();
  void terminateOnJSVMThread();
  void flush();
  void flushQueueImmediate(std::string queueJSON);
  void loadModule(uint32_t moduleId);
  bool ensureBatchedBridgeObject();

  int addWebWorker(const std::string& script, JSValueRef workerRef, JSValueRef globalObjRef);
  void postMessageToOwnedWebWorker(int worker, JSValueRef message, JSValueRef *exn);
  void postMessageToOwner(JSValueRef result);
  void receiveMessageFromOwnedWebWorker(int workerId, const std::string& message);
  void receiveMessageFromOwner(const std::string &msgString);
  void terminateOwnedWebWorker(int worker);
  Object createMessageObject(const std::string& msgData);
  bool usePreparsingAndStringRef();

  static JSValueRef nativeStartWorker(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativePostMessageToWorker(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativeTerminateWorker(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativePostMessage(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativeRequire(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativeFlushQueueImmediate(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
};

} }

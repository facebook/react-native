// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <JavaScriptCore/JSContextRef.h>
#include "Executor.h"
#include "JSCHelpers.h"
#include "JSCWebWorker.h"

namespace facebook {
namespace react {

class JMessageQueueThread;

class JSCExecutorFactory : public JSExecutorFactory {
public:
  virtual std::unique_ptr<JSExecutor> createJSExecutor(FlushImmediateCallback cb) override;
};

class JSCExecutor : public JSExecutor, public JSCWebWorkerOwner {
public:
  /**
   * Should be invoked from the JS thread.
   */
  explicit JSCExecutor(FlushImmediateCallback flushImmediateCallback);
  ~JSCExecutor() override;

  virtual void executeApplicationScript(
    const std::string& script,
    const std::string& sourceURL) override;
  virtual void loadApplicationUnbundle(
    JSModulesUnbundle&& unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) override;
  virtual std::string flush() override;
  virtual std::string callFunction(
    const double moduleId,
    const double methodId,
    const folly::dynamic& arguments) override;
  virtual std::string invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) override;
  virtual bool supportsProfiling() override;
  virtual void startProfiler(const std::string &titleString) override;
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) override;
  virtual void handleMemoryPressureModerate() override;
  virtual void handleMemoryPressureCritical() override;

  void flushQueueImmediate(std::string queueJSON);
  void installNativeHook(const char *name, JSObjectCallAsFunctionCallback callback);
  virtual void onMessageReceived(int workerId, const std::string& message) override;
  virtual JSGlobalContextRef getContext() override;
  virtual std::shared_ptr<JMessageQueueThread> getMessageQueueThread() override;

private:
  JSGlobalContextRef m_context;
  FlushImmediateCallback m_flushImmediateCallback;
  std::unordered_map<int, JSCWebWorker> m_webWorkers;
  std::unordered_map<int, Object> m_webWorkerJSObjs;
  std::shared_ptr<JMessageQueueThread> m_messageQueueThread;
  JSModulesUnbundle m_unbundle;
  bool m_isUnbundleInitialized = false;

  int addWebWorker(const std::string& script, JSValueRef workerRef);
  void postMessageToWebWorker(int worker, JSValueRef message, JSValueRef *exn);
  void terminateWebWorker(int worker);
  void loadModule(uint32_t moduleId);
  std::string getDeviceCacheDir();

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
  static JSValueRef nativeRequire(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);
};

} }

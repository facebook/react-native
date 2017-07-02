// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <mutex>
#include <unordered_map>

#include <cxxreact/JSCNativeModules.h>
#include <cxxreact/JSExecutor.h>
#include <folly/Optional.h>
#include <folly/json.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Value.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class MessageQueueThread;

class RN_EXPORT JSCExecutorFactory : public JSExecutorFactory {
public:
  JSCExecutorFactory(const folly::dynamic& jscConfig) :
    m_jscConfig(jscConfig) {}
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;
private:
  std::string m_cacheDir;
  folly::dynamic m_jscConfig;
};

template <typename T>
struct ValueEncoder;

class RN_EXPORT JSCExecutor : public JSExecutor {
public:
  /**
   * Must be invoked from thread this Executor will run on.
   */
  explicit JSCExecutor(std::shared_ptr<ExecutorDelegate> delegate,
                       std::shared_ptr<MessageQueueThread> messageQueueThread,
                       const folly::dynamic& jscConfig) throw(JSException);
  ~JSCExecutor() override;

  virtual void loadApplicationScript(
    std::unique_ptr<const JSBigString> script,
    std::string sourceURL) override;

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

#ifdef WITH_JSC_MEMORY_PRESSURE
  virtual void handleMemoryPressure(int pressureLevel) override;
#endif

  virtual void destroy() override;

  void setContextName(const std::string& name);

private:
  JSGlobalContextRef m_context;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  std::shared_ptr<bool> m_isDestroyed = std::shared_ptr<bool>(new bool(false));
  std::shared_ptr<MessageQueueThread> m_messageQueueThread;
  std::unique_ptr<JSModulesUnbundle> m_unbundle;
  JSCNativeModules m_nativeModules;
  folly::dynamic m_jscConfig;
  std::once_flag m_bindFlag;

  folly::Optional<Object> m_invokeCallbackAndReturnFlushedQueueJS;
  folly::Optional<Object> m_callFunctionReturnFlushedQueueJS;
  folly::Optional<Object> m_flushedQueueJS;
  folly::Optional<Object> m_callFunctionReturnResultAndFlushedQueueJS;

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

  String adoptString(std::unique_ptr<const JSBigString>);

  template<JSValueRef (JSCExecutor::*method)(size_t, const JSValueRef[])>
  void installNativeHook(const char* name);
  JSValueRef getNativeModule(JSObjectRef object, JSStringRef propertyName);

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

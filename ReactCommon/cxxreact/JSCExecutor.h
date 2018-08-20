// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <cstdint>
#include <memory>
#include <mutex>

#include <cxxreact/JSCNativeModules.h>
#include <cxxreact/JSExecutor.h>
#include <folly/Optional.h>
#include <folly/json.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Value.h>
#include <privatedata/PrivateDataBase.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class MessageQueueThread;
class RAMBundleRegistry;

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

template<typename T>
struct JSCValueEncoder {
  // If you get a build error here, it means the compiler can't see the template instantation of toJSCValue
  // applicable to your type.
  static const Value toJSCValue(JSGlobalContextRef ctx, T&& value);
};

template<>
struct JSCValueEncoder<folly::dynamic> {
  static const Value toJSCValue(JSGlobalContextRef ctx, const folly::dynamic &&value) {
    return Value::fromDynamic(ctx, value);
  }
};

class RN_EXPORT JSCExecutor : public JSExecutor, public PrivateDataBase {
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

  virtual void setBundleRegistry(std::unique_ptr<RAMBundleRegistry> bundleRegistry) override;
  virtual void registerBundle(uint32_t bundleId, const std::string& bundlePath) override;

  virtual void callFunction(
    const std::string& moduleId,
    const std::string& methodId,
    const folly::dynamic& arguments) override;

  virtual void invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;

  virtual void setGlobalVariable(
    std::string propName,
    std::unique_ptr<const JSBigString> jsonValue) override;

  virtual std::string getDescription() override;

  virtual void* getJavaScriptContext() override;

  virtual bool isInspectable() override;

  virtual void handleMemoryPressure(int pressureLevel) override;

  virtual void destroy() override;

  void setContextName(const std::string& name);

private:
  JSGlobalContextRef m_context;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  std::shared_ptr<bool> m_isDestroyed = std::shared_ptr<bool>(new bool(false));
  std::shared_ptr<MessageQueueThread> m_messageQueueThread;
  std::unique_ptr<RAMBundleRegistry> m_bundleRegistry;
  JSCNativeModules m_nativeModules;
  folly::dynamic m_jscConfig;
  std::once_flag m_bindFlag;

  folly::Optional<Object> m_invokeCallbackAndReturnFlushedQueueJS;
  folly::Optional<Object> m_callFunctionReturnFlushedQueueJS;
  folly::Optional<Object> m_flushedQueueJS;
  folly::Optional<Object> m_callFunctionReturnResultAndFlushedQueueJS;

  void initOnJSVMThread() throw(JSException);
  static bool isNetworkInspected(const std::string &owner, const std::string &app, const std::string &device);
  void terminateOnJSVMThread();
  void bindBridge() throw(JSException);
  void callNativeModules(Value&&);
  void flush();
  void flushQueueImmediate(Value&&);
  void loadModule(uint32_t bundleId, uint32_t moduleId);

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

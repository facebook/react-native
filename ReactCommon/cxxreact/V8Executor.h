#ifndef V8_V8EXECUTOR_H
#define V8_V8EXECUTOR_H

#pragma once

#include <cxxreact/JSExecutor.h>
#include <cxxreact/V8NativeModules.h>
#include <cxxreact/RAMBundleRegistry.h>
#include <folly/Optional.h>
#include <folly/json.h>
#include "MessageQueueThread.h"
#include <privatedata/PrivateDataBase.h>
#include <string>
#include "v8.h"
#include <v8helpers/V8Utils.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif


namespace v8 {

class RN_EXPORT V8ExecutorFactory : public JSExecutorFactory {
public:
  V8ExecutorFactory(const folly::dynamic& jscConfig) :
    m_jscConfig(jscConfig) {}

  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::shared_ptr<JSEConfigParams> jseConfigParams) override;

private:
  std::string m_cacheDir;
  folly::dynamic m_jscConfig;
};

class RN_EXPORT V8Executor : public JSExecutor, public PrivateDataBase {
public:
  /**
   * Must be invoked from thread this Executor will run on.
   */
  explicit V8Executor(std::shared_ptr<ExecutorDelegate> delegate,
                       std::shared_ptr<MessageQueueThread> messageQueueThread,
                       const folly::dynamic& jscConfig,
                       std::shared_ptr<JSEConfigParams> jseConfigParams);

  virtual ~V8Executor() override;

  virtual void loadApplicationScript(
    std::unique_ptr<const JSBigString> script,
    uint64_t scriptVersion,
    std::string sourceURL,
    std::string&& bytecodeFileName) override;
    
  virtual void registerBundle(uint32_t bundleId, const std::string& bundlePath) override;

  virtual void setBundleRegistry(std::unique_ptr<RAMBundleRegistry> bundleRegistry) override;

  virtual void callFunction(
    const std::string& moduleId,
    const std::string& methodId,
    const folly::dynamic& arguments) override;

  virtual void invokeCallback(
      const double callbackId,
      const folly::dynamic& arguments) override;

/*  template <typename T>
  Value callFunctionSync(const std::string& module, const std::string& method, T&& args) {
          return callFunctionSyncWithValue(
            module, method, ValueEncoder<typename std::decay<T>::type>::toValue(
              m_context, std::forward<T>(args)));
  }*/

  virtual void setGlobalVariable(
    std::string propName,
    std::unique_ptr<const JSBigString> jsonValue) override;

  virtual std::string getDescription() override;

  virtual void* getJavaScriptContext() override;

#ifdef WITH_JSC_MEMORY_PRESSURE
   virtual void handleMemoryPressure(int pressureLevel) override;
#endif

  virtual void destroy() override;

  void setContextName(const std::string& name);

  /**
   * global data, one Isolage running on one thread
   */
  void PlatformInit();
  Isolate *GetIsolate();
  void ClearStartupData(StartupData* data);
  StartupData* Load(const char* blob_file, void (*setter_fn)(v8::StartupData*) );

private:
  Global<Context> m_context;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  std::shared_ptr<bool> m_isDestroyed = std::shared_ptr<bool>(new bool(false));
  std::shared_ptr<MessageQueueThread> m_messageQueueThread;
  std::unique_ptr<RAMBundleRegistry> m_bundleRegistry;
  V8NativeModules m_nativeModules;
  folly::dynamic m_jscConfig;
  std::once_flag m_bindFlag;

  Global<Function> m_invokeCallbackAndReturnFlushedQueueJS;
  Global<Function> m_callFunctionReturnFlushedQueueJS;
  Global<Function> m_flushedQueueJS;
  Global<Function> m_callFunctionReturnResultAndFlushedQueueJS;

  
  void initOnJSVMThread();
  bool isNetworkInspected(const std::string &owner, const std::string &app, const std::string &device);
  // This method is experimental, and may be modified or removed.
  // Value callFunctionSyncWithValue(const std::string& module, const std::string& method, Value value);
  void terminateOnJSVMThread();
  void bindBridge();
  void callNativeModules(Local<Context> context, Local<Value> value);
  void flush();
  void flushQueueImmediate(Value&&);
  void loadModule(uint32_t bundleId, uint32_t moduleId);

  bool IsCacheEnabled();
  bool ShouldSetNoLazyFlag();
  bool ShouldProduceFullCache();

  // Added to Save Cache
  void SaveScriptCache(std::unique_ptr<ScriptCompiler::CachedData> cached_data, const std::string& path);
  Local<String> ConvertToV8String(Isolate* isolate, const string& s);
  Local<String> WrapModuleContent(const string& path);
  Local<Script> LoadScript(const Local<String> &scriptData, const string& path, Local<Context> context);
  Local<Script> createAndGetScript(const Local<String> &scriptData, const string& path, Local<Context> context);
  void executeScript(Local<Context> context, const Local<String> &script);
  ScriptCompiler::CachedData* TryLoadScriptCache(const std::string& path);
  Global<Value> getNativeModule(Local<String> property, const PropertyCallbackInfo<Value> &info);

  String adoptString(std::unique_ptr<const JSBigString>);

  template<void (V8Executor::*method)(const v8::FunctionCallbackInfo<v8::Value> &args)>
  void installNativeFunctionHook(Local<ObjectTemplate> global, const char *name);
  template<Global<Value> (V8Executor::*method)(Local<String> property, const PropertyCallbackInfo<Value> &info)>
  void installNativePropertyHook(Local<ObjectTemplate> global, const char *name);

  void nativeRequire(const FunctionCallbackInfo<Value> &args);
  void nativeFlushQueueImmediate(const FunctionCallbackInfo<Value> &args);
  void nativeCallSyncHook(const FunctionCallbackInfo<Value> &args);

  Isolate *m_isolate = nullptr; // shared on global
  std::string m_jseLocalPath;
  std::shared_ptr<JSEConfigParams> m_jseConfigParams;

};
}
#endif //V8_DEMO_V8EXECUTOR_H

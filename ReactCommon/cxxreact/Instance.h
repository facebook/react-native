// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <folly/dynamic.h>

#include "NativeToJsBridge.h"
#include "ModuleRegistry.h"
#include "NativeModule.h"

namespace facebook {
namespace react {

class JSExecutorFactory;

struct InstanceCallback {
  virtual ~InstanceCallback() {}
  virtual void onBatchComplete() = 0;
  virtual void incrementPendingJSCalls() = 0;
  virtual void decrementPendingJSCalls() = 0;
  virtual void onNativeException(const std::string& what) = 0;
  virtual ExecutorToken createExecutorToken() = 0;
  virtual void onExecutorStopped(ExecutorToken) = 0;
};

class Instance {
 public:
  ~Instance();
  void initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<MessageQueueThread> nativeQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry);
  void loadScriptFromString(std::unique_ptr<const JSBigString> string, std::string sourceURL);
  void loadScriptFromFile(const std::string& filename, const std::string& sourceURL);
  void loadScriptFromOptimizedBundle(std::string bundlePath, std::string sourceURL, int flags);
  void loadUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL);
  bool supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);
  void setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue);
  void callJSFunction(ExecutorToken token, std::string&& module, std::string&& method,
                      folly::dynamic&& params);
  void callJSCallback(ExecutorToken token, uint64_t callbackId, folly::dynamic&& params);
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int moduleId,
                                              unsigned int methodId, folly::dynamic&& args);
  ExecutorToken getMainExecutorToken();
  void handleMemoryPressureUiHidden();
  void handleMemoryPressureModerate();
  void handleMemoryPressureCritical();

 private:
  void callNativeModules(ExecutorToken token, folly::dynamic&& calls, bool isEndOfBatch);

  std::shared_ptr<InstanceCallback> callback_;
  std::unique_ptr<NativeToJsBridge> nativeToJsBridge_;
};

}
}

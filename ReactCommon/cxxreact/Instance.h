// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <condition_variable>
#include <memory>

#include <cxxreact/NativeToJsBridge.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace folly {
struct dynamic;
}

namespace facebook {
namespace react {

class JSBigString;
class JSExecutorFactory;
class MessageQueueThread;
class ModuleRegistry;
class RAMBundleRegistry;

struct InstanceCallback {
  virtual ~InstanceCallback() {}
  virtual void onBatchComplete() {}
  virtual void incrementPendingJSCalls() {}
  virtual void decrementPendingJSCalls() {}
};

class RN_EXPORT Instance {
public:
  ~Instance();
  virtual void initializeBridge(std::unique_ptr<InstanceCallback> callback,
                        std::shared_ptr<JSExecutorFactory> jsef,
                        std::shared_ptr<MessageQueueThread> jsQueue,
                        std::shared_ptr<ModuleRegistry> moduleRegistry);

  virtual void setSourceURL(std::string sourceURL);

  virtual void loadScriptFromString(std::unique_ptr<const JSBigString> string,
                            std::string sourceURL, bool loadSynchronously);
  static bool isIndexedRAMBundle(const char *sourcePath);
  virtual void loadRAMBundleFromFile(const std::string& sourcePath,
                             const std::string& sourceURL,
                             bool loadSynchronously);
  virtual void loadRAMBundle(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                     std::unique_ptr<const JSBigString> startupScript,
                     std::string startupScriptSourceURL, bool loadSynchronously);
  virtual bool supportsProfiling();
  virtual void setGlobalVariable(std::string propName,
                         std::unique_ptr<const JSBigString> jsonValue);
  virtual void *getJavaScriptContext();
  virtual bool isInspectable();
  virtual bool isBatchActive();
  virtual void callJSFunction(std::string &&module, std::string &&method,
                      folly::dynamic &&params);
  virtual void callJSCallback(uint64_t callbackId, folly::dynamic &&params);

  // This method is experimental, and may be modified or removed.
  virtual void registerBundle(uint32_t bundleId, const std::string& bundlePath);

  virtual const ModuleRegistry &getModuleRegistry() const;
  virtual ModuleRegistry &getModuleRegistry();

  virtual void handleMemoryPressure(int pressureLevel);

protected:
  virtual void callNativeModules(folly::dynamic &&calls, bool isEndOfBatch);
  virtual void loadApplication(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                       std::unique_ptr<const JSBigString> startupScript,
                       std::string startupScriptSourceURL);
  virtual void loadApplicationSync(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                           std::unique_ptr<const JSBigString> startupScript,
                           std::string startupScriptSourceURL);

  std::shared_ptr<InstanceCallback> callback_;
  std::unique_ptr<NativeToJsBridge> nativeToJsBridge_;
  std::shared_ptr<ModuleRegistry> moduleRegistry_;

  std::mutex m_syncMutex;
  std::condition_variable m_syncCV;
  bool m_syncReady = false;
};

} // namespace react
} // namespace facebook

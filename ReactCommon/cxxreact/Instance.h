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

enum class CachingType {
  NoCaching,
  PartialCaching,
  PartialCachingWithNoLazy,
  FullCaching,
  FullCachingWithNoLazy
};

struct JSEConfigParams {
  std::string cachePath;
  CachingType cacheType;
  int loggingLevel;
};

class RN_EXPORT Instance {
public:
  virtual ~Instance();

  virtual void setModuleRegistry(std::shared_ptr<ModuleRegistry> moduleRegistry);

  virtual void initializeBridge(std::unique_ptr<InstanceCallback> callback,
                        std::shared_ptr<ExecutorDelegateFactory> edf, // if nullptr, will use default delegate (JsToNativeBridge) // TODO(OSS Candidate ISS#2710739)
                        std::shared_ptr<JSExecutorFactory> jsef,
                        std::shared_ptr<MessageQueueThread> jsQueue,
                        std::shared_ptr<ModuleRegistry> moduleRegistry);

  void setSourceURL(std::string sourceURL);

  virtual void loadScriptFromString(
      std::unique_ptr<const JSBigString> bundleString,
      std::string bundleURL,
      bool loadSynchronously);
  static bool isIndexedRAMBundle(const char *sourcePath);
  static bool isIndexedRAMBundle(std::unique_ptr<const JSBigString>* string);
  void loadRAMBundleFromString(std::unique_ptr<const JSBigString> script, const std::string& sourceURL);
  void loadRAMBundleFromFile(const std::string& sourcePath,
                             const std::string& sourceURL,
                             bool loadSynchronously);
  void loadRAMBundle(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                     std::unique_ptr<const JSBigString> startupScript,
                     std::string startupScriptSourceURL, bool loadSynchronously);
  bool supportsProfiling();
  void setGlobalVariable(std::string propName,
                         std::unique_ptr<const JSBigString> jsonValue);
  void *getJavaScriptContext();
  bool isInspectable();
  bool isBatchActive();
  void callJSFunction(std::string &&module, std::string &&method,
                      folly::dynamic &&params);
  void callJSCallback(uint64_t callbackId, folly::dynamic &&params);
  virtual void setJSEConfigParams(std::shared_ptr<JSEConfigParams>&& jseConfigParams);

  // This method is experimental, and may be modified or removed.
  void registerBundle(uint32_t bundleId, const std::string& bundlePath);

  const ModuleRegistry &getModuleRegistry() const;
  ModuleRegistry &getModuleRegistry();

  void handleMemoryPressure(int pressureLevel);

   /**
   * Returns the current peak memory usage due to the JavaScript
   * execution environment in bytes. If the JavaScript execution
   * environment does not track this information, return -1.
   */
  int64_t getPeakJsMemoryUsage() const noexcept;

  void invokeAsync(std::function<void()>&& func);

private:
  void callNativeModules(folly::dynamic &&calls, bool isEndOfBatch);
  virtual void loadApplication(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                       std::unique_ptr<const JSBigString> bundle,
                       std::string bundleURL);
  virtual void loadApplicationSync(std::unique_ptr<RAMBundleRegistry> bundleRegistry,
                           std::unique_ptr<const JSBigString> bundle,
                           std::string bundleURL);

  std::shared_ptr<InstanceCallback> callback_;
  std::unique_ptr<NativeToJsBridge> nativeToJsBridge_;
  std::shared_ptr<ModuleRegistry> moduleRegistry_;
  std::shared_ptr<JSEConfigParams> jseConfigParams_;

  std::mutex m_syncMutex;
  std::condition_variable m_syncCV;
  bool m_syncReady = false;
};

} // namespace react
} // namespace facebook

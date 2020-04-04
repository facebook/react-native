/*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#ifndef MockInstance_hpp
#define MockInstance_hpp

#include <cxxreact/Instance.h>

class MockInstance : public facebook::react::Instance {
private:
  std::shared_ptr<std::vector<std::int64_t>> sumCache_;

  void loadApplication(std::unique_ptr<facebook::react::RAMBundleRegistry> bundleRegistry,
                               std::unique_ptr<const facebook::react::JSBigString> startupScript,
                               std::string startupScriptSourceURL) override;
  void loadApplicationSync(std::unique_ptr<facebook::react::RAMBundleRegistry> bundleRegistry,
                                   std::unique_ptr<const facebook::react::JSBigString> startupScript,
                                   std::string startupScriptSourceURL) override;

public:
  MockInstance(std::shared_ptr<std::vector<std::int64_t>> sumCache);

   void initializeBridge(std::unique_ptr<facebook::react::InstanceCallback> callback,
                                std::shared_ptr<facebook::react::JSExecutorFactory> jsef,
                                std::shared_ptr<facebook::react::MessageQueueThread> jsQueue,
                                std::shared_ptr<facebook::react::ModuleRegistry> moduleRegistry) override;

   void setSourceURL(std::string sourceURL) override;

   void loadScriptFromString(std::unique_ptr<const facebook::react::JSBigString> string,
                                    std::string sourceURL, bool loadSynchronously) override;
//  static bool isIndexedRAMBundle(const char *sourcePath);
   void loadRAMBundleFromFile(const std::string& sourcePath,
                                     const std::string& sourceURL,
                                     bool loadSynchronously) override;
   void loadRAMBundle(std::unique_ptr<facebook::react::RAMBundleRegistry> bundleRegistry,
                             std::unique_ptr<const facebook::react::JSBigString> startupScript,
                             std::string startupScriptSourceURL, bool loadSynchronously) override;
//  bool supportsProfiling();
   void setGlobalVariable(std::string propName,
                                 std::unique_ptr<const facebook::react::JSBigString> jsonValue) override;
   void *getJavaScriptContext() override;
   bool isInspectable() override;
   bool isBatchActive() override;
   void callJSFunction(std::string &&module, std::string &&method,
                              folly::dynamic &&params) override;
   void callJSCallback(uint64_t callbackId, folly::dynamic &&params) override;

  // This method is experimental, and may be modified or removed.
   void registerBundle(uint32_t bundleId, const std::string& bundlePath) override;

   const facebook::react::ModuleRegistry &getModuleRegistry() const override;
   facebook::react::ModuleRegistry &getModuleRegistry() override;

   void handleMemoryPressure(int pressureLevel) override;
};
#endif /* MockInstance_hpp */

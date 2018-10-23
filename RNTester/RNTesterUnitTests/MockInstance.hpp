//
//  MockInstance.hpp
//  RNTesterUnitTests
//
//  Created by Julio Cesar Rocha on 10/22/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

//#ifndef MockInstance_hpp
//#define MockInstance_hpp
//
//#include <stdio.h>
//
//#endif /* MockInstance_hpp */

#pragma once

#include <cxxreact/Instance.h>

class MockInstance : public facebook::react::Instance {
private:
  void loadApplication(std::unique_ptr<facebook::react::RAMBundleRegistry> bundleRegistry,
                               std::unique_ptr<const facebook::react::JSBigString> startupScript,
                               std::string startupScriptSourceURL) override;
  void loadApplicationSync(std::unique_ptr<facebook::react::RAMBundleRegistry> bundleRegistry,
                                   std::unique_ptr<const facebook::react::JSBigString> startupScript,
                                   std::string startupScriptSourceURL) override;

public:
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
   void callJSFunction(std::string &&module, std::string &&method,
                              folly::dynamic &&params) override;
   void callJSCallback(uint64_t callbackId, folly::dynamic &&params) override;
  
  // This method is experimental, and may be modified or removed.
   void registerBundle(uint32_t bundleId, const std::string& bundlePath) override;
  
   const facebook::react::ModuleRegistry &getModuleRegistry() const override;
   facebook::react::ModuleRegistry &getModuleRegistry() override;
  
   void handleMemoryPressure(int pressureLevel) override;
};

#pragma once

#import <memory>
#import <cxxreact/Bundle.h>
#import <cxxreact/BundleLoader.h>
#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import <React/RCTPerformanceLogger.h>

NS_ENUM(NSInteger) {
  RCTFileBundleLoaderErrorNoScriptURL = 1,
  RCTFileBundleLoaderErrorFailedOpeningFile = 2,
  RCTFileBundleLoaderErrorFailedReadingFile = 3,
  RCTFileBundleLoaderErrorFailedStatingFile = 3,
  RCTFileBundleLoaderErrorBCVersion = 4,
  RCTFileBundleLoaderErrorBCNotSupported = 4,
  RCTFileBundleLoaderErrorCannotBeLoadedSynchronously = 1000,
};

namespace facebook {
  namespace react {
    
    class RCTFileBundleLoader : public BundleLoader {
    public:
      
      RCTFileBundleLoader(RCTPerformanceLogger* performanceLogger);
      ~RCTFileBundleLoader() {}
      
      std::unique_ptr<const Bundle> getBundle(std::string bundleURL) const override;
      std::string getBundleURLFromName(std::string bundleName) const override;

    private:
      RCTPerformanceLogger* _performanceLogger;
    };
    
  } // namespace react
} // namespace facebook

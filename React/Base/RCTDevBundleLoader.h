#pragma once

#import <memory>
#import <cxxreact/Bundle.h>
#import <cxxreact/BundleLoader.h>
#import "RCTDevBundlesDownloader.h"

#import <Foundation/Foundation.h>

namespace facebook {
  namespace react {
    
    class RCTDevBundleLoader : public BundleLoader {
    public:
      
      RCTDevBundleLoader(NSDictionary<NSString *, RCTDevBundleSource *> *bundles);
      ~RCTDevBundleLoader() {}
      
      std::unique_ptr<const Bundle> getBundle(std::string bundleURL) const override;
      std::string getBundleURLFromName(std::string bundleName) const override;
      
    private:
      NSDictionary<NSString *, RCTDevBundleSource *> *_bundles;

    };
    
  } // namespace react
} // namespace facebook

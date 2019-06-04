#pragma once

#include <memory>
#include <cxxreact/Bundle.h>
#include <cxxreact/BundleLoader.h>
#include "JSLoader.h"

namespace facebook {
namespace react {

class AssetBundleLoader : public BundleLoader {
 public:
  AssetBundleLoader(jni::alias_ref<JAssetManager::javaobject> assetManager);
  ~AssetBundleLoader() {}

  std::unique_ptr<const Bundle> getBundle(std::string bundleURL) const override;
  std::string getBundleURLFromName(std::string bundleName) const override;
  
 private:
  AAssetManager* assetManager_ = nullptr;
};

} // namespace react
} // namespace facebook

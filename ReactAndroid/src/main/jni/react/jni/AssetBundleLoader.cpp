#include <cxxreact/IndexedRAMBundle.h>
#include <cxxreact/BasicBundle.h>
#include <cxxreact/BundleLoader.h>
#include "AssetBundleLoader.h"
#include "FileRAMBundle.h"

namespace facebook {
namespace react {

AssetBundleLoader::AssetBundleLoader(jni::alias_ref<JAssetManager::javaobject> assetManager) {
  assetManager_ = extractAssetManager(assetManager);
}

std::unique_ptr<const Bundle> AssetBundleLoader::getBundle(std::string bundleURL) const {
  const int kAssetsLength = 9;  // strlen("assets://");
  bundleURL = bundleURL.substr(kAssetsLength);
  std::unique_ptr<const JSBigString> script = loadScriptFromAssets(assetManager_, bundleURL);

  std::unique_ptr<Bundle> bundle;
  if (FileRAMBundle::isFileRAMBundle(assetManager_, bundleURL.c_str())) {
    bundle = std::make_unique<FileRAMBundle>(assetManager_,
                                             bundleURL,
                                             std::move(script));
  } else if (IndexedRAMBundle::isIndexedRAMBundle(script.get())) {
    bundle = std::make_unique<IndexedRAMBundle>(std::move(script),
                                                bundleURL,
                                                bundleURL);
  } else {
    bundle = std::make_unique<BasicBundle>(std::move(script), bundleURL);
  }

  return std::move(bundle);
}

std::string AssetBundleLoader::getBundleURLFromName(std::string bundleName) const {
  return "assets://" + bundleName + ".android.bundle";
}

} // namespace react
} // namespace facebook

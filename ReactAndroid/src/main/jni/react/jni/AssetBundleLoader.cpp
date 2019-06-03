#include "AssetBundleLoader.h"
#include <cxxreact/IndexedRAMBundle.h>
#include <cxxreact/BasicBundle.h>
#include <cxxreact/BundleLoader.h>
#include "FileRAMBundle.h"

namespace facebook {
namespace react {

AssetBundleLoader::AssetBundleLoader(jni::alias_ref<JAssetManager::javaobject> assetManager) {
  assetManager_ = extractAssetManager(assetManager);
}

std::unique_ptr<const Bundle> AssetBundleLoader::getBundle(std::string assetURL) const {
  const int kAssetsLength = 9;  // strlen("assets://");
  auto fileURL = assetURL.substr(kAssetsLength);
  std::unique_ptr<const JSBigString> script = loadScriptFromAssets(assetManager_, fileURL);

  std::unique_ptr<Bundle> bundle;
  if (FileRAMBundle::isFileRAMBundle(assetManager_, fileURL.c_str())) {
    bundle = std::make_unique<FileRAMBundle>(assetManager_,
                                             fileURL,
                                             std::move(script));
  } else if (IndexedRAMBundle::isIndexedRAMBundle(script.get())) {
    bundle = std::make_unique<IndexedRAMBundle>(std::move(script),
                                                fileURL,
                                                fileURL);
  } else {
    bundle = std::make_unique<BasicBundle>(std::move(script), fileURL);
  }

  return std::move(bundle);
}

} // namespace react
} // namespace facebook

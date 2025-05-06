/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSLoader.h"

#include <android/asset_manager_jni.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/JSBundleType.h>
#include <cxxreact/TraceSection.h>
#include <fbjni/fbjni.h>

using namespace facebook::jni;

namespace facebook::react {

class AssetManagerString : public JSBigString {
 public:
  AssetManagerString(AAsset* asset) : asset_(asset){};

  virtual ~AssetManagerString() {
    AAsset_close(asset_);
  }

  bool isAscii() const override {
    return false;
  }

  const char* c_str() const override {
    return (const char*)AAsset_getBuffer(asset_);
  }

  // Length of the c_str without the NULL byte.
  size_t size() const override {
    return AAsset_getLength(asset_);
  }

 private:
  AAsset* asset_;
};

__attribute__((visibility("default"))) AAssetManager* extractAssetManager(
    alias_ref<JAssetManager::javaobject> assetManager) {
  auto env = Environment::current();
  return AAssetManager_fromJava(env, assetManager.get());
}

__attribute__((visibility("default"))) std::unique_ptr<const JSBigString>
loadScriptFromAssets(AAssetManager* manager, const std::string& assetName) {
  TraceSection s(
      "reactbridge_jni_loadScriptFromAssets", "assetName", assetName);
  if (manager) {
    auto asset = AAssetManager_open(
        manager,
        assetName.c_str(),
        AASSET_MODE_STREAMING); // Optimized for sequential read: see
                                // AssetManager.java for docs
    if (asset) {
      auto script = std::make_unique<AssetManagerString>(asset);
      if (script->size() >= sizeof(BundleHeader)) {
        // When using bytecode, it's safe for the underlying buffer to not be \0
        // terminated. In all other scenarios, we will force a copy of the
        // script to ensure we have a terminator.
        const BundleHeader* header =
            reinterpret_cast<const BundleHeader*>(script->c_str());
        if (isHermesBytecodeBundle(*header)) {
          return script;
        }
      }

      auto buf = std::make_unique<JSBigBufferString>(script->size());
      memcpy(buf->data(), script->c_str(), script->size());
      return buf;
    }
  }

  throw std::runtime_error(
      "Unable to load script.\n\n"
      "Make sure you're running Metro or that your "
      "bundle '" +
      assetName +
      "' is packaged correctly for release.\n\n"
      "The device must either be USB connected (with bundler set to \"localhost:8081\") or be on "
      "the same Wi-Fi network as your computer (with bundler set to your computer IP) to connect "
      "to Metro.\n\n"
      "If you're using USB on a physical device, make sure you also run this command:\n"
      "  adb reverse tcp:8081 tcp:8081");
}

} // namespace facebook::react

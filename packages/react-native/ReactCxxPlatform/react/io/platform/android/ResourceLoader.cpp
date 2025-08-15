/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ResourceLoader.h"
#include "AssetManagerHelpers.h"

#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <fbjni/fbjni.h>
#include <react/jni/JniHelper.h>

namespace facebook::react {

namespace {
AAssetManager* assetManager_ = nullptr;

AAssetManager* getAssetManager() {
  if (assetManager_ == nullptr) {
    assetManager_ = getJavaAssetManager();
  }

  return assetManager_;
}
} // namespace

bool ResourceLoader::isResourceDirectory(const std::string& path) {
  auto assetDir = AAssetManager_openDir(getAssetManager(), path.c_str());
  if (assetDir == nullptr) {
    return false;
  }

  bool exists = AAssetDir_getNextFileName(assetDir) != nullptr;
  AAssetDir_close(assetDir);
  if (exists) {
    return true;
  }
  return isDirectoryNotEmpty(path);
}

bool ResourceLoader::isResourceFile(const std::string& path) {
  auto asset = AAssetManager_open(
      getAssetManager(), path.c_str(), AASSET_MODE_STREAMING);
  if (asset == nullptr) {
    return false;
  }

  AAsset_close(asset);
  return true;
}

std::string ResourceLoader::getResourceFileContents(const std::string& path) {
  auto asset = AAssetManager_open(
      getAssetManager(), path.c_str(), AASSET_MODE_STREAMING);
  if (asset == nullptr) {
    throw std::runtime_error("File not found " + path);
  }

  std::string result(
      (const char*)AAsset_getBuffer(asset), (size_t)AAsset_getLength(asset));
  AAsset_close(asset);
  return result;
}

std::filesystem::path ResourceLoader::getCacheRootPath() {
  return getContext()->getCacheDir()->getAbsolutePath();
}
} // namespace facebook::react

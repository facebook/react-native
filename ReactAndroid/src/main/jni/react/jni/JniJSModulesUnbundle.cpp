/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JniJSModulesUnbundle.h"

#include <fb/assert.h>
#include <libgen.h>
#include <sys/endian.h>
#include <cstdint>
#include <memory>
#include <sstream>
#include <utility>

using magic_number_t = uint32_t;
const magic_number_t MAGIC_FILE_HEADER = 0xFB0BD1E5;
const char *MAGIC_FILE_NAME = "UNBUNDLE";

namespace facebook {
namespace react {

using asset_ptr =
    std::unique_ptr<AAsset, std::function<decltype(AAsset_close)>>;

static std::string jsModulesDir(const std::string &entryFile) {
  std::string dir = dirname(entryFile.c_str());

  // android's asset manager does not work with paths that start with a dot
  return dir == "." ? "js-modules/" : dir + "/js-modules/";
}

static asset_ptr openAsset(
    AAssetManager *manager,
    const std::string &fileName,
    int mode = AASSET_MODE_STREAMING) {
  return asset_ptr(
      AAssetManager_open(manager, fileName.c_str(), mode), AAsset_close);
}

std::unique_ptr<JniJSModulesUnbundle> JniJSModulesUnbundle::fromEntryFile(
    AAssetManager *assetManager,
    const std::string &entryFile) {
  return std::make_unique<JniJSModulesUnbundle>(
      assetManager, jsModulesDir(entryFile));
}

JniJSModulesUnbundle::JniJSModulesUnbundle(
    AAssetManager *assetManager,
    const std::string &moduleDirectory)
    : m_assetManager(assetManager), m_moduleDirectory(moduleDirectory) {}

bool JniJSModulesUnbundle::isUnbundle(
    AAssetManager *assetManager,
    const std::string &assetName) {
  if (!assetManager) {
    return false;
  }

  auto magicFileName = jsModulesDir(assetName) + MAGIC_FILE_NAME;
  auto asset = openAsset(assetManager, magicFileName.c_str());
  if (asset == nullptr) {
    return false;
  }

  magic_number_t fileHeader = 0;
  AAsset_read(asset.get(), &fileHeader, sizeof(fileHeader));
  return fileHeader == htole32(MAGIC_FILE_HEADER);
}

JSModulesUnbundle::Module JniJSModulesUnbundle::getModule(
    uint32_t moduleId) const {
  // can be nullptr for default constructor.
  FBASSERTMSGF(
      m_assetManager != nullptr,
      "Unbundle has not been initialized with an asset manager");

  std::ostringstream sourceUrlBuilder;
  sourceUrlBuilder << moduleId << ".js";
  auto sourceUrl = sourceUrlBuilder.str();

  auto fileName = m_moduleDirectory + sourceUrl;
  auto asset = openAsset(m_assetManager, fileName, AASSET_MODE_BUFFER);

  const char *buffer = nullptr;
  if (asset != nullptr) {
    buffer = static_cast<const char *>(AAsset_getBuffer(asset.get()));
  }
  if (buffer == nullptr) {
    throw ModuleNotFound(moduleId);
  }
  return {sourceUrl, std::string(buffer, AAsset_getLength(asset.get()))};
}

} // namespace react
} // namespace facebook

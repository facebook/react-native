#include "FileRAMBundle.h"

#include <fb/assert.h>
#include <libgen.h>
#include <sys/endian.h>
#include <cstdint>
#include <memory>
#include <sstream>
#include <utility>

#include <folly/Memory.h>

using magic_number_t = uint32_t;
const magic_number_t UNBUNDLE_FILE_HEADER = 0xFB0BD1E5;
const char *UNBUNDLE_FILE_NAM = "UNBUNDLE";

namespace facebook {
namespace react {

using asset_ptr =
    std::unique_ptr<AAsset, std::function<decltype(AAsset_close)>>;

static std::string jsModulesDir(const std::string& entryFile) {
  std::string dir = dirname(entryFile.c_str());

  // android's asset manager does not work with paths that start with a dot
  return dir == "." ? "js-modules/" : dir + "/js-modules/";
}

static asset_ptr openAsset(
    AAssetManager* manager,
    const std::string& fileName,
    int mode = AASSET_MODE_STREAMING) {
  return asset_ptr(
      AAssetManager_open(manager, fileName.c_str(), mode), AAsset_close);
}

bool FileRAMBundle::isFileRAMBundle(
    AAssetManager* assetManager,
    const std::string& assetName) {
  if (!assetManager) {
    return false;
  }

  auto magicFileName = jsModulesDir(assetName) + UNBUNDLE_FILE_NAM;
  auto asset = openAsset(assetManager, magicFileName.c_str());
  if (asset == nullptr) {
    return false;
  }

  magic_number_t fileHeader = 0;
  AAsset_read(asset.get(), &fileHeader, sizeof(fileHeader));
  return fileHeader == htole32(UNBUNDLE_FILE_HEADER);
}

FileRAMBundle::FileRAMBundle(
    AAssetManager* assetManager,
    const std::string& moduleDirectory,
    std::unique_ptr<JSBigString> startupScript)
    : assetManager_(assetManager),
      moduleDirectory_(moduleDirectory),
      startupScript_(std::move(startupScript)) {}

std::shared_ptr<const JSBigString> FileRAMBundle::getStartupScript() const {
  return startupScript_;
}

std::string FileRAMBundle::getSourcePath() const {
  return moduleDirectory_;
};

std::string FileRAMBundle::getSourceURL() const {
  return moduleDirectory_;
};

BundleType FileRAMBundle::getBundleType() const {
  return BundleType::FileRAMBundle;
}

FileRAMBundle::Module FileRAMBundle::getModule(uint32_t moduleId) const {
  // can be nullptr for default constructor.
  FBASSERTMSGF(
      assetManager_ != nullptr,
      "Unbundle has not been initialized with an asset manager");
  auto sourceUrl = folly::to<std::string>(moduleId, ".js");

  auto fileName = moduleDirectory_ + sourceUrl;
  auto asset = openAsset(assetManager_, fileName, AASSET_MODE_BUFFER);

  const char* buffer = nullptr;
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

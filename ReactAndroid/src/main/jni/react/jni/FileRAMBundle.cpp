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

static std::string jsModulesDir(const char* entryFile, bool namedDir) {
  std::string baseDir = dirname(entryFile);
  std::string baseName = basename(entryFile);
  baseName = namedDir
    ? baseName.substr(0, baseName.find('.'))
    : baseName;

  std::string modulesDir = namedDir
    ? baseName + "-js-modules/"
    : "js-modules/";

  // android's asset manager does not work with paths that start with a dot
  return baseDir == "." ? modulesDir : baseDir + modulesDir;
}

static asset_ptr openAsset(
    AAssetManager* manager,
    const char* fileName,
    int mode = AASSET_MODE_STREAMING) {
  return asset_ptr(
      AAssetManager_open(manager, fileName, mode), AAsset_close);
}

bool FileRAMBundle::isFileRAMBundle(AAssetManager* assetManager,
                                    const char* assetName) {
  if (!assetManager) {
    return false;
  }

  // Try named JS modules directory first (eg: `index-js-modules`).
  auto magicFileName = jsModulesDir(assetName, true) + UNBUNDLE_FILE_NAM;
  auto asset = openAsset(assetManager, magicFileName.c_str());
  if (asset == nullptr) {
    // Try unnamed JS modules directory (`js-modules`).
    magicFileName = jsModulesDir(assetName, false) + UNBUNDLE_FILE_NAM;
    asset = openAsset(assetManager, magicFileName.c_str());
    if (asset == nullptr) {
      return false;
    }
  }

  magic_number_t fileHeader = 0;
  AAsset_read(asset.get(), &fileHeader, sizeof(fileHeader));
  return fileHeader == htole32(UNBUNDLE_FILE_HEADER);
}

FileRAMBundle::FileRAMBundle(
    AAssetManager* assetManager,
    const std::string& sourcePath,
    std::unique_ptr<const JSBigString> startupScript)
    : assetManager_(assetManager),
      sourcePath_(sourcePath),
      startupScript_(std::move(startupScript)) {
  auto namedModuleDirectory = jsModulesDir(sourcePath.c_str(), true);
  auto magicFileName = namedModuleDirectory + UNBUNDLE_FILE_NAM;
  auto asset = openAsset(assetManager, magicFileName.c_str());
  if (asset != nullptr) {
    // Use named JS modules directory (eg: `index-js-modules`).
    moduleDirectory_ = namedModuleDirectory;
  } else {
    // Use unnamed JS modules directory (`js-modules`).
    moduleDirectory_ = jsModulesDir(sourcePath.c_str(), false);
  }
}

std::unique_ptr<const JSBigString> FileRAMBundle::getStartupScript() const {
  // It might be used multiple times, so we don't want to move it, but instead copy it.
  std::unique_ptr<JSBigBufferString> script =
    std::make_unique<JSBigBufferString>(startupScript_->size());
  std::memcpy(script->data(), startupScript_->c_str(), startupScript_->size());
  return std::move(script);
}

std::string FileRAMBundle::getSourcePath() const {
  return sourcePath_;
};

std::string FileRAMBundle::getSourceURL() const {
  return moduleDirectory_;
};

BundleType FileRAMBundle::getBundleType() const {
  return BundleType::FileRAMBundle;
}

FileRAMBundle::Module FileRAMBundle::getModule(uint32_t moduleId, const char* bundlePrefix) const {
  // can be nullptr for default constructor.
  FBASSERTMSGF(
      assetManager_ != nullptr,
      "Unbundle has not been initialized with an asset manager");
  auto sourceUrl = folly::to<std::string>(moduleId, ".js");
  auto fileName = moduleDirectory_ + sourceUrl;
  if (bundlePrefix) {
    sourceUrl = folly::to<std::string>(bundlePrefix, "-", sourceUrl);
  }

  auto asset = openAsset(assetManager_, fileName.c_str(), AASSET_MODE_BUFFER);

  const char* buffer = nullptr;
  if (asset != nullptr) {
    buffer = static_cast<const char *>(AAsset_getBuffer(asset.get()));
  }
  if (buffer == nullptr) {
    throw ModuleNotFound(moduleId);
  }
  return { sourceUrl, std::string(buffer, AAsset_getLength(asset.get())) };
}

} // namespace react
} // namespace facebook

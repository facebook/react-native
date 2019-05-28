#pragma once

#include <memory>

#include <android/asset_manager.h>
#include <cxxreact/RAMBundle.h>

namespace facebook {
namespace react {

class FileRAMBundle : public RAMBundle {
  /**
   * This implementation reads modules as single file from the assets of an apk.
   */
 public:
  static bool isFileRAMBundle(AAssetManager* assetManager, const char* assetName);

  FileRAMBundle() = default;
  FileRAMBundle(
      AAssetManager* assetManager,
      const std::string& moduleDirectory,
      std::unique_ptr<const JSBigString> startupScript);
  ~FileRAMBundle() {}

  std::string getSourcePath() const override;
  std::string getSourceURL() const override;
  std::unique_ptr<const JSBigString> getStartupScript() const override;
  Module getModule(uint32_t moduleId) const override;
  BundleType getBundleType() const override;
  
 private:
  AAssetManager* assetManager_ = nullptr;
  std::string moduleDirectory_;
  std::unique_ptr<const JSBigString> startupScript_;
};

} // namespace react
} // namespace facebook

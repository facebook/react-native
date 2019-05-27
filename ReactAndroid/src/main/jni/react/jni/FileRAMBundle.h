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
  FileRAMBundle() = default;
  FileRAMBundle(
      AAssetManager* assetManager,
      const std::string& moduleDirectory,
      std::unique_ptr<JSBigString> startupScript);
  ~FileRAMBundle() {}

  static bool isFileRAMBundle(
      AAssetManager* assetManager,
      const std::string& assetName);

  std::string getSourcePath() const override;
  std::string getSourceURL() const override;
  std::shared_ptr<const JSBigString> getStartupScript() const override;
  Module getModule(uint32_t moduleId) const override;
  BundleType getBundleType() const override;
  
 private:
  AAssetManager* assetManager_ = nullptr;
  std::string moduleDirectory_;
  std::shared_ptr<JSBigString> startupScript_;
};

} // namespace react
} // namespace facebook

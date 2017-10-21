// Copyright 2004-present Facebook. All Rights Reserved.

#include <android/asset_manager.h>
#include <cxxreact/RAMBundleRegistry.h>

namespace facebook {
namespace react {

class JniRAMBundleRegistry : public RAMBundleRegistry {
public:
  JniRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, AAssetManager *assetManager, const std::string& entryFile);

protected:
  virtual std::unique_ptr<JSModulesUnbundle> bundleById(uint32_t index) const override;
private:
  AAssetManager *m_assetManager = nullptr;
  std::string m_baseDirectoryPath;
};

}
}

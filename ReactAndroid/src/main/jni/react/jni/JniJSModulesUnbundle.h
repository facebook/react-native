// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <android/asset_manager.h>
#include <react/JSModulesUnbundle.h>

namespace facebook {
namespace react {

class JniJSModulesUnbundle : public JSModulesUnbundle {
  /**
   * This implementation reads modules as single file from the assets of an apk.
   */
public:
  JniJSModulesUnbundle() = default;
  JniJSModulesUnbundle(AAssetManager *assetManager, const std::string& entryFile);
  JniJSModulesUnbundle(JniJSModulesUnbundle&& other) = delete;
  JniJSModulesUnbundle& operator= (JSModulesUnbundle&& other) = delete;

  static bool isUnbundle(
    AAssetManager *assetManager,
    const std::string& assetName);
  virtual Module getModule(uint32_t moduleId) const override;
private:
  AAssetManager *m_assetManager = nullptr;
  std::string m_moduleDirectory;
};

}
}

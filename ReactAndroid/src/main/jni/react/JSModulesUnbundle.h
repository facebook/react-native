// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <android/asset_manager.h>
#include <cstdint>
#include <fb/noncopyable.h>
#include <string>
#include <stdexcept>

namespace facebook {
namespace react {

class JSModulesUnbundle : noncopyable {
  /**
   * Represents the set of JavaScript modules that the application consists of.
   * The source code of each module can be retrieved by module ID.
   * This implementation reads modules as single file from the assets of an apk.
   *
   * The class is non-copyable because copying instances might involve copying
   * several megabytes of memory.
   */
public:
  class ModuleNotFound : public std::out_of_range {
    using std::out_of_range::out_of_range;
  };
  struct Module {
    std::string name;
    std::string code;
  };

  JSModulesUnbundle() = default;
  JSModulesUnbundle(AAssetManager *assetManager, const std::string& entryFile);
  JSModulesUnbundle(JSModulesUnbundle&& other) noexcept;
  JSModulesUnbundle& operator= (JSModulesUnbundle&& other) noexcept;

  static bool isUnbundle(
    AAssetManager *assetManager,
    const std::string& assetName);
  Module getModule(uint32_t moduleId) const;

private:
  AAssetManager *m_assetManager = nullptr;
  std::string m_moduleDirectory;
};

}
}

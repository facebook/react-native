// Copyright 2004-present Facebook. All Rights Reserved.

#include "JniRAMBundleRegistry.h"

#include <libgen.h>

#include <folly/Conv.h>
#include <folly/Memory.h>

#include "JniJSModulesUnbundle.h"

namespace facebook {
namespace react {

static std::string jsBundlesDir(const std::string& entryFile) {
  std::string dir = dirname(entryFile.c_str());
  std::string entryName = basename(entryFile.c_str());
  entryName.erase(entryName.find("."), std::string::npos);

  std::string path = "js-bundles/" + entryName + "/";
  // android's asset manager does not work with paths that start with a dot
  return dir == "." ? path : dir + "/" + path;
}

JniRAMBundleRegistry::JniRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, AAssetManager *assetManager, const std::string& entryFile) :
  RAMBundleRegistry(std::move(mainBundle)),
  m_assetManager(assetManager),
  m_baseDirectoryPath(jsBundlesDir(entryFile)) {}

std::unique_ptr<JSModulesUnbundle> JniRAMBundleRegistry::bundleById(uint32_t index) const {
  std::string bundlePathById = m_baseDirectoryPath + folly::to<std::string>(index) + "/js-modules/";
  return folly::make_unique<JniJSModulesUnbundle>(m_assetManager, bundlePathById);
}

}
}

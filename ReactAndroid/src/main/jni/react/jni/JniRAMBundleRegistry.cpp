// Copyright 2004-present Facebook. All Rights Reserved.

#include "JniRAMBundleRegistry.h"

#include <folly/Conv.h>
#include <folly/Memory.h>

#include "JniJSModulesUnbundle.h"

namespace facebook {
namespace react {

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

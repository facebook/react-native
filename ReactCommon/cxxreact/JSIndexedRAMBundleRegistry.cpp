// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSIndexedRAMBundleRegistry.h"

#include <cxxreact/JSIndexedRAMBundle.h>
#include <folly/Memory.h>

#include "oss-compat-util.h"

namespace facebook {
namespace react {

JSIndexedRAMBundleRegistry::JSIndexedRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, const std::string& entryFile):
    RAMBundleRegistry(std::move(mainBundle)), m_baseDirectoryPath(jsBundlesDir(entryFile)) {}

std::unique_ptr<JSModulesUnbundle> JSIndexedRAMBundleRegistry::bundleById(uint32_t index) const {
  std::string bundlePathById = m_baseDirectoryPath + toString(index) + ".jsbundle";
  return folly::make_unique<JSIndexedRAMBundle>(bundlePathById.c_str());
}

}  // namespace react
}  // namespace facebook

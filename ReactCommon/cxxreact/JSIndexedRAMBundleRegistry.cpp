// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSIndexedRAMBundleRegistry.h"

#include <cxxreact/JSIndexedRAMBundle.h>
#include <folly/Memory.h>

#include "oss-compat-util.h"

namespace facebook {
namespace react {

std::unique_ptr<JSModulesUnbundle> JSIndexedRAMBundleRegistry::bundleById(uint32_t index) const {
  return folly::make_unique<JSIndexedRAMBundle>(bundlePathById(index).c_str());
}

std::string JSIndexedRAMBundleRegistry::bundlePathById(uint32_t index) const {
  return m_baseDirectoryPath + "/js-bundles/" + toString(index) + ".jsbundle";
}

}  // namespace react
}  // namespace facebook

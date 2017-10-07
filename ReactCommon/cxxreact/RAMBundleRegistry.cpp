// Copyright 2004-present Facebook. All Rights Reserved.

#include "RAMBundleRegistry.h"

#include <libgen.h>

namespace facebook {
namespace react {

constexpr uint32_t RAMBundleRegistry::MAIN_BUNDLE_ID;

RAMBundleRegistry::RAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle) {
  m_bundles.emplace(MAIN_BUNDLE_ID, std::move(mainBundle));
}

JSModulesUnbundle::Module RAMBundleRegistry::getModule(uint32_t bundleId, uint32_t moduleId) {
  if (m_bundles.find(bundleId) == m_bundles.end()) {
    m_bundles.emplace(bundleId, this->bundleById(bundleId));
  }

  return getBundle(bundleId)->getModule(moduleId);
}

JSModulesUnbundle *RAMBundleRegistry::getBundle(uint32_t bundleId) const {
  return m_bundles.at(bundleId).get();
}

std::string RAMBundleRegistry::jsBundlesDir(std::string entryFile) {
  char *pEntryFile = const_cast<char *>(entryFile.c_str());
  std::string dir = dirname(pEntryFile);
  std::string entryName = basename(pEntryFile);

  std::size_t dotPosition = entryName.find(".");
  if (dotPosition != std::string::npos) {
    entryName.erase(dotPosition, std::string::npos);
  }

  std::string path = "js-bundles/" + entryName + "/";
  // android's asset manager does not work with paths that start with a dot
  return dir == "." ? path : dir + "/" + path;
}

}  // namespace react
}  // namespace facebook

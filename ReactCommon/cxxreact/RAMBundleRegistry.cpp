// Copyright 2004-present Facebook. All Rights Reserved.

#include "RAMBundleRegistry.h"

#include <folly/Memory.h>

#include <libgen.h>

namespace facebook {
namespace react {

constexpr uint32_t RAMBundleRegistry::MAIN_BUNDLE_ID;

std::unique_ptr<RAMBundleRegistry> RAMBundleRegistry::singleBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle) {
  RAMBundleRegistry *registry = new RAMBundleRegistry(std::move(mainBundle));
  return std::unique_ptr<RAMBundleRegistry>(registry);
}

std::unique_ptr<RAMBundleRegistry> RAMBundleRegistry::multipleBundlesRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, std::function<std::unique_ptr<JSModulesUnbundle>(std::string)> factory) {
  RAMBundleRegistry *registry = new RAMBundleRegistry(std::move(mainBundle), std::move(factory));
  return std::unique_ptr<RAMBundleRegistry>(registry);
}

RAMBundleRegistry::RAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, std::function<std::unique_ptr<JSModulesUnbundle>(std::string)> factory): m_factory(factory) {
  m_bundles.emplace(MAIN_BUNDLE_ID, std::move(mainBundle));
}

void RAMBundleRegistry::registerBundle(uint32_t bundleId, std::string bundlePath) {
  m_bundlePaths.emplace(bundleId, bundlePath);
}

JSModulesUnbundle::Module RAMBundleRegistry::getModule(uint32_t bundleId, uint32_t moduleId) {
  if (m_bundles.find(bundleId) == m_bundles.end()) {
    if (!m_factory) {
      throw std::runtime_error("You need to register factory function in order to support multiple RAM bundles.");
    }

    auto bundlePath = m_bundlePaths.find(bundleId);
    if (bundlePath == m_bundlePaths.end()) {
      throw std::runtime_error("In order to fetch RAM bundle from the registry, its file path needs to be registered first.");
    }
    m_bundles.emplace(bundleId, m_factory(bundlePath->second));
  }

  return getBundle(bundleId)->getModule(moduleId);
}

JSModulesUnbundle *RAMBundleRegistry::getBundle(uint32_t bundleId) const {
  return m_bundles.at(bundleId).get();
}

}  // namespace react
}  // namespace facebook

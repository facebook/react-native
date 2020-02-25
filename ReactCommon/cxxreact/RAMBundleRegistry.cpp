/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RAMBundleRegistry.h"

#include <folly/String.h>

#include <memory>

namespace facebook {
namespace react {

constexpr uint32_t RAMBundleRegistry::MAIN_BUNDLE_ID;

RAMBundleRegistry::RAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle) {
  m_bundles.emplace(MAIN_BUNDLE_ID, std::move(mainBundle));
}

void RAMBundleRegistry::registerBundle(
    uint32_t bundleId,
    std::unique_ptr<JSModulesUnbundle> bundle) {
  if (m_bundles.find(bundleId) != m_bundles.end()) {
    throw std::runtime_error(
      folly::to<std::string>("Bundle with id -  ", bundleId, " already exists")
    );
  }
  m_bundles.emplace(bundleId, std::move(bundle));
}

JSModulesUnbundle::Module RAMBundleRegistry::getModule(
    uint32_t bundleId,
    uint32_t moduleId) {
  if (m_bundles.find(bundleId) == m_bundles.end()) {
    throw std::runtime_error(
      folly::to<std::string>("Couldn't find bundle with id - ", bundleId)
    );
  }
  return getBundle(bundleId)->getModule(moduleId);
}

JSModulesUnbundle *RAMBundleRegistry::getBundle(uint32_t bundleId) const {
  return m_bundles.at(bundleId).get();
}

} // namespace react
} // namespace facebook

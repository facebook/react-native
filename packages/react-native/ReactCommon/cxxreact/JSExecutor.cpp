/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSExecutor.h"

#include "RAMBundleRegistry.h"

#include <jsinspector-modern/ReactCdp.h>

#include <array>

namespace facebook::react {

std::string JSExecutor::getSyntheticBundlePath(
    uint32_t bundleId,
    const std::string& bundlePath) {
#ifndef RCT_FIT_RM_OLD_RUNTIME
  if (bundleId == RAMBundleRegistry::MAIN_BUNDLE_ID) {
    return bundlePath;
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  std::array<char, 32> buffer{};
  std::snprintf(buffer.data(), buffer.size(), "seg-%u.js", bundleId);
  return buffer.data();
}

jsinspector_modern::RuntimeTargetDelegate&
JSExecutor::getRuntimeTargetDelegate() {
  if (!runtimeTargetDelegate_) {
    runtimeTargetDelegate_.emplace(getDescription());
  }
  return *runtimeTargetDelegate_;
}

} // namespace facebook::react

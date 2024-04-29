/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSExecutor.h"

#include "RAMBundleRegistry.h"

#include <folly/Conv.h>
#include <jsinspector-modern/ReactCdp.h>

#include <chrono>

namespace facebook::react {

std::string JSExecutor::getSyntheticBundlePath(
    uint32_t bundleId,
    const std::string& bundlePath) {
  if (bundleId == RAMBundleRegistry::MAIN_BUNDLE_ID) {
    return bundlePath;
  }
  return folly::to<std::string>("seg-", bundleId, ".js");
}

double JSExecutor::performanceNow() {
  auto time = std::chrono::steady_clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(
                      time.time_since_epoch())
                      .count();

  constexpr double NANOSECONDS_IN_MILLISECOND = 1000000.0;
  return duration / NANOSECONDS_IN_MILLISECOND;
}

jsinspector_modern::RuntimeTargetDelegate&
JSExecutor::getRuntimeTargetDelegate() {
  if (!runtimeTargetDelegate_) {
    runtimeTargetDelegate_.emplace(getDescription());
  }
  return *runtimeTargetDelegate_;
}

} // namespace facebook::react

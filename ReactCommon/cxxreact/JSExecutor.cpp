// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSExecutor.h"

#include "RAMBundleRegistry.h"

#include <folly/Conv.h>

namespace facebook {
namespace react {

std::string JSExecutor::getSyntheticBundlePath(
    uint32_t bundleId,
    const std::string& bundlePath) {
  if (bundleId == RAMBundleRegistry::MAIN_BUNDLE_ID) {
    return bundlePath;
  }
  return folly::to<std::string>("seg-", bundleId, ".js");
}

}
}

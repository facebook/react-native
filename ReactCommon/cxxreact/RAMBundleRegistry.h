// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <utility>

#include <cxxreact/JSModulesUnbundle.h>

namespace facebook {
namespace react {

class RAMBundleRegistry {
public:
  constexpr static uint32_t MAIN_BUNDLE_ID = 0;

  explicit RAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle);
  JSModulesUnbundle::Module getModule(uint32_t bundleId, uint32_t moduleId);
private:
  JSModulesUnbundle *getBundle(uint32_t bundleId) const;

  std::unordered_map<uint32_t, std::unique_ptr<JSModulesUnbundle>> m_bundles;
};

}  // namespace react
}  // namespace facebook

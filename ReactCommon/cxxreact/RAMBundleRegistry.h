/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <functional>
#include <memory>
#include <unordered_map>
#include <utility>

#include <cxxreact/JSModulesUnbundle.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class RN_EXPORT RAMBundleRegistry {
public:
  constexpr static uint32_t MAIN_BUNDLE_ID = 0;

  RAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle);

  RAMBundleRegistry(RAMBundleRegistry&&) = default;
  RAMBundleRegistry& operator=(RAMBundleRegistry&&) = default;

  void registerBundle(uint32_t bundleId, std::unique_ptr<JSModulesUnbundle> bundle);
  JSModulesUnbundle::Module getModule(uint32_t bundleId, uint32_t moduleId);
  virtual ~RAMBundleRegistry() {};
private:
  JSModulesUnbundle* getBundle(uint32_t bundleId) const;

  std::unordered_map<uint32_t, std::unique_ptr<JSModulesUnbundle>> m_bundles;
};

}  // namespace react
}  // namespace facebook

// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <utility>

#include <cxxreact/JSModulesUnbundle.h>
#include <jschelpers/noncopyable.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class RN_EXPORT RAMBundleRegistry : noncopyable {
public:
  constexpr static uint32_t MAIN_BUNDLE_ID = 0;

  explicit RAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle);
  RAMBundleRegistry(RAMBundleRegistry&&) = default;
  RAMBundleRegistry& operator=(RAMBundleRegistry&&) = default;

  JSModulesUnbundle::Module getModule(uint32_t bundleId, uint32_t moduleId);
  virtual ~RAMBundleRegistry() {};
protected:
  std::string jsBundlesDir(std::string entryFile);
  virtual std::unique_ptr<JSModulesUnbundle> bundleById(uint32_t index) const {
    throw std::runtime_error("Please, override this method in a subclass to support multiple RAM bundles.");
  }
private:
  JSModulesUnbundle *getBundle(uint32_t bundleId) const;

  std::unordered_map<uint32_t, std::unique_ptr<JSModulesUnbundle>> m_bundles;
};

}  // namespace react
}  // namespace facebook

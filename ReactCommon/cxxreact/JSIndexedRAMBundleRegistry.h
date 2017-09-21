// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/RAMBundleRegistry.h>

namespace facebook {
namespace react {

class JSIndexedRAMBundleRegistry: public RAMBundleRegistry {
public:
  JSIndexedRAMBundleRegistry(
    std::unique_ptr<JSModulesUnbundle> mainBundle,
    std::string baseDirectoryPath):
  RAMBundleRegistry(std::move(mainBundle)), m_baseDirectoryPath(baseDirectoryPath) {}

protected:
  virtual std::unique_ptr<JSModulesUnbundle> bundleById(uint32_t index) const override;
private:
  std::string bundlePathById(uint32_t index) const;

  std::string m_baseDirectoryPath;
};

}  // namespace react
}  // namespace facebook

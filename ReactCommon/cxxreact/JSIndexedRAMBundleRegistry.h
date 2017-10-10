// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/RAMBundleRegistry.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class RN_EXPORT JSIndexedRAMBundleRegistry: public RAMBundleRegistry {
public:
  JSIndexedRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, const std::string& entryFile);

protected:
  virtual std::unique_ptr<JSModulesUnbundle> bundleById(uint32_t index) const override;
private:
  std::string m_baseDirectoryPath;
};

}  // namespace react
}  // namespace facebook

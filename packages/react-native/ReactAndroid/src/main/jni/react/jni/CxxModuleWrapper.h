/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CxxModuleWrapperBase.h"

namespace facebook::react {

class CxxModuleWrapper : public jni::HybridClass<CxxModuleWrapper, CxxModuleWrapperBase> {
 public:
  constexpr static const char *const kJavaDescriptor = "Lcom/facebook/react/bridge/CxxModuleWrapper;";

  std::string getName() override
  {
    return module_->getName();
  }

  // This steals ownership of the underlying module for use by the C++ bridge
  std::unique_ptr<xplat::module::CxxModule> getModule() override
  {
    return std::move(module_);
  }

 protected:
  friend HybridBase;

  explicit CxxModuleWrapper(std::unique_ptr<xplat::module::CxxModule> module) : module_(std::move(module)) {}

  std::unique_ptr<xplat::module::CxxModule> module_;
};

} // namespace facebook::react

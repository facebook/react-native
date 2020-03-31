/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/SharedProxyCxxModule.h>

#include "CxxModuleWrapperBase.h"

namespace facebook {
namespace react {

class CxxSharedModuleWrapper : public CxxModuleWrapperBase {
 public:
  std::string getName() override {
    return shared_->getName();
  }

  std::unique_ptr<xplat::module::CxxModule> getModule() override {
    // Instead of just moving out the stored CxxModule, this creates a
    // proxy which passes calls to the shared stored CxxModule.

    return std::make_unique<xplat::module::SharedProxyCxxModule>(shared_);
  }

 protected:
  explicit CxxSharedModuleWrapper(
      std::unique_ptr<xplat::module::CxxModule> module)
      : shared_(std::move(module)) {}

  std::shared_ptr<xplat::module::CxxModule> shared_;
};

} // namespace react
} // namespace facebook

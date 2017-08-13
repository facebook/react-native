// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/SharedProxyCxxModule.h>

#include "CxxModuleWrapperBase.h"

namespace facebook {
namespace react {

class CxxSharedModuleWrapper: public CxxModuleWrapperBase {
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
  explicit CxxSharedModuleWrapper(std::unique_ptr<xplat::module::CxxModule> module)
    : shared_(std::move(module)) {}

  std::shared_ptr<xplat::module::CxxModule> shared_;
};

}
}

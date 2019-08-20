// Copyright 2004-present Facebook. All Rights Reserved.

#include "RuntimeAdapter.h"

namespace facebook {
namespace hermes {
namespace inspector {

RuntimeAdapter::~RuntimeAdapter() = default;

void RuntimeAdapter::tickleJs() {}

SharedRuntimeAdapter::SharedRuntimeAdapter(
    std::shared_ptr<HermesRuntime> runtime)
    : runtime_(std::move(runtime)) {}

SharedRuntimeAdapter::~SharedRuntimeAdapter() = default;

HermesRuntime &SharedRuntimeAdapter::getRuntime() {
  return *runtime_;
}

} // namespace inspector
} // namespace hermes
} // namespace facebook

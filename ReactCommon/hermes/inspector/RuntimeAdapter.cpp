/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

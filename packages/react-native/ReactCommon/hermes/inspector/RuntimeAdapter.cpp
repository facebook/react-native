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
    std::shared_ptr<jsi::Runtime> runtime,
    debugger::Debugger &debugger)
    : runtime_(std::move(runtime)), debugger_(debugger) {}

SharedRuntimeAdapter::~SharedRuntimeAdapter() = default;

jsi::Runtime &SharedRuntimeAdapter::getRuntime() {
  return *runtime_;
}

debugger::Debugger &SharedRuntimeAdapter::getDebugger() {
  return debugger_;
}

} // namespace inspector
} // namespace hermes
} // namespace facebook

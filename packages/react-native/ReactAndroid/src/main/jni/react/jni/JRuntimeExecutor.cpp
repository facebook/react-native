/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JRuntimeExecutor.h"

#include <utility>

namespace facebook::react {

JRuntimeExecutor::JRuntimeExecutor(RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(std::move(runtimeExecutor)) {}

RuntimeExecutor JRuntimeExecutor::get() {
  return runtimeExecutor_;
}

} // namespace facebook::react

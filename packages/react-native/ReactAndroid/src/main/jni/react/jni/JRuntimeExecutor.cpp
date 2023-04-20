/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JRuntimeExecutor.h"

namespace facebook {
namespace react {

JRuntimeExecutor::JRuntimeExecutor(RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(runtimeExecutor) {}

RuntimeExecutor JRuntimeExecutor::get() {
  return runtimeExecutor_;
}

} // namespace react
} // namespace facebook

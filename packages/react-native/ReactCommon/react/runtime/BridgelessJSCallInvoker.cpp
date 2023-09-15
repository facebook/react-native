/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BridgelessJSCallInvoker.h"

#include <stdexcept>

namespace facebook::react {

BridgelessJSCallInvoker::BridgelessJSCallInvoker(
    RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(std::move(runtimeExecutor)) {}

void BridgelessJSCallInvoker::invokeAsync(std::function<void()>&& func) {
  runtimeExecutor_([func = std::move(func)](jsi::Runtime& runtime) { func(); });
}

void BridgelessJSCallInvoker::invokeSync(std::function<void()>&& func) {
  // TODO: Implement this method. The TurboModule infra doesn't call invokeSync.
  throw std::runtime_error(
      "Synchronous native -> JS calls are currently not supported.");
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCallInvoker.h"

namespace facebook ::react {

JSCallInvoker::JSCallInvoker(RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(runtimeExecutor) {}

void JSCallInvoker::invokeAsync(std::function<void()> &&func) {
  runtimeExecutor_([func = std::move(func)](jsi::Runtime &runtime) { func(); });
}

void JSCallInvoker::invokeSync(std::function<void()> &&func) {
  // TODO: Implement this method. The TurboModule infra doesn't call invokeSync.
}

} // namespace facebook::react

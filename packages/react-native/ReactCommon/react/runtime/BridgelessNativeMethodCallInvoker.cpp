/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BridgelessNativeMethodCallInvoker.h"

namespace facebook::react {

BridgelessNativeMethodCallInvoker::BridgelessNativeMethodCallInvoker(
    std::shared_ptr<MessageQueueThread> messageQueueThread)
    : messageQueueThread_(std::move(messageQueueThread)) {}

void BridgelessNativeMethodCallInvoker::invokeAsync(
    const std::string& methodName,
    std::function<void()>&& func) {
  messageQueueThread_->runOnQueue(std::move(func));
}

void BridgelessNativeMethodCallInvoker::invokeSync(
    const std::string& methodName,
    std::function<void()>&& func) {
  messageQueueThread_->runOnQueueSync(std::move(func));
}

} // namespace facebook::react

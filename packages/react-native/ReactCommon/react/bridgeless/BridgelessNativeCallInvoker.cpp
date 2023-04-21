/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BridgelessNativeCallInvoker.h"

namespace facebook::react {

BridgelessNativeCallInvoker::BridgelessNativeCallInvoker(
    std::shared_ptr<MessageQueueThread> messageQueueThread)
    : messageQueueThread_(std::move(messageQueueThread)) {}

void BridgelessNativeCallInvoker::invokeAsync(std::function<void()> &&func) {
  messageQueueThread_->runOnQueue(std::move(func));
}

void BridgelessNativeCallInvoker::invokeSync(std::function<void()> &&func) {
  messageQueueThread_->runOnQueueSync(std::move(func));
}

} // namespace facebook::react

// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "BridgelessNativeCallInvoker.h"

#include <exception>
#include <utility>

namespace facebook {
namespace react {

BridgelessNativeCallInvoker::BridgelessNativeCallInvoker(
    std::shared_ptr<JMessageQueueThread> messageQueueThread)
    : messageQueueThread_(std::move(messageQueueThread)) {}

void BridgelessNativeCallInvoker::invokeAsync(std::function<void()> &&func) {
  messageQueueThread_->runOnQueue(std::move(func));
}

void BridgelessNativeCallInvoker::invokeSync(std::function<void()> &&func) {
  messageQueueThread_->runOnQueueSync(std::move(func));
}

} // namespace react
} // namespace facebook

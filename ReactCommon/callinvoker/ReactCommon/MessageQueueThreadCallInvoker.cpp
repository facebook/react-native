/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MessageQueueThreadCallInvoker.h"

namespace facebook {
namespace react {

MessageQueueThreadCallInvoker::MessageQueueThreadCallInvoker(
    std::shared_ptr<MessageQueueThread> moduleMessageQueue)
    : moduleMessageQueue_(moduleMessageQueue) {}

void MessageQueueThreadCallInvoker::invokeAsync(std::function<void()> &&func) {
  moduleMessageQueue_->runOnQueue(std::move(func));
}

} // namespace react
} // namespace facebook

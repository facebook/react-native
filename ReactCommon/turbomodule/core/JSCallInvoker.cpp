/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCallInvoker.h"

#include <cxxreact/MessageQueueThread.h>

namespace facebook {
namespace react {

JSCallInvoker::JSCallInvoker(std::shared_ptr<MessageQueueThread> jsThread)
  : jsThread_(jsThread) {}

void JSCallInvoker::invokeAsync(std::function<void()>&& func) {
  jsThread_->runOnQueue(std::move(func));
}

void JSCallInvoker::invokeSync(std::function<void()>&& func) {
  jsThread_->runOnQueueSync(std::move(func));
}

} // namespace react
} // namespace facebook

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCallInvoker.h"

#include <cxxreact/Instance.h>

namespace facebook {
namespace react {

JSCallInvoker::JSCallInvoker(std::shared_ptr<Instance> reactInstance)
  : reactInstance_(reactInstance) {}

void JSCallInvoker::invokeAsync(std::function<void()>&& func) {
  if (reactInstance_ == nullptr) {
    return;
  }
  reactInstance_->invokeAsync(std::move(func));
}

} // namespace react
} // namespace facebook

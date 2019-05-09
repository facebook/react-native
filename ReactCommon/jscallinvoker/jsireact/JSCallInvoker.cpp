/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsireact/JSCallInvoker.h>
#include <cxxreact/Instance.h>

namespace facebook {
namespace react {

JSCallInvoker::JSCallInvoker(std::weak_ptr<Instance> reactInstance)
    : reactInstance_(reactInstance) {}

void JSCallInvoker::invokeAsync(std::function<void()> &&func) {
  auto instance = reactInstance_.lock();
  if (instance == nullptr) {
    return;
  }
  instance->invokeAsync(std::move(func));
}

} // namespace react
} // namespace facebook

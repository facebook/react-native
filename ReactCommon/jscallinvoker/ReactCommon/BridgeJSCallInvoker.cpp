/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/BridgeJSCallInvoker.h>
#include <cxxreact/Instance.h>

namespace facebook {
namespace react {

BridgeJSCallInvoker::BridgeJSCallInvoker(std::weak_ptr<Instance> reactInstance)
    : reactInstance_(reactInstance) {}

void BridgeJSCallInvoker::invokeAsync(std::function<void()> &&func) {
  auto instance = reactInstance_.lock();
  if (instance == nullptr) {
    return;
  }
  instance->invokeAsync(std::move(func));
}

} // namespace react
} // namespace facebook

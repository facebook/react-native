/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

namespace facebook {
namespace react {

class Instance;

/**
 * A generic native-to-JS call invoker. It guarantees that any calls from any
 * thread are queued on the right JS thread.
 *
 * For now, this is a thin-wrapper around existing bridge (`Instance`). Eventually,
 * it should be consolidated with Fabric implementation so there's only one
 * API to call JS from native, whether synchronously or asynchronously.
 * Also, this class should not depend on `Instance` in the future.
 */
class JSCallInvoker {
public:
  JSCallInvoker(std::weak_ptr<Instance> reactInstance);

  void invokeAsync(std::function<void()>&& func);
  // TODO: add sync support

private:
  std::weak_ptr<Instance> reactInstance_;
};

} // namespace react
} // namespace facebook

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

class MessageQueueThread;

/**
 * A generic native-to-JS call invoker. It guarantees that any calls from any
 * thread are queued on the right JS thread.
 *
 * For now, this is a thin-wrapper around existing MessageQueueThread. Eventually,
 * it should be consolidated with Fabric implementation so there's only one
 * API to call JS from native, whether synchronously or asynchronously.
 */
class JSCallInvoker {
public:
  JSCallInvoker(std::shared_ptr<MessageQueueThread> jsThread);

  void invokeAsync(std::function<void()>&& func);
  void invokeSync(std::function<void()>&& func);

private:
  std::shared_ptr<MessageQueueThread> jsThread_;
};

} // namespace react
} // namespace facebook

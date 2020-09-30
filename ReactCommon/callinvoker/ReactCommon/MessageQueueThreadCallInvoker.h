/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <ReactCommon/CallInvoker.h>
#include <cxxreact/MessageQueueThread.h>

namespace facebook {
namespace react {

/**
 * Used to schedule async calls on the NativeModuels thread.
 */
class MessageQueueThreadCallInvoker : public CallInvoker {
 public:
  MessageQueueThreadCallInvoker(
      std::shared_ptr<MessageQueueThread> moduleMessageQueue);

  void invokeAsync(std::function<void()> &&func) override;
  // TODO: add sync support

 private:
  std::shared_ptr<MessageQueueThread> moduleMessageQueue_;
};

} // namespace react
} // namespace facebook

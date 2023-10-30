/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/CallInvoker.h>
#include <cxxreact/MessageQueueThread.h>
#include <functional>
#include <memory>

namespace facebook::react {

class BridgelessNativeMethodCallInvoker : public NativeMethodCallInvoker {
 public:
  explicit BridgelessNativeMethodCallInvoker(
      std::shared_ptr<MessageQueueThread> messageQueueThread);
  void invokeAsync(
      const std::string& methodName,
      std::function<void()>&& func) noexcept override;
  void invokeSync(const std::string& methodName, std::function<void()>&& func)
      override;

 private:
  std::shared_ptr<MessageQueueThread> messageQueueThread_;
};

} // namespace facebook::react

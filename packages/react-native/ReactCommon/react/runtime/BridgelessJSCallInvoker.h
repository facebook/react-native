/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <functional>

namespace facebook::react {

/**
 * A native-to-JS call invoker that uses the RuntimeExecutor. It guarantees that
 * any calls from any thread are queued on the right JS thread.
 */
class BridgelessJSCallInvoker : public CallInvoker {
 public:
  explicit BridgelessJSCallInvoker(RuntimeExecutor runtimeExecutor);
  void invokeAsync(std::function<void()>&& func) noexcept override;
  void invokeSync(std::function<void()>&& func) override;

 private:
  RuntimeExecutor runtimeExecutor_;
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/RuntimeExecutor.h>

namespace facebook::react {

/**
 * A native-to-JS call invoker that uses the RuntimeExecutor. Inspired by
 * BridgeJSCallInvoker. It guarantees that any calls from any thread are queued
 * on the right JS thread.
 */
class JSCallInvoker : public CallInvoker {
 public:
  JSCallInvoker(RuntimeExecutor runtimeExecutor);
  void invokeAsync(std::function<void()> &&func) override;
  void invokeSync(std::function<void()> &&func) override;

 private:
  RuntimeExecutor runtimeExecutor_;
};

} // namespace facebook::react

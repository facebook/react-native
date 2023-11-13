/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsireact/JSIExecutor.h>

namespace facebook::react {

class JSCExecutorFactory : public JSExecutorFactory {
 public:
  explicit JSCExecutorFactory(JSIExecutor::RuntimeInstaller runtimeInstaller)
      : runtimeInstaller_(std::move(runtimeInstaller)) {}

  // [macOS
  void setEnableDebugger(bool enableDebugger);

  void setDebuggerName(const std::string &debuggerName);
  // macOS]

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  JSIExecutor::RuntimeInstaller runtimeInstaller_;

  // [macOS
#if DEBUG
  bool enableDebugger_ = true;
#else
  bool enableDebugger_ = false;
#endif
  std::string debuggerName_ = "JSC React Native";
  // macOS]
};

} // namespace facebook::react

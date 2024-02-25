/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/hermes.h>
#include <jsireact/JSIExecutor.h>
#include <utility>

namespace facebook::react {

class HermesExecutorFactory : public JSExecutorFactory {
 public:
  explicit HermesExecutorFactory(
      JSIExecutor::RuntimeInstaller runtimeInstaller,
      const JSIScopedTimeoutInvoker& timeoutInvoker =
          JSIExecutor::defaultTimeoutInvoker,
      ::hermes::vm::RuntimeConfig runtimeConfig = defaultRuntimeConfig())
      : runtimeInstaller_(runtimeInstaller),
        timeoutInvoker_(timeoutInvoker),
        runtimeConfig_(std::move(runtimeConfig)) {
    assert(timeoutInvoker_ && "Should not have empty timeoutInvoker");
  }

  void setEnableDebugger(bool enableDebugger);

  void setDebuggerName(const std::string& debuggerName);

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  static ::hermes::vm::RuntimeConfig defaultRuntimeConfig();

  JSIExecutor::RuntimeInstaller runtimeInstaller_;
  JSIScopedTimeoutInvoker timeoutInvoker_;
  ::hermes::vm::RuntimeConfig runtimeConfig_;
  bool enableDebugger_ = true;
  std::string debuggerName_ = "Hermes React Native";
};

class HermesExecutor : public JSIExecutor {
 public:
  HermesExecutor(
      std::shared_ptr<jsi::Runtime> runtime,
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue,
      const JSIScopedTimeoutInvoker& timeoutInvoker,
      RuntimeInstaller runtimeInstaller,
      hermes::HermesRuntime& hermesRuntime);

  virtual std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate>
  createAgentDelegate(
      jsinspector_modern::FrontendChannel frontendChannel,
      jsinspector_modern::SessionState& sessionState,
      std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const jsinspector_modern::ExecutionContextDescription&
          executionContextDescription) override;

 private:
  JSIScopedTimeoutInvoker timeoutInvoker_;
  std::shared_ptr<MessageQueueThread> jsQueue_;
  std::shared_ptr<jsi::Runtime> runtime_;
  hermes::HermesRuntime& hermesRuntime_;
};

} // namespace facebook::react

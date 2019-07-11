// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <hermes/hermes.h>
#include <jsireact/JSIExecutor.h>
#include <functional>
#include <utility>

namespace facebook {
namespace react {

class HermesExecutorFactory : public JSExecutorFactory {
 public:
  explicit HermesExecutorFactory(
      JSIExecutor::RuntimeInstaller runtimeInstaller,
      const JSIScopedTimeoutInvoker& timeoutInvoker =
          JSIExecutor::defaultTimeoutInvoker,
      ::hermes::vm::RuntimeConfig runtimeConfig = ::hermes::vm::RuntimeConfig())
      : runtimeInstaller_(runtimeInstaller),
        timeoutInvoker_(timeoutInvoker),
        runtimeConfig_(std::move(runtimeConfig)) {
    assert(timeoutInvoker_ && "Should not have empty timeoutInvoker");
  }

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  JSIExecutor::RuntimeInstaller runtimeInstaller_;
  JSIScopedTimeoutInvoker timeoutInvoker_;
  ::hermes::vm::RuntimeConfig runtimeConfig_;
};

class HermesExecutor : public JSIExecutor {
 public:
  HermesExecutor(
      std::shared_ptr<jsi::Runtime> runtime,
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue,
      const JSIScopedTimeoutInvoker& timeoutInvoker,
      RuntimeInstaller runtimeInstaller);

 private:
  JSIScopedTimeoutInvoker timeoutInvoker_;
};

} // namespace react
} // namespace facebook

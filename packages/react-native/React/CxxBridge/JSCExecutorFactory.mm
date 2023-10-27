/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCExecutorFactory.h"

#import <jsc/JSCRuntime.h>

#import <memory>

namespace facebook::react {

void JSCExecutorFactory::setEnableDebugger(bool enableDebugger) {
  enableDebugger_ = enableDebugger;
}

void JSCExecutorFactory::setDebuggerName(const std::string &debuggerName) {
  debuggerName_ = debuggerName;
}

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue)
{
  facebook::jsc::RuntimeConfig rc = {
    .enableDebugger = enableDebugger_,
    .debuggerName = debuggerName_,
  };
  return std::make_unique<JSIExecutor>(facebook::jsc::makeJSCRuntime(std::move(rc)), delegate, JSIExecutor::defaultTimeoutInvoker, runtimeInstaller_);
}
} // namespace facebook::react

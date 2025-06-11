/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_FIT_RM_OLD_RUNTIME

#include <jsireact/JSIExecutor.h>

namespace facebook::react {

class JSCExecutorFactory : public JSExecutorFactory {
 public:
  explicit JSCExecutorFactory(JSIExecutor::RuntimeInstaller runtimeInstaller)
      : runtimeInstaller_(std::move(runtimeInstaller)) {}

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  JSIExecutor::RuntimeInstaller runtimeInstaller_;
};

} // namespace facebook::react

#endif // RCT_FIT_RM_OLD_RUNTIME

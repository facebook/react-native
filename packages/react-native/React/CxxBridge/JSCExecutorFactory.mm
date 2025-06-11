/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCExecutorFactory.h"

#ifndef RCT_FIT_RM_OLD_RUNTIME

#import <jsc/JSCRuntime.h>

#import <memory>

namespace facebook::react {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue)
{
  return std::make_unique<JSIExecutor>(
      facebook::jsc::makeJSCRuntime(), delegate, JSIExecutor::defaultTimeoutInvoker, runtimeInstaller_);
}

} // namespace facebook::react

#endif // RCT_FIT_RM_OLD_RUNTIME

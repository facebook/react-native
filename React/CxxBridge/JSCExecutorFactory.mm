/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCExecutorFactory.h"

#import <jsi/JSCRuntime.h>

#import <memory>

namespace facebook {
namespace react {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue)
{
  return std::make_unique<JSIExecutor>(
      facebook::jsc::makeJSCRuntime(), delegate, JSIExecutor::defaultTimeoutInvoker, runtimeInstaller_);
}

} // namespace react
} // namespace facebook

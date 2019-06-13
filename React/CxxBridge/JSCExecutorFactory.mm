/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCExecutorFactory.h"

#import <React/RCTLog.h>
#import <jsi/JSCRuntime.h>

namespace facebook {
namespace react {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
  std::shared_ptr<ExecutorDelegate> delegate,
  std::shared_ptr<MessageQueueThread> jsQueue) {
  return folly::make_unique<JSIExecutor>(
    facebook::jsc::makeJSCRuntime(),
    delegate,
    [](const std::string &message, unsigned int logLevel) {
      _RCTLogJavaScriptInternal(
        static_cast<RCTLogLevel>(logLevel),
        [NSString stringWithUTF8String:message.c_str()]);
    },
    JSIExecutor::defaultTimeoutInvoker,
    std::move(runtimeInstaller_));
}

} // namespace react
} // namespace facebook

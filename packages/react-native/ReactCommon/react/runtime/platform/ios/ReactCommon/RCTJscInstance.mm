/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTJscInstance.h"
#include <jsc/JSCRuntime.h>

namespace facebook {
namespace react {

RCTJscInstance::RCTJscInstance() {}

std::unique_ptr<jsi::Runtime> RCTJscInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept
{
  return jsc::makeJSCRuntime();
}

} // namespace react
} // namespace facebook

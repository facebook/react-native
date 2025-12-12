/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHermesInstance.h"

#import <react/runtime/hermes/HermesInstance.h>

namespace facebook::react {

std::unique_ptr<JSRuntime> RCTHermesInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept
{
  return HermesInstance::createJSRuntime(
      _crashManagerProvider ? _crashManagerProvider() : nullptr, std::move(msgQueueThread), _allocInOldGenBeforeTTI);
}

} // namespace facebook::react

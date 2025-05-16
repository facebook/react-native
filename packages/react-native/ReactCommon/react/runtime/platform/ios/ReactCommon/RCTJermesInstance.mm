/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTJermesInstance.h"

namespace facebook::react {

RCTJermesInstance::RCTJermesInstance() : RCTJermesInstance(nullptr, false) {}

RCTJermesInstance::RCTJermesInstance(CrashManagerProvider crashManagerProvider)
    : RCTJermesInstance(std::move(crashManagerProvider), false)
{
}

RCTJermesInstance::RCTJermesInstance(CrashManagerProvider crashManagerProvider, bool allocInOldGenBeforeTTI)
    : _crashManagerProvider(std::move(crashManagerProvider)),
      _hermesInstance(std::make_unique<JermesInstance>()),
      _allocInOldGenBeforeTTI(allocInOldGenBeforeTTI)
{
}

std::unique_ptr<JSRuntime> RCTJermesInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept
{
  return _hermesInstance->createJSRuntime(
      _crashManagerProvider ? _crashManagerProvider() : nullptr, std::move(msgQueueThread), _allocInOldGenBeforeTTI);
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHermesInstance.h"

namespace facebook::react {

RCTHermesInstance::RCTHermesInstance() : RCTHermesInstance(nullptr, nullptr, false) {}

RCTHermesInstance::RCTHermesInstance(
    std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
    CrashManagerProvider crashManagerProvider)
    : RCTHermesInstance(reactNativeConfig, std::move(crashManagerProvider), false)
{
}

RCTHermesInstance::RCTHermesInstance(
    std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
    CrashManagerProvider crashManagerProvider,
    bool allocInOldGenBeforeTTI)
    : _reactNativeConfig(std::move(reactNativeConfig)),
      _crashManagerProvider(std::move(crashManagerProvider)),
      _hermesInstance(std::make_unique<HermesInstance>()),
      _allocInOldGenBeforeTTI(allocInOldGenBeforeTTI)
{
}

std::unique_ptr<JSRuntime> RCTHermesInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept
{
  return _hermesInstance->createJSRuntime(
      _reactNativeConfig,
      _crashManagerProvider ? _crashManagerProvider() : nullptr,
      std::move(msgQueueThread),
      _allocInOldGenBeforeTTI);
}

} // namespace facebook::react

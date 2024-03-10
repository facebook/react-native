/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHermesInstance.h"

namespace facebook {
namespace react {
RCTHermesInstance::RCTHermesInstance() : RCTHermesInstance(nullptr, nullptr) {}

RCTHermesInstance::RCTHermesInstance(
    std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
    CrashManagerProvider crashManagerProvider)
    : _reactNativeConfig(std::move(reactNativeConfig)),
      _crashManagerProvider(std::move(crashManagerProvider)),
      _hermesInstance(std::make_unique<HermesInstance>())
{
}

std::unique_ptr<JSRuntime> RCTHermesInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept
{
  return _hermesInstance->createJSRuntime(
      _reactNativeConfig, _crashManagerProvider ? _crashManagerProvider() : nullptr, msgQueueThread);
}

} // namespace react
} // namespace facebook

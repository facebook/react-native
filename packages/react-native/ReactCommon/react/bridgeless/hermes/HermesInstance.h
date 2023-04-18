// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <hermes/API/hermes/hermes.h>
#include <jsi/jsi.h>
#import <react/config/ReactNativeConfig.h>

namespace facebook {
namespace react {

class HermesInstance {
 public:
  // This is only needed for Android. Consider removing.
  static std::unique_ptr<jsi::Runtime> createJSRuntime() noexcept;

  static std::unique_ptr<jsi::Runtime> createJSRuntime(
      std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
      std::shared_ptr<::hermes::vm::CrashManager> cm) noexcept;
};

} // namespace react
} // namespace facebook

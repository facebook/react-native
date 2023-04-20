/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/API/hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/config/ReactNativeConfig.h>

namespace facebook::react {

class HermesInstance {
 public:
  // This is only needed for Android. Consider removing.
  static std::unique_ptr<jsi::Runtime> createJSRuntime() noexcept;

  static std::unique_ptr<jsi::Runtime> createJSRuntime(
      std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
      std::shared_ptr<::hermes::vm::CrashManager> cm) noexcept;
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace facebook::react {

/**
 * ReactNative configuration as provided by the hosting app.
 * Provide a sub-class implementation to allow app specific customization.
 */
class ReactNativeConfig {
 public:
  ReactNativeConfig() = default;
  virtual ~ReactNativeConfig() = default;
};

/**
 * Empty configuration that will provide hardcoded default values.
 */
class EmptyReactNativeConfig : public ReactNativeConfig {
 public:
  EmptyReactNativeConfig() = default;
};

} // namespace facebook::react

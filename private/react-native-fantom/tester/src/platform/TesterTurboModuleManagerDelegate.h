/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/nativemodule/TurboModuleManager.h>

namespace facebook::react {
class TesterTurboModuleManagerDelegate {
 public:
  static TurboModuleManagerDelegate getTurboModuleManagerDelegate();
};
} // namespace facebook::react

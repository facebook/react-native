/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/nativemodule/TurboModuleProvider.h>

namespace facebook::react {
class TesterTurboModuleProvider {
 public:
  static TurboModuleProvider getTurboModuleProvider();
};
} // namespace facebook::react

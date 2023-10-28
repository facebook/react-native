/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <memory.h>

namespace facebook {
namespace jsc {

// [macOS
struct RuntimeConfig {
  bool enableDebugger;
  std::string debuggerName;
};
// macOS]

std::unique_ptr<jsi::Runtime> makeJSCRuntime();

std::unique_ptr<jsi::Runtime> makeJSCRuntime(const facebook::jsc::RuntimeConfig& rc); // [macOS]

} // namespace jsc
} // namespace facebook

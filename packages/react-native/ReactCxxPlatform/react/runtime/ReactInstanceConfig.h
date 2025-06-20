/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/flags.h>
#include <string>

namespace facebook::react {

struct ReactInstanceConfig {
#ifdef REACT_NATIVE_DEBUG
  bool enableDebugging{true};
#else
  bool enableDebugging{false};
#endif
  std::string appId;
  std::string deviceName;
};

} // namespace facebook::react

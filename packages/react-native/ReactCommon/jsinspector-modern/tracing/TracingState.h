/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace facebook::react::jsinspector_modern::tracing {

// Keep in sync with `TracingState.kt`
enum class TracingState : int32_t {
  // There is no active trace
  Disabled = 0,
  // Trace is currently running in background mode
  EnabledInBackgroundMode = 1,
  // Trace is currently running in CDP mode
  EnabledInCDPMode = 2,
};

} // namespace facebook::react::jsinspector_modern::tracing

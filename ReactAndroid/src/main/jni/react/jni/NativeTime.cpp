/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeTime.h"
#include <chrono>

namespace facebook {
namespace react {

double reactAndroidNativePerformanceNowHook() {
  auto time = std::chrono::steady_clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(
                      time.time_since_epoch())
                      .count();

  constexpr double NANOSECONDS_IN_MILLISECOND = 1000000.0;

  return duration / NANOSECONDS_IN_MILLISECOND;
}

} // namespace react
} // namespace facebook

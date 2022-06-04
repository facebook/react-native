/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeTime.h"
#include <chrono>

namespace facebook {
namespace react {

double reactAndroidNativePerformanceNowHook() {
  auto time = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::milliseconds>(time).count();
}

} // namespace react
} // namespace facebook

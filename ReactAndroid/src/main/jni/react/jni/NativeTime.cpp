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
  return std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);
}

} // namespace react
} // namespace facebook

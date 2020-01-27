/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <time.h>
#include "NativeTime.h"

namespace facebook {
namespace react {

double reactAndroidNativePerformanceNowHook() {
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC, &now);

  return (now.tv_sec * 1000000000LL + now.tv_nsec) / 1000000.0;
}

} // namespace react
} // namespace facebook

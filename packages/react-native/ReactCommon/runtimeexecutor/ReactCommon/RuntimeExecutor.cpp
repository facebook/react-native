/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeExecutor.h"

namespace facebook::react {

std::mutex& getMainThreadMutex() {
  static std::mutex mainThreadMutex;
  return mainThreadMutex;
}

} // namespace facebook::react

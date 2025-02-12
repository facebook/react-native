/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if defined(_WIN32) || defined(_MSC_VER)

#include "OSCompat.h"

#include <windows.h>

namespace facebook::react::oscompat {

uint64_t getCurrentProcessId() {
  return GetCurrentProcessId();
}

uint64_t getCurrentThreadId() {
  return GetCurrentThreadId();
}

} // namespace facebook::react::oscompat

#endif // defined(_WIN32) || defined(_MSC_VER)

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ExecutionContextManager.h"

#include <cassert>

namespace facebook::react::jsinspector_modern {

int32_t ExecutionContextManager::allocateExecutionContextId() {
  assert(nextExecutionContextId_ != INT32_MAX);
  return nextExecutionContextId_++;
}

} // namespace facebook::react::jsinspector_modern

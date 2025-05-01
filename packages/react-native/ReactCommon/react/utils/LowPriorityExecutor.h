/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

namespace facebook::react::LowPriorityExecutor {

using WorkItem = std::function<void()>;
using Executor = std::function<void(WorkItem&&)>;

/*
 * This is a platform-configurable abstraction intended to offload
 * non-critical CPU work to a low-priority background thread. For
 * example, the AsyncDestructor implementation uses this API to
 * delegate object destructor calls off critical threads.
 */
void setExecutor(Executor&& threadPool);
Executor& getExecutor();

} // namespace facebook::react::LowPriorityExecutor

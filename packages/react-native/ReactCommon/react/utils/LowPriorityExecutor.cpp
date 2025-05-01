/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LowPriorityExecutor.h"

#include <mutex>
#include <shared_mutex>

namespace facebook::react::LowPriorityExecutor {

static Executor& Instance() {
  static Executor instance;
  return instance;
}

static std::shared_mutex& InstanceMutex() {
  static std::shared_mutex mutex;
  return mutex;
}

void setExecutor(Executor&& threadPool) {
  std::unique_lock<std::shared_mutex> lock(InstanceMutex());
  Instance() = std::move(threadPool);
}

Executor& getExecutor() {
  std::shared_lock<std::shared_mutex> lock(InstanceMutex());
  auto& instance = Instance();
  if (instance == nullptr) {
    // By default, just run the activity synchronously if the host
    // platform has not supplied a worker implementation.
    static Executor defaultPool = [](WorkItem&& workItem) { workItem(); };
    return defaultPool;
  }

  return instance;
}

} // namespace facebook::react::LowPriorityExecutor

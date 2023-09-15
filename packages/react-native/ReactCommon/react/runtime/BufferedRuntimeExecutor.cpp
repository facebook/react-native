/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BufferedRuntimeExecutor.h"
#include <cxxreact/MessageQueueThread.h>
#include <algorithm>

namespace facebook::react {

BufferedRuntimeExecutor::BufferedRuntimeExecutor(
    RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(runtimeExecutor),
      isBufferingEnabled_(true),
      lastIndex_(0) {}

void BufferedRuntimeExecutor::execute(Work&& callback) {
  if (!isBufferingEnabled_) {
    // Fast path: Schedule directly to RuntimeExecutor, without locking
    runtimeExecutor_(std::move(callback));
    return;
  }

  /**
   * Note: std::mutex doesn't have a FIFO ordering.
   * To preserve the order of the buffered work, use a priority queue and
   * track the last known work index.
   */
  uint64_t newIndex = lastIndex_++;
  std::scoped_lock guard(lock_);
  if (isBufferingEnabled_) {
    queue_.push({.index_ = newIndex, .work_ = std::move(callback)});
    return;
  }

  // Force flush the queue to maintain the execution order.
  unsafeFlush();

  runtimeExecutor_(std::move(callback));
}

void BufferedRuntimeExecutor::flush() {
  std::scoped_lock guard(lock_);
  unsafeFlush();
  isBufferingEnabled_ = false;
}

void BufferedRuntimeExecutor::unsafeFlush() {
  while (queue_.size() > 0) {
    const BufferedWork& bufferedWork = queue_.top();
    Work work = std::move(bufferedWork.work_);
    runtimeExecutor_(std::move(work));
    queue_.pop();
  }
}

} // namespace facebook::react

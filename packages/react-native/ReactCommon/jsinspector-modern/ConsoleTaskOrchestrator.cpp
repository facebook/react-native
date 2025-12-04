/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConsoleTaskOrchestrator.h"

namespace facebook::react::jsinspector_modern {

/* static */ ConsoleTaskOrchestrator& ConsoleTaskOrchestrator::getInstance() {
  static ConsoleTaskOrchestrator instance;
  return instance;
}

void ConsoleTaskOrchestrator::scheduleTask(
    ConsoleTaskId taskId,
    std::weak_ptr<ConsoleTaskContext> taskContext) {
  std::lock_guard<std::mutex> lock(mutex_);
  tasks_.emplace(taskId, taskContext);
}

void ConsoleTaskOrchestrator::cancelTask(ConsoleTaskId id) {
  std::lock_guard<std::mutex> lock(mutex_);
  tasks_.erase(id);
}

void ConsoleTaskOrchestrator::startTask(ConsoleTaskId id) {
  std::lock_guard<std::mutex> lock(mutex_);
  stack_.push(id);
}

void ConsoleTaskOrchestrator::finishTask(ConsoleTaskId id) {
  std::lock_guard<std::mutex> lock(mutex_);
  assert(stack_.top() == id);

  stack_.pop();
}

std::shared_ptr<ConsoleTaskContext> ConsoleTaskOrchestrator::top() const {
  std::lock_guard<std::mutex> lock(mutex_);
  if (stack_.empty()) {
    return nullptr;
  }

  auto it = tasks_.find(stack_.top());
  if (it == tasks_.end()) {
    return nullptr;
  }

  return it->second.lock();
}

} // namespace facebook::react::jsinspector_modern

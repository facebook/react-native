/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cassert>

#include "EventBeatBasedExecutor.h"

namespace facebook {
namespace react {

using Mode = EventBeatBasedExecutor::Mode;

EventBeatBasedExecutor::EventBeatBasedExecutor(
    std::unique_ptr<EventBeat> eventBeat)
    : eventBeat_(std::move(eventBeat)) {
  eventBeat_->setBeatCallback(
      std::bind(&EventBeatBasedExecutor::onBeat, this, true));
  eventBeat_->setFailCallback(
      std::bind(&EventBeatBasedExecutor::onBeat, this, false));
}

void EventBeatBasedExecutor::operator()(Routine routine, Mode mode) const {
  if (mode == Mode::Asynchronous) {
    execute({
        /* .routine = */ std::move(routine),
    });
    return;
  }

  std::mutex mutex;
  mutex.lock();

  execute({
      /* .routine = */ std::move(routine),
      /* .callback = */ [&mutex]() { mutex.unlock(); },
  });

  mutex.lock();
}

void EventBeatBasedExecutor::execute(Task task) const {
  {
    std::lock_guard<std::mutex> lock(mutex_);

    tasks_.push_back(std::move(task));
  }

  eventBeat_->request();
  eventBeat_->induce();
}

void EventBeatBasedExecutor::onBeat(bool success) const {
  std::vector<Task> tasks;

  {
    std::lock_guard<std::mutex> lock(mutex_);

    if (tasks_.size() == 0) {
      return;
    }

    tasks = std::move(tasks_);
    tasks_.clear();
  }

  for (const auto task : tasks) {
    if (success) {
      task.routine();
    }

    if (task.callback) {
      task.callback();
    }
  }
}

} // namespace react
} // namespace facebook

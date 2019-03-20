/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <vector>

#include <react/core/EventBeat.h>

namespace facebook {
namespace react {

/*
 * General purpose executor that uses EventBeat to ensure proper threading.
 */
class EventBeatBasedExecutor {
 public:
  using Routine = std::function<void()>;
  using Callback = std::function<void()>;

  struct Task {
    Routine routine;
    Callback callback;
  };

  enum class Mode { Synchronous, Asynchronous };

  EventBeatBasedExecutor(std::unique_ptr<EventBeat> eventBeat);

  /*
   * Executes given routine with given mode.
   */
  void operator()(Routine routine, Mode mode = Mode::Asynchronous) const;

 private:
  void onBeat(bool success = true) const;
  void execute(Task task) const;

  std::unique_ptr<EventBeat> eventBeat_;
  mutable std::vector<Task> tasks_; // Protected by `mutex_`.
  mutable std::mutex mutex_;
};

using EventBeatFactory = std::function<std::unique_ptr<EventBeat>()>;

} // namespace react
} // namespace facebook

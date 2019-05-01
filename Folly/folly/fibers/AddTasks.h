/*
 * Copyright 2014-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <functional>
#include <vector>

#include <folly/Optional.h>
#include <folly/Try.h>
#include <folly/fibers/FiberManagerInternal.h>
#include <folly/fibers/Promise.h>

namespace folly {
namespace fibers {

template <typename T>
class TaskIterator;

/**
 * Schedules several tasks and immediately returns an iterator, that
 * allow one to traverse tasks in the order of their completion. All results
 * and exceptions thrown are stored alongside with the task id and are
 * accessible via iterator.
 *
 * @param first Range of tasks to be scheduled
 * @param last
 *
 * @return movable, non-copyable iterator
 */
template <class InputIterator>
TaskIterator<invoke_result_t<
    typename std::iterator_traits<InputIterator>::
        value_type>> inline addTasks(InputIterator first, InputIterator last);

template <typename T>
class TaskIterator {
 public:
  typedef T value_type;

  TaskIterator() : fm_(FiberManager::getFiberManager()) {}

  // not copyable
  TaskIterator(const TaskIterator& other) = delete;
  TaskIterator& operator=(const TaskIterator& other) = delete;

  // movable
  TaskIterator(TaskIterator&& other) noexcept;
  TaskIterator& operator=(TaskIterator&& other) = delete;

  /**
   * Add one more task to the TaskIterator.
   *
   * @param func task to be added, will be scheduled on current FiberManager
   */
  template <typename F>
  void addTask(F&& func);

  /**
   * @return True if there are tasks immediately available to be consumed (no
   *         need to await on them).
   */
  bool hasCompleted() const;

  /**
   * @return True if there are tasks pending execution (need to awaited on).
   */
  bool hasPending() const;

  /**
   * @return True if there are any tasks (hasCompleted() || hasPending()).
   */
  bool hasNext() const;

  /**
   * Await for another task to complete. Will not await if the result is
   * already available.
   *
   * @return result of the task completed.
   * @throw exception thrown by the task.
   */
  T awaitNext();

  /**
   * Await until the specified number of tasks completes or there are no
   * tasks left to await for.
   * Note: Will not await if there are already the specified number of tasks
   * available.
   *
   * @param n   Number of tasks to await for completition.
   */
  void reserve(size_t n);

  /**
   * @return id of the last task that was processed by awaitNext().
   */
  size_t getTaskID() const;

 private:
  template <class InputIterator>
  friend TaskIterator<
      invoke_result_t<typename std::iterator_traits<InputIterator>::value_type>>
  addTasks(InputIterator first, InputIterator last);

  struct Context {
    std::vector<std::pair<size_t, folly::Try<T>>> results;
    folly::Optional<Promise<void>> promise;
    size_t totalTasks{0};
    size_t tasksConsumed{0};
    size_t tasksToFulfillPromise{0};
  };

  std::shared_ptr<Context> context_{std::make_shared<Context>()};
  size_t id_{std::numeric_limits<size_t>::max()};
  FiberManager& fm_;

  folly::Try<T> awaitNextResult();
};
} // namespace fibers
} // namespace folly

#include <folly/fibers/AddTasks-inl.h>

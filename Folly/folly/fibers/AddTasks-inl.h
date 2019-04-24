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
#include <memory>
#include <vector>

namespace folly {
namespace fibers {

template <typename T>
TaskIterator<T>::TaskIterator(TaskIterator&& other) noexcept
    : context_(std::move(other.context_)), id_(other.id_), fm_(other.fm_) {}

template <typename T>
inline bool TaskIterator<T>::hasCompleted() const {
  return context_->tasksConsumed < context_->results.size();
}

template <typename T>
inline bool TaskIterator<T>::hasPending() const {
  return !context_.unique();
}

template <typename T>
inline bool TaskIterator<T>::hasNext() const {
  return hasPending() || hasCompleted();
}

template <typename T>
folly::Try<T> TaskIterator<T>::awaitNextResult() {
  assert(hasCompleted() || hasPending());
  reserve(1);

  size_t i = context_->tasksConsumed++;
  id_ = context_->results[i].first;
  return std::move(context_->results[i].second);
}

template <typename T>
inline T TaskIterator<T>::awaitNext() {
  return std::move(awaitNextResult().value());
}

template <>
inline void TaskIterator<void>::awaitNext() {
  awaitNextResult().value();
}

template <typename T>
inline void TaskIterator<T>::reserve(size_t n) {
  size_t tasksReady = context_->results.size() - context_->tasksConsumed;

  // we don't need to do anything if there are already n or more tasks complete
  // or if we have no tasks left to execute.
  if (!hasPending() || tasksReady >= n) {
    return;
  }

  n -= tasksReady;
  size_t tasksLeft = context_->totalTasks - context_->results.size();
  n = std::min(n, tasksLeft);

  await([this, n](Promise<void> promise) {
    context_->tasksToFulfillPromise = n;
    context_->promise.assign(std::move(promise));
  });
}

template <typename T>
inline size_t TaskIterator<T>::getTaskID() const {
  assert(id_ != static_cast<size_t>(-1));
  return id_;
}

template <typename T>
template <typename F>
void TaskIterator<T>::addTask(F&& func) {
  static_assert(
      std::is_convertible<invoke_result_t<F>, T>::value,
      "TaskIterator<T>: T must be convertible from func()'s return type");

  auto taskId = context_->totalTasks++;

  fm_.addTask(
      [taskId, context = context_, func = std::forward<F>(func)]() mutable {
        context->results.emplace_back(
            taskId, folly::makeTryWith(std::move(func)));

        // Check for awaiting iterator.
        if (context->promise.hasValue()) {
          if (--context->tasksToFulfillPromise == 0) {
            context->promise->setValue();
            context->promise.clear();
          }
        }
      });
}

template <class InputIterator>
TaskIterator<
    invoke_result_t<typename std::iterator_traits<InputIterator>::value_type>>
addTasks(InputIterator first, InputIterator last) {
  typedef invoke_result_t<
      typename std::iterator_traits<InputIterator>::value_type>
      ResultType;
  typedef TaskIterator<ResultType> IteratorType;

  IteratorType iterator;

  for (; first != last; ++first) {
    iterator.addTask(std::move(*first));
  }

  iterator.context_->results.reserve(iterator.context_->totalTasks);

  return std::move(iterator);
}
} // namespace fibers
} // namespace folly

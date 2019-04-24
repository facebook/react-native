/*
 * Copyright 2017-present Facebook, Inc.
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

#include <glog/logging.h>

#include <folly/Executor.h>

namespace folly {
namespace coro {

template <typename T>
class Promise;

template <typename T>
class Future;

/*
 * Represents allocated, but not-started coroutine, which is not yet assigned to
 * any executor.
 */
template <typename T>
class Task {
 public:
  using promise_type = Promise<T>;

  Task(const Task&) = delete;
  Task(Task&& other) : promise_(other.promise_) {
    other.promise_ = nullptr;
  }

  ~Task() {
    DCHECK(!promise_);
  }

  Future<T> scheduleVia(folly::Executor* executor) && {
    promise_->executor_ = executor;
    promise_->executor_->add([promise = promise_] { promise->start(); });
    return {*std::exchange(promise_, nullptr)};
  }

 private:
  template <typename U>
  friend class Promise;

  Future<T> viaInline(folly::Executor* executor) && {
    promise_->executor_ = executor;
    promise_->start();
    return {*std::exchange(promise_, nullptr)};
  }

  Task(promise_type& promise) : promise_(&promise) {}

  Promise<T>* promise_;
};

} // namespace coro

template <typename T>
coro::Future<T> via(folly::Executor* executor, coro::Task<T>&& task) {
  return std::move(task).scheduleVia(executor);
}

} // namespace folly

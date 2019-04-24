/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/executors/TimedDrivableExecutor.h>

#include <cstring>
#include <ctime>
#include <string>
#include <tuple>

namespace folly {

void TimedDrivableExecutor::add(Func callback) {
  queue_.enqueue(std::move(callback));
}

void TimedDrivableExecutor::drive() noexcept {
  wait();
  run();
}

size_t TimedDrivableExecutor::run() noexcept {
  size_t count = 0;
  size_t n = queue_.size();

  // If we have waited already, then func_ may have a value
  if (func_) {
    auto f = std::move(func_);
    f();
    count = 1;
  }

  while (count < n && queue_.try_dequeue(func_)) {
    auto f = std::move(func_);
    f();
    ++count;
  }

  return count;
}

size_t TimedDrivableExecutor::drain() noexcept {
  size_t tasksRun = 0;
  size_t tasksForSingleRun = 0;
  while ((tasksForSingleRun = run()) != 0) {
    tasksRun += tasksForSingleRun;
  }
  return tasksRun;
}

void TimedDrivableExecutor::wait() noexcept {
  if (!func_) {
    queue_.dequeue(func_);
  }
}

} // namespace folly

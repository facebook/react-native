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

#include <folly/executors/ManualExecutor.h>

#include <string.h>
#include <string>
#include <tuple>

namespace folly {

ManualExecutor::~ManualExecutor() {
  drain();
}

void ManualExecutor::add(Func callback) {
  std::lock_guard<std::mutex> lock(lock_);
  funcs_.emplace(std::move(callback));
  sem_.post();
}

size_t ManualExecutor::run() {
  size_t count;
  size_t n;
  Func func;

  {
    std::lock_guard<std::mutex> lock(lock_);

    while (!scheduledFuncs_.empty()) {
      auto& sf = scheduledFuncs_.top();
      if (sf.time > now_) {
        break;
      }
      funcs_.emplace(sf.moveOutFunc());
      scheduledFuncs_.pop();
    }

    n = funcs_.size();
  }

  for (count = 0; count < n; count++) {
    {
      std::lock_guard<std::mutex> lock(lock_);
      if (funcs_.empty()) {
        break;
      }

      // Balance the semaphore so it doesn't grow without bound
      // if nobody is calling wait().
      // This may fail (with EAGAIN), that's fine.
      sem_.tryWait();

      func = std::move(funcs_.front());
      funcs_.pop();
    }
    func();
  }

  return count;
}

size_t ManualExecutor::drain() {
  size_t tasksRun = 0;
  size_t tasksForSingleRun = 0;
  while ((tasksForSingleRun = run()) != 0) {
    tasksRun += tasksForSingleRun;
  }
  return tasksRun;
}

void ManualExecutor::wait() {
  while (true) {
    {
      std::lock_guard<std::mutex> lock(lock_);
      if (!funcs_.empty()) {
        break;
      }
    }

    sem_.wait();
  }
}

void ManualExecutor::advanceTo(TimePoint const& t) {
  if (t > now_) {
    now_ = t;
  }
  run();
}

} // namespace folly

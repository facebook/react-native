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

#include <folly/python/GILAwareManualExecutor.h>

#include <Python.h>

#include <folly/ScopeGuard.h>

namespace folly {
namespace python {

void GILAwareManualExecutor::add(Func callback) {
  {
    std::lock_guard<std::mutex> lock(lock_);
    funcs_.emplace(std::move(callback));
  }
  cv_.notify_one();
}

void GILAwareManualExecutor::waitBeforeDrive() {
  std::unique_lock<std::mutex> lock(lock_);
  if (!funcs_.empty()) {
    return;
  }

  // Release GIL before waiting on lock
  auto* pyThreadState = PyEval_SaveThread();
  SCOPE_EXIT {
    // Release lock before re-acquiring GIL,
    // to avoid deadlock if another GIL-owning thread is calling add
    lock.unlock();
    PyEval_RestoreThread(pyThreadState);
  };
  cv_.wait(lock, [&] { return !funcs_.empty(); });
}

void GILAwareManualExecutor::driveImpl() {
  Func func;
  while (true) {
    {
      std::lock_guard<std::mutex> lock(lock_);
      if (funcs_.empty()) {
        break;
      }

      func = std::move(funcs_.front());
      funcs_.pop();
    }
    func();
  }
}

} // namespace python
} // namespace folly

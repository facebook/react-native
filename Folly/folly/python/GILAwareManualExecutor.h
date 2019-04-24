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

#pragma once

#include <condition_variable>
#include <memory>
#include <mutex>
#include <queue>

#include <folly/executors/DrivableExecutor.h>
#include <folly/executors/SequencedExecutor.h>

namespace folly {
namespace python {

/**
 * A simple ManualExecutor intended to be run directly on a Python thread.
 * It releases Python GIL while waiting for tasks to execute.
 */
class GILAwareManualExecutor : public DrivableExecutor,
                               public SequencedExecutor {
 public:
  void add(Func) override;

  void drive() override {
    waitBeforeDrive();
    driveImpl();
  }

 private:
  void waitBeforeDrive();
  void driveImpl();

  std::mutex lock_;
  std::queue<Func> funcs_;
  std::condition_variable cv_;
};

} // namespace python
} // namespace folly

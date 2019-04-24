/*
 * Copyright 2015-present Facebook, Inc.
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

#include <cstdint>

namespace folly {

/**
 * Observes the execution of a task.
 */
class ExecutionObserver {
 public:
  virtual ~ExecutionObserver() {}

  /**
   * Called when a task is about to start executing.
   *
   * @param id Unique id for the task which is starting.
   */
  virtual void starting(uintptr_t id) noexcept = 0;

  /**
   * Called when a task is ready to run.
   *
   * @param id Unique id for the task which is ready to run.
   */
  virtual void runnable(uintptr_t id) noexcept = 0;

  /**
   * Called just after a task stops executing.
   *
   * @param id Unique id for the task which stopped.
   */
  virtual void stopped(uintptr_t id) noexcept = 0;
};

} // namespace folly

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

#include <condition_variable>
#include <queue>
#include <thread>

#include <folly/Executor.h>

namespace folly {

/**
 * A simple multithreaded executor for use in tests etc
 */
class TestExecutor : public Executor {
 public:
  explicit TestExecutor(size_t numThreads);

  ~TestExecutor() override;

  void add(Func f) override;

  size_t numThreads() const;

 private:
  void addImpl(Func f);

  std::mutex m_;
  std::queue<Func> workItems_;
  std::condition_variable cv_;

  std::vector<std::thread> workers_;
};

} // namespace folly

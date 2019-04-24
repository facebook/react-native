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
#include <mutex>

#include <stdint.h>

namespace folly {

namespace test {

struct Barrier {
  explicit Barrier(size_t count) : lock_(), cv_(), count_(count) {}

  void wait() {
    std::unique_lock<std::mutex> lockHeld(lock_);
    auto gen = gen_;
    if (++num_ == count_) {
      num_ = 0;
      gen_++;
      cv_.notify_all();
    } else {
      cv_.wait(lockHeld, [&]() { return gen == gen_; });
    }
  }

 private:
  std::mutex lock_;
  std::condition_variable cv_;
  size_t num_{0};
  size_t count_;
  size_t gen_{0};
};

} // namespace test
} // namespace folly

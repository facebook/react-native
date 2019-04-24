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

#include <atomic>

#include <folly/CPortability.h>
#include <folly/CppAttributes.h>
#include <folly/Executor.h>

namespace folly {

/// When work is "queued", execute it immediately inline.
/// Usually when you think you want this, you actually want a
/// QueuedImmediateExecutor.
class InlineExecutor : public Executor {
 public:
  FOLLY_ATTR_VISIBILITY_HIDDEN FOLLY_ALWAYS_INLINE static InlineExecutor&
  instance() noexcept {
    auto const value = cache.load(std::memory_order_acquire);
    return value ? *value : instance_slow();
  }

  void add(Func f) override {
    f();
  }

 private:
  FOLLY_COLD static InlineExecutor& instance_slow() noexcept;

  static std::atomic<InlineExecutor*> cache;
};

} // namespace folly

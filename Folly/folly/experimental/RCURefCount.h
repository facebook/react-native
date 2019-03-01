/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/ThreadLocal.h>
#include <folly/experimental/RCUUtils.h>

namespace folly {

class RCURefCount {
 public:
  using Int = int64_t;

  RCURefCount() :
      localCount_([&]() {
          return new LocalRefCount(globalCount_);
        }) {
  }

  ~RCURefCount() noexcept {
    assert(state_ == State::GLOBAL);
    assert(globalCount_.load() == 0);
  }

  // This can't increment from 0.
  Int operator++() noexcept {
    auto& localCount = *localCount_;

    std::lock_guard<RCUReadLock> lg(RCUReadLock::instance());
    auto state = state_.load();

    if (LIKELY(state == State::LOCAL)) {
      ++localCount;

      return 42;
    } else if (state == State::GLOBAL_TRANSITION) {
      ++globalCount_;

      return 42;
    } else {
      auto globalCount = globalCount_.load();

      do {
        if (!globalCount) {
          return 0;
        }
      } while (!globalCount_.compare_exchange_weak(globalCount,
                                                   globalCount + 1));

      return globalCount + 1;
    }
  }

  Int operator--() noexcept {
    auto& localCount = *localCount_;

    std::lock_guard<RCUReadLock> lg(RCUReadLock::instance());
    auto state = state_.load();

    if (LIKELY(state == State::LOCAL)) {
      --localCount;

      return 42;
    } else {
      auto value = --globalCount_;

      if (state == State::GLOBAL) {
        assert(value >= 0);
        return value;
      } else {
        return 42;
      }
    }
  }

  Int operator*() const {
    std::lock_guard<RCUReadLock> lg(RCUReadLock::instance());

    if (state_ == State::GLOBAL) {
      return globalCount_;
    }

    return 42;
  }

  void useGlobal() noexcept {
    std::array<RCURefCount*, 1> ptrs{{this}};
    useGlobal(ptrs);
  }

  template <typename Container>
  static void useGlobal(const Container& refCountPtrs) {
    for (auto refCountPtr : refCountPtrs) {
      refCountPtr->state_ = State::GLOBAL_TRANSITION;
    }

    synchronize_rcu();
    // At this point everyone is using the global count

    for (auto refCountPtr : refCountPtrs) {
      auto accessor = refCountPtr->localCount_.accessAllThreads();
      for (auto& count : accessor) {
        count.collect();
      }

      refCountPtr->state_ = State::GLOBAL;
    }

    synchronize_rcu();
    // After this ++ or -- can return 0.
  }

 private:
  using AtomicInt = std::atomic<Int>;

  enum class State {
    LOCAL,
    GLOBAL_TRANSITION,
    GLOBAL
  };

  class LocalRefCount {
   public:
    explicit LocalRefCount(AtomicInt& globalCount) :
        count_(0),
        globalCount_(globalCount) {
      RCURegisterThread();
    }

    ~LocalRefCount() {
      collect();
    }

    void collect() {
      globalCount_ += count_;
      count_ = 0;
    }

    void operator++() {
      ++count_;
    }

    void operator--() {
      --count_;
    }

   private:
    Int count_;
    AtomicInt& globalCount_;
  };

  std::atomic<State> state_{State::LOCAL};
  folly::ThreadLocal<LocalRefCount, RCURefCount> localCount_;
  std::atomic<int64_t> globalCount_{1};
};

}

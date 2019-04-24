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

#include <folly/ThreadLocal.h>
#include <folly/synchronization/AsymmetricMemoryBarrier.h>

namespace folly {

class TLRefCount {
 public:
  using Int = int64_t;

  TLRefCount()
      : localCount_([&]() { return new LocalRefCount(*this); }),
        collectGuard_(this, [](void*) {}) {}

  ~TLRefCount() noexcept {
    assert(globalCount_.load() == 0);
    assert(state_.load() == State::GLOBAL);
  }

  // This can't increment from 0.
  Int operator++() noexcept {
    auto& localCount = *localCount_;

    if (++localCount) {
      return 42;
    }

    if (state_.load() == State::GLOBAL_TRANSITION) {
      std::lock_guard<std::mutex> lg(globalMutex_);
    }

    assert(state_.load() == State::GLOBAL);

    auto value = globalCount_.load();
    do {
      if (value == 0) {
        return 0;
      }
    } while (!globalCount_.compare_exchange_weak(value, value + 1));

    return value + 1;
  }

  Int operator--() noexcept {
    auto& localCount = *localCount_;

    if (--localCount) {
      return 42;
    }

    if (state_.load() == State::GLOBAL_TRANSITION) {
      std::lock_guard<std::mutex> lg(globalMutex_);
    }

    assert(state_.load() == State::GLOBAL);

    return globalCount_-- - 1;
  }

  Int operator*() const {
    if (state_ != State::GLOBAL) {
      return 42;
    }
    return globalCount_.load();
  }

  void useGlobal() noexcept {
    std::array<TLRefCount*, 1> ptrs{{this}};
    useGlobal(ptrs);
  }

  template <typename Container>
  static void useGlobal(const Container& refCountPtrs) {
#ifdef FOLLY_SANITIZE_THREAD
    // TSAN has a limitation for the number of locks held concurrently, so it's
    // safer to call useGlobal() serially.
    if (refCountPtrs.size() > 1) {
      for (auto refCountPtr : refCountPtrs) {
        refCountPtr->useGlobal();
      }
      return;
    }
#endif

    std::vector<std::unique_lock<std::mutex>> lgs_;
    for (auto refCountPtr : refCountPtrs) {
      lgs_.emplace_back(refCountPtr->globalMutex_);

      refCountPtr->state_ = State::GLOBAL_TRANSITION;
    }

    asymmetricHeavyBarrier();

    for (auto refCountPtr : refCountPtrs) {
      std::weak_ptr<void> collectGuardWeak = refCountPtr->collectGuard_;

      // Make sure we can't create new LocalRefCounts
      refCountPtr->collectGuard_.reset();

      while (!collectGuardWeak.expired()) {
        auto accessor = refCountPtr->localCount_.accessAllThreads();
        for (auto& count : accessor) {
          count.collect();
        }
      }

      refCountPtr->state_ = State::GLOBAL;
    }
  }

 private:
  using AtomicInt = std::atomic<Int>;

  enum class State {
    LOCAL,
    GLOBAL_TRANSITION,
    GLOBAL,
  };

  class LocalRefCount {
   public:
    explicit LocalRefCount(TLRefCount& refCount) : refCount_(refCount) {
      std::lock_guard<std::mutex> lg(refCount.globalMutex_);

      collectGuard_ = refCount.collectGuard_;
    }

    ~LocalRefCount() {
      collect();
    }

    void collect() {
      std::lock_guard<std::mutex> lg(collectMutex_);

      if (!collectGuard_) {
        return;
      }

      collectCount_ = count_.load();
      refCount_.globalCount_.fetch_add(collectCount_);
      collectGuard_.reset();
    }

    bool operator++() {
      return update(1);
    }

    bool operator--() {
      return update(-1);
    }

   private:
    bool update(Int delta) {
      if (UNLIKELY(refCount_.state_.load() != State::LOCAL)) {
        return false;
      }

      // This is equivalent to atomic fetch_add. We know that this operation
      // is always performed from a single thread. asymmetricLightBarrier()
      // makes things faster than atomic fetch_add on platforms with native
      // support.
      auto count = count_.load(std::memory_order_relaxed) + delta;
      count_.store(count, std::memory_order_relaxed);

      asymmetricLightBarrier();

      if (UNLIKELY(refCount_.state_.load() != State::LOCAL)) {
        std::lock_guard<std::mutex> lg(collectMutex_);

        if (collectGuard_) {
          return true;
        }
        if (collectCount_ != count) {
          return false;
        }
      }

      return true;
    }

    AtomicInt count_{0};
    TLRefCount& refCount_;

    std::mutex collectMutex_;
    Int collectCount_{0};
    std::shared_ptr<void> collectGuard_;
  };

  std::atomic<State> state_{State::LOCAL};
  folly::ThreadLocal<LocalRefCount, TLRefCount> localCount_;
  std::atomic<int64_t> globalCount_{1};
  std::mutex globalMutex_;
  std::shared_ptr<void> collectGuard_;
};

} // namespace folly

/*
 * Copyright 2011-present Facebook, Inc.
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

/**
 * Higher performance (up to 10x) atomic increment using thread caching.
 *
 * @author Spencer Ahrens (sahrens)
 */

#pragma once

#include <atomic>

#include <boost/noncopyable.hpp>

#include <folly/Likely.h>
#include <folly/ThreadLocal.h>

namespace folly {

// Note that readFull requires holding a lock and iterating through all of the
// thread local objects with the same Tag, so if you have a lot of
// ThreadCachedInt's you should considering breaking up the Tag space even
// further.
template <class IntT, class Tag = IntT>
class ThreadCachedInt : boost::noncopyable {
  struct IntCache;

 public:
  explicit ThreadCachedInt(IntT initialVal = 0, uint32_t cacheSize = 1000)
      : target_(initialVal), cacheSize_(cacheSize) {}

  void increment(IntT inc) {
    auto cache = cache_.get();
    if (UNLIKELY(cache == nullptr)) {
      cache = new IntCache(*this);
      cache_.reset(cache);
    }
    cache->increment(inc);
  }

  // Quickly grabs the current value which may not include some cached
  // increments.
  IntT readFast() const {
    return target_.load(std::memory_order_relaxed);
  }

  // Reads the current value plus all the cached increments.  Requires grabbing
  // a lock, so this is significantly slower than readFast().
  IntT readFull() const {
    // This could race with thread destruction and so the access lock should be
    // acquired before reading the current value
    const auto accessor = cache_.accessAllThreads();
    IntT ret = readFast();
    for (const auto& cache : accessor) {
      if (!cache.reset_.load(std::memory_order_acquire)) {
        ret += cache.val_.load(std::memory_order_relaxed);
      }
    }
    return ret;
  }

  // Quickly reads and resets current value (doesn't reset cached increments).
  IntT readFastAndReset() {
    return target_.exchange(0, std::memory_order_release);
  }

  // This function is designed for accumulating into another counter, where you
  // only want to count each increment once.  It can still get the count a
  // little off, however, but it should be much better than calling readFull()
  // and set(0) sequentially.
  IntT readFullAndReset() {
    // This could race with thread destruction and so the access lock should be
    // acquired before reading the current value
    auto accessor = cache_.accessAllThreads();
    IntT ret = readFastAndReset();
    for (auto& cache : accessor) {
      if (!cache.reset_.load(std::memory_order_acquire)) {
        ret += cache.val_.load(std::memory_order_relaxed);
        cache.reset_.store(true, std::memory_order_release);
      }
    }
    return ret;
  }

  void setCacheSize(uint32_t newSize) {
    cacheSize_.store(newSize, std::memory_order_release);
  }

  uint32_t getCacheSize() const {
    return cacheSize_.load();
  }

  ThreadCachedInt& operator+=(IntT inc) {
    increment(inc);
    return *this;
  }
  ThreadCachedInt& operator-=(IntT inc) {
    increment(-inc);
    return *this;
  }
  // pre-increment (we don't support post-increment)
  ThreadCachedInt& operator++() {
    increment(1);
    return *this;
  }
  ThreadCachedInt& operator--() {
    increment(IntT(-1));
    return *this;
  }

  // Thread-safe set function.
  // This is a best effort implementation. In some edge cases, there could be
  // data loss (missing counts)
  void set(IntT newVal) {
    for (auto& cache : cache_.accessAllThreads()) {
      cache.reset_.store(true, std::memory_order_release);
    }
    target_.store(newVal, std::memory_order_release);
  }

 private:
  std::atomic<IntT> target_;
  std::atomic<uint32_t> cacheSize_;
  ThreadLocalPtr<IntCache, Tag, AccessModeStrict>
      cache_; // Must be last for dtor ordering

  // This should only ever be modified by one thread
  struct IntCache {
    ThreadCachedInt* parent_;
    mutable std::atomic<IntT> val_;
    mutable uint32_t numUpdates_;
    std::atomic<bool> reset_;

    explicit IntCache(ThreadCachedInt& parent)
        : parent_(&parent), val_(0), numUpdates_(0), reset_(false) {}

    void increment(IntT inc) {
      if (LIKELY(!reset_.load(std::memory_order_acquire))) {
        // This thread is the only writer to val_, so it's fine do do
        // a relaxed load and do the addition non-atomically.
        val_.store(
            val_.load(std::memory_order_relaxed) + inc,
            std::memory_order_release);
      } else {
        val_.store(inc, std::memory_order_relaxed);
        reset_.store(false, std::memory_order_release);
      }
      ++numUpdates_;
      if (UNLIKELY(
              numUpdates_ >
              parent_->cacheSize_.load(std::memory_order_acquire))) {
        flush();
      }
    }

    void flush() const {
      parent_->target_.fetch_add(val_, std::memory_order_release);
      val_.store(0, std::memory_order_release);
      numUpdates_ = 0;
    }

    ~IntCache() {
      flush();
    }
  };
};

} // namespace folly

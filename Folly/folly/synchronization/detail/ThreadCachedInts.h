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

#include <folly/Function.h>
#include <folly/ThreadLocal.h>
#include <folly/synchronization/AsymmetricMemoryBarrier.h>

// This is unlike folly::ThreadCachedInt in that the full value
// is never rounded up globally and cached, it only supports readFull.
//
// folly/experimental/TLRefCount is similar, but does not support a
// waitForZero, and is not reset-able.
//
// Note that the RCU implementation is completely abstracted from the
// counter implementation, a rseq implementation can be dropped in
// if the kernel supports it.

namespace folly {

namespace detail {

template <typename Tag>
class ThreadCachedInts {
  std::atomic<int64_t> orphan_inc_[2] = {};
  std::atomic<int64_t> orphan_dec_[2] = {};
  folly::detail::Futex<> waiting_{0};

  class Integer {
   public:
    ThreadCachedInts* ints_;
    constexpr Integer(ThreadCachedInts* ints) noexcept
        : ints_(ints), inc_{}, dec_{}, cache_(ints->int_cache_) {}
    std::atomic<int64_t> inc_[2];
    std::atomic<int64_t> dec_[2];
    Integer*& cache_; // reference to the cached ptr
    ~Integer() noexcept {
      // Increment counts must be set before decrement counts
      ints_->orphan_inc_[0].fetch_add(
          inc_[0].load(std::memory_order_relaxed), std::memory_order_relaxed);
      ints_->orphan_inc_[1].fetch_add(
          inc_[1].load(std::memory_order_relaxed), std::memory_order_relaxed);
      folly::asymmetricLightBarrier(); // B
      ints_->orphan_dec_[0].fetch_add(
          dec_[0].load(std::memory_order_relaxed), std::memory_order_relaxed);
      ints_->orphan_dec_[1].fetch_add(
          dec_[1].load(std::memory_order_relaxed), std::memory_order_relaxed);
      ints_->waiting_.store(0, std::memory_order_release);
      detail::futexWake(&ints_->waiting_);
      // reset the cache_ on destructor so we can handle the delete/recreate
      cache_ = nullptr;
    }
  };
  folly::ThreadLocalPtr<Integer, Tag> cs_;

  // Cache the int pointer in a threadlocal.
  static thread_local Integer* int_cache_;

  void init() {
    auto ret = new Integer(this);
    cs_.reset(ret);
    int_cache_ = ret;
  }

 public:
  FOLLY_ALWAYS_INLINE void increment(uint8_t epoch) {
    if (!int_cache_) {
      init();
    }

    auto& c = int_cache_->inc_[epoch];
    auto val = c.load(std::memory_order_relaxed);
    c.store(val + 1, std::memory_order_relaxed);

    folly::asymmetricLightBarrier(); // A
  }

  FOLLY_ALWAYS_INLINE void decrement(uint8_t epoch) {
    folly::asymmetricLightBarrier(); // B
    if (!int_cache_) {
      init();
    }

    auto& c = int_cache_->dec_[epoch];
    auto val = c.load(std::memory_order_relaxed);
    c.store(val + 1, std::memory_order_relaxed);

    folly::asymmetricLightBarrier(); // C
    if (waiting_.load(std::memory_order_acquire)) {
      waiting_.store(0, std::memory_order_release);
      detail::futexWake(&waiting_);
    }
  }

  int64_t readFull(uint8_t epoch) {
    int64_t full = -orphan_dec_[epoch].load(std::memory_order_relaxed);

    // Matches A - ensure all threads have seen new value of version,
    // *and* that we see current values of counters in readFull()
    //
    // Note that in lock_shared if a reader is currently between the
    // version load and counter increment, they may update the wrong
    // epoch.  However, this is ok - they started concurrently *after*
    // any callbacks that will run, and therefore it is safe to run
    // the callbacks.
    folly::asymmetricHeavyBarrier();
    for (auto& i : cs_.accessAllThreads()) {
      full -= i.dec_[epoch].load(std::memory_order_relaxed);
    }

    // Matches B - ensure that all increments are seen if decrements
    // are seen. This is necessary because increment and decrement
    // are allowed to happen on different threads.
    folly::asymmetricHeavyBarrier();

    auto accessor = cs_.accessAllThreads();
    for (auto& i : accessor) {
      full += i.inc_[epoch].load(std::memory_order_relaxed);
    }

    // orphan is read behind accessAllThreads lock
    return full + orphan_inc_[epoch].load(std::memory_order_relaxed);
  }

  void waitForZero(uint8_t phase) {
    // Try reading before futex sleeping.
    if (readFull(phase) == 0) {
      return;
    }

    while (true) {
      waiting_.store(1, std::memory_order_release);
      // Matches C.  Ensure either decrement sees waiting_,
      // or we see their decrement and can safely sleep.
      folly::asymmetricHeavyBarrier();
      if (readFull(phase) == 0) {
        break;
      }
      detail::futexWait(&waiting_, 1);
    }
    waiting_.store(0, std::memory_order_relaxed);
  }

  // We are guaranteed to be called while StaticMeta lock is still
  // held because of ordering in AtForkList.  We can therefore safely
  // touch orphan_ and clear out all counts.
  void resetAfterFork() {
    if (int_cache_) {
      int_cache_->dec_[0].store(0, std::memory_order_relaxed);
      int_cache_->dec_[1].store(0, std::memory_order_relaxed);
      int_cache_->inc_[0].store(0, std::memory_order_relaxed);
      int_cache_->inc_[1].store(0, std::memory_order_relaxed);
    }
    orphan_inc_[0].store(0, std::memory_order_relaxed);
    orphan_inc_[1].store(0, std::memory_order_relaxed);
    orphan_dec_[0].store(0, std::memory_order_relaxed);
    orphan_dec_[1].store(0, std::memory_order_relaxed);
  }
};

template <typename Tag>
thread_local typename detail::ThreadCachedInts<Tag>::Integer*
    detail::ThreadCachedInts<Tag>::int_cache_ = nullptr;

} // namespace detail
} // namespace folly

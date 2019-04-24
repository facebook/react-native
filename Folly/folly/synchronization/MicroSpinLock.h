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

/*
 * N.B. You most likely do _not_ want to use MicroSpinLock or any
 * other kind of spinlock.  Consider MicroLock instead.
 *
 * In short, spinlocks in preemptive multi-tasking operating systems
 * have serious problems and fast mutexes like std::mutex are almost
 * certainly the better choice, because letting the OS scheduler put a
 * thread to sleep is better for system responsiveness and throughput
 * than wasting a timeslice repeatedly querying a lock held by a
 * thread that's blocked, and you can't prevent userspace
 * programs blocking.
 *
 * Spinlocks in an operating system kernel make much more sense than
 * they do in userspace.
 */

#pragma once

/*
 * @author Keith Adams <kma@fb.com>
 * @author Jordan DeLong <delong.j@fb.com>
 */

#include <array>
#include <atomic>
#include <cassert>
#include <cstdint>
#include <mutex>
#include <type_traits>

#include <folly/Portability.h>
#include <folly/lang/Align.h>
#include <folly/synchronization/detail/Sleeper.h>

namespace folly {

/*
 * A really, *really* small spinlock for fine-grained locking of lots
 * of teeny-tiny data.
 *
 * Zero initializing these is guaranteed to be as good as calling
 * init(), since the free state is guaranteed to be all-bits zero.
 *
 * This class should be kept a POD, so we can used it in other packed
 * structs (gcc does not allow __attribute__((__packed__)) on structs that
 * contain non-POD data).  This means avoid adding a constructor, or
 * making some members private, etc.
 */
struct MicroSpinLock {
  enum { FREE = 0, LOCKED = 1 };
  // lock_ can't be std::atomic<> to preserve POD-ness.
  uint8_t lock_;

  // Initialize this MSL.  It is unnecessary to call this if you
  // zero-initialize the MicroSpinLock.
  void init() {
    payload()->store(FREE);
  }

  bool try_lock() {
    return cas(FREE, LOCKED);
  }

  void lock() {
    detail::Sleeper sleeper;
    while (!try_lock()) {
      do {
        sleeper.wait();
      } while (payload()->load(std::memory_order_relaxed) == LOCKED);
    }
    assert(payload()->load() == LOCKED);
  }

  void unlock() {
    assert(payload()->load() == LOCKED);
    payload()->store(FREE, std::memory_order_release);
  }

 private:
  std::atomic<uint8_t>* payload() {
    return reinterpret_cast<std::atomic<uint8_t>*>(&this->lock_);
  }

  bool cas(uint8_t compare, uint8_t newVal) {
    return std::atomic_compare_exchange_strong_explicit(
        payload(),
        &compare,
        newVal,
        std::memory_order_acquire,
        std::memory_order_relaxed);
  }
};
static_assert(
    std::is_pod<MicroSpinLock>::value,
    "MicroSpinLock must be kept a POD type.");

//////////////////////////////////////////////////////////////////////

/**
 * Array of spinlocks where each one is padded to prevent false sharing.
 * Useful for shard-based locking implementations in environments where
 * contention is unlikely.
 */

// TODO: generate it from configure (`getconf LEVEL1_DCACHE_LINESIZE`)
#define FOLLY_CACHE_LINE_SIZE 64

template <class T, size_t N>
struct alignas(max_align_v) SpinLockArray {
  T& operator[](size_t i) {
    return data_[i].lock;
  }

  const T& operator[](size_t i) const {
    return data_[i].lock;
  }

  constexpr size_t size() const {
    return N;
  }

 private:
  struct PaddedSpinLock {
    PaddedSpinLock() : lock() {}
    T lock;
    char padding[FOLLY_CACHE_LINE_SIZE - sizeof(T)];
  };
  static_assert(
      sizeof(PaddedSpinLock) == FOLLY_CACHE_LINE_SIZE,
      "Invalid size of PaddedSpinLock");

  // Check if T can theoretically cross a cache line.
  static_assert(
      max_align_v > 0 && FOLLY_CACHE_LINE_SIZE % max_align_v == 0 &&
          sizeof(T) <= max_align_v,
      "T can cross cache line boundaries");

  char padding_[FOLLY_CACHE_LINE_SIZE];
  std::array<PaddedSpinLock, N> data_;
};

//////////////////////////////////////////////////////////////////////

typedef std::lock_guard<MicroSpinLock> MSLGuard;

//////////////////////////////////////////////////////////////////////

} // namespace folly

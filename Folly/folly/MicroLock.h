/*
 * Copyright 2016-present Facebook, Inc.
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

#include <cassert>
#include <climits>
#include <cstdint>

#include <folly/Portability.h>
#include <folly/detail/Futex.h>

#if defined(__clang__)
#define NO_SANITIZE_ADDRESS __attribute__((no_sanitize_address))
#else
#define NO_SANITIZE_ADDRESS
#endif

namespace folly {

/**
 * Tiny exclusive lock that packs four lock slots into a single
 * byte. Each slot is an independent real, sleeping lock.  The default
 * lock and unlock functions operate on slot zero, which modifies only
 * the low two bits of the host byte.
 *
 * You should zero-initialize the bits of a MicroLock that you intend
 * to use.
 *
 * If you're not space-constrained, prefer std::mutex, which will
 * likely be faster, since it has more than two bits of information to
 * work with.
 *
 * You are free to put a MicroLock in a union with some other object.
 * If, for example, you want to use the bottom two bits of a pointer
 * as a lock, you can put a MicroLock in a union with the pointer and
 * limit yourself to MicroLock slot zero, which will use the two
 * least-significant bits in the bottom byte.
 *
 * (Note that such a union is safe only because MicroLock is based on
 * a character type, and even under a strict interpretation of C++'s
 * aliasing rules, character types may alias anything.)
 *
 * MicroLock uses a dirty trick: it actually operates on the full
 * 32-bit, four-byte-aligned bit of memory into which it is embedded.
 * It never modifies bits outside the ones it's defined to modify, but
 * it _accesses_ all the bits in the 32-bit memory location for
 * purposes of futex management.
 *
 * The MaxSpins template parameter controls the number of times we
 * spin trying to acquire the lock.  MaxYields controls the number of
 * times we call sched_yield; once we've tried to acquire the lock
 * MaxSpins + MaxYields times, we sleep on the lock futex.
 * By adjusting these parameters, you can make MicroLock behave as
 * much or as little like a conventional spinlock as you'd like.
 *
 * Performance
 * -----------
 *
 * With the default template options, the timings for uncontended
 * acquire-then-release come out as follows on Intel(R) Xeon(R) CPU
 * E5-2660 0 @ 2.20GHz, in @mode/opt, as of the master tree at Tue, 01
 * Mar 2016 19:48:15.
 *
 * ========================================================================
 * folly/test/SmallLocksBenchmark.cpp          relative  time/iter  iters/s
 * ========================================================================
 * MicroSpinLockUncontendedBenchmark                       13.46ns   74.28M
 * PicoSpinLockUncontendedBenchmark                        14.99ns   66.71M
 * MicroLockUncontendedBenchmark                           27.06ns   36.96M
 * StdMutexUncontendedBenchmark                            25.18ns   39.72M
 * VirtualFunctionCall                                      1.72ns  579.78M
 * ========================================================================
 *
 * (The virtual dispatch benchmark is provided for scale.)
 *
 * While the uncontended case for MicroLock is competitive with the
 * glibc 2.2.0 implementation of std::mutex, std::mutex is likely to be
 * faster in the contended case, because we need to wake up all waiters
 * when we release.
 *
 * Make sure to benchmark your particular workload.
 *
 */

class MicroLockCore {
 protected:
#if defined(__SANITIZE_ADDRESS__) && !defined(__clang__) && \
    (defined(__GNUC__) || defined(__GNUG__))
  uint32_t lock_;
#else
  uint8_t lock_;
#endif
  inline detail::Futex<>* word() const; // Well, halfword on 64-bit systems
  inline uint32_t baseShift(unsigned slot) const;
  inline uint32_t heldBit(unsigned slot) const;
  inline uint32_t waitBit(unsigned slot) const;
  static void lockSlowPath(
      uint32_t oldWord,
      detail::Futex<>* wordPtr,
      uint32_t slotHeldBit,
      unsigned maxSpins,
      unsigned maxYields);

 public:
  inline void unlock(unsigned slot) NO_SANITIZE_ADDRESS;
  inline void unlock() {
    unlock(0);
  }
  // Initializes all the slots.
  inline void init() {
    lock_ = 0;
  }
};

inline detail::Futex<>* MicroLockCore::word() const {
  uintptr_t lockptr = (uintptr_t)&lock_;
  lockptr &= ~(sizeof(uint32_t) - 1);
  return (detail::Futex<>*)lockptr;
}

inline unsigned MicroLockCore::baseShift(unsigned slot) const {
  assert(slot < CHAR_BIT / 2);

  unsigned offset_bytes = (unsigned)((uintptr_t)&lock_ - (uintptr_t)word());

  return (
      unsigned)(kIsLittleEndian ? offset_bytes * CHAR_BIT + slot * 2 : CHAR_BIT * (sizeof(uint32_t) - offset_bytes - 1) + slot * 2);
}

inline uint32_t MicroLockCore::heldBit(unsigned slot) const {
  return 1U << (baseShift(slot) + 0);
}

inline uint32_t MicroLockCore::waitBit(unsigned slot) const {
  return 1U << (baseShift(slot) + 1);
}

void MicroLockCore::unlock(unsigned slot) {
  detail::Futex<>* wordPtr = word();
  uint32_t oldWord;
  uint32_t newWord;

  oldWord = wordPtr->load(std::memory_order_relaxed);
  do {
    assert(oldWord & heldBit(slot));
    newWord = oldWord & ~(heldBit(slot) | waitBit(slot));
  } while (!wordPtr->compare_exchange_weak(
      oldWord, newWord, std::memory_order_release, std::memory_order_relaxed));

  if (oldWord & waitBit(slot)) {
    detail::futexWake(wordPtr, 1, heldBit(slot));
  }
}

template <unsigned MaxSpins = 1000, unsigned MaxYields = 0>
class MicroLockBase : public MicroLockCore {
 public:
  inline void lock(unsigned slot) NO_SANITIZE_ADDRESS;
  inline void lock() {
    lock(0);
  }
  inline bool try_lock(unsigned slot) NO_SANITIZE_ADDRESS;
  inline bool try_lock() {
    return try_lock(0);
  }
};

template <unsigned MaxSpins, unsigned MaxYields>
bool MicroLockBase<MaxSpins, MaxYields>::try_lock(unsigned slot) {
  // N.B. You might think that try_lock is just the fast path of lock,
  // but you'd be wrong.  Keep in mind that other parts of our host
  // word might be changing while we take the lock!  We're not allowed
  // to fail spuriously if the lock is in fact not held, even if other
  // people are concurrently modifying other parts of the word.
  //
  // We need to loop until we either see firm evidence that somebody
  // else has the lock (by looking at heldBit) or see our CAS succeed.
  // A failed CAS by itself does not indicate lock-acquire failure.

  detail::Futex<>* wordPtr = word();
  uint32_t oldWord = wordPtr->load(std::memory_order_relaxed);
  do {
    if (oldWord & heldBit(slot)) {
      return false;
    }
  } while (!wordPtr->compare_exchange_weak(
      oldWord,
      oldWord | heldBit(slot),
      std::memory_order_acquire,
      std::memory_order_relaxed));

  return true;
}

template <unsigned MaxSpins, unsigned MaxYields>
void MicroLockBase<MaxSpins, MaxYields>::lock(unsigned slot) {
  static_assert(MaxSpins + MaxYields < (unsigned)-1, "overflow");

  detail::Futex<>* wordPtr = word();
  uint32_t oldWord;
  oldWord = wordPtr->load(std::memory_order_relaxed);
  if ((oldWord & heldBit(slot)) == 0 &&
      wordPtr->compare_exchange_weak(
          oldWord,
          oldWord | heldBit(slot),
          std::memory_order_acquire,
          std::memory_order_relaxed)) {
    // Fast uncontended case: memory_order_acquire above is our barrier
  } else {
    // lockSlowPath doesn't have any slot-dependent computation; it
    // just shifts the input bit.  Make sure its shifting produces the
    // same result a call to waitBit for our slot would.
    assert(heldBit(slot) << 1 == waitBit(slot));
    // lockSlowPath emits its own memory barrier
    lockSlowPath(oldWord, wordPtr, heldBit(slot), MaxSpins, MaxYields);
  }
}

typedef MicroLockBase<> MicroLock;
} // namespace folly

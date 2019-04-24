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

#include <folly/PackedSyncPtr.h>
#include <folly/concurrency/detail/AtomicSharedPtr-detail.h>
#include <folly/synchronization/AtomicStruct.h>
#include <folly/synchronization/detail/AtomicUtils.h>
#include <atomic>
#include <thread>

/*
 * This is an implementation of the std::atomic_shared_ptr TS
 * http://en.cppreference.com/w/cpp/experimental/atomic_shared_ptr
 * https://isocpp.org/files/papers/N4162.pdf
 *
 * AFAIK, the only other implementation is Anthony Williams from
 * Just::thread library:
 *
 * https://bitbucket.org/anthonyw/atomic_shared_ptr
 *
 * implementation details:
 *
 * Basically, three things need to be atomically exchanged to make this work:
 * * the local count
 * * the pointer to the control block
 * * the aliased pointer, if any.
 *
 * The Williams version does it with DWcas: 32 bits for local count, 64
 * bits for control block ptr, and he changes the shared_ptr
 * implementation to also store the aliased pointers using a linked list
 * like structure, and provides 32-bit index accessors to them (like
 * IndexedMemPool trick).
 *
 * This version instead stores the 48 bits of address, plus 16 bits of
 * local count in a single 8byte pointer.  This avoids 'lock cmpxchg16b',
 * which is much slower than 'lock xchg' in the normal 'store' case.  In
 * the less-common aliased pointer scenaro, we just allocate it in a new
 * block, and store a pointer to that instead.
 *
 * Note that even if we only want to use the 3-bits of pointer alignment,
 * this trick should still work - Any more than 4 concurrent accesses
 * will have to go to an external map count instead (slower, but lots of
 * concurrent access will be slow anyway due to bouncing cachelines).
 *
 * As a perf optimization, we currently batch up local count and only
 * move it global every once in a while.  This means load() is usually
 * only a single atomic operation, instead of 3.  For this trick to work,
 * we probably need at least 8 bits to make batching worth it.
 */

// A note on noexcept: If the pointer is an aliased pointer,
// store() will allocate.  Otherwise is noexcept.
namespace folly {

template <
    typename T,
    template <typename> class Atom = std::atomic,
    typename CountedDetail = detail::shared_ptr_internals>
class atomic_shared_ptr {
  using SharedPtr = typename CountedDetail::template CountedPtr<T>;
  using BasePtr = typename CountedDetail::counted_base;
  using PackedPtr = folly::PackedSyncPtr<BasePtr>;

 public:
  atomic_shared_ptr() noexcept {
    init();
  }
  explicit atomic_shared_ptr(SharedPtr foo) /* noexcept */
      : atomic_shared_ptr() {
    store(std::move(foo));
  }
  atomic_shared_ptr(const atomic_shared_ptr<T>&) = delete;

  ~atomic_shared_ptr() {
    store(SharedPtr(nullptr));
  }
  void operator=(SharedPtr desired) /* noexcept */ {
    store(std::move(desired));
  }
  void operator=(const atomic_shared_ptr<T>&) = delete;

  bool is_lock_free() const noexcept {
    // lock free unless more than EXTERNAL_OFFSET threads are
    // contending and they all get unlucky and scheduled out during
    // load().
    //
    // TODO: Could use a lock-free external map to fix this
    // corner case.
    return true;
  }

  SharedPtr load(std::memory_order order = std::memory_order_seq_cst) const
      noexcept {
    auto local = takeOwnedBase(order);
    return get_shared_ptr(local, false);
  }

  /* implicit */ operator SharedPtr() const {
    return load();
  }

  void store(
      SharedPtr n,
      std::memory_order order = std::memory_order_seq_cst) /* noexcept */ {
    auto newptr = get_newptr(std::move(n));
    auto old = ptr_.exchange(newptr, order);
    release_external(old);
  }

  SharedPtr exchange(
      SharedPtr n,
      std::memory_order order = std::memory_order_seq_cst) /* noexcept */ {
    auto newptr = get_newptr(std::move(n));
    auto old = ptr_.exchange(newptr, order);

    SharedPtr old_ptr;

    if (old.get()) {
      old_ptr = get_shared_ptr(old);
      release_external(old);
    }

    return old_ptr;
  }

  bool compare_exchange_weak(
      SharedPtr& expected,
      const SharedPtr& n,
      std::memory_order mo = std::memory_order_seq_cst) noexcept {
    return compare_exchange_weak(
        expected, n, mo, detail::default_failure_memory_order(mo));
  }
  bool compare_exchange_weak(
      SharedPtr& expected,
      const SharedPtr& n,
      std::memory_order success,
      std::memory_order failure) /* noexcept */ {
    auto newptr = get_newptr(n);
    PackedPtr oldptr, expectedptr;

    oldptr = takeOwnedBase(success);
    if (!owners_eq(oldptr, CountedDetail::get_counted_base(expected))) {
      expected = get_shared_ptr(oldptr, false);
      release_external(newptr);
      return false;
    }
    expectedptr = oldptr; // Need oldptr to release if failed
    if (ptr_.compare_exchange_weak(expectedptr, newptr, success, failure)) {
      if (oldptr.get()) {
        release_external(oldptr, -1);
      }
      return true;
    } else {
      if (oldptr.get()) {
        expected = get_shared_ptr(oldptr, false);
      } else {
        expected = SharedPtr(nullptr);
      }
      release_external(newptr);
      return false;
    }
  }
  bool compare_exchange_weak(
      SharedPtr& expected,
      SharedPtr&& desired,
      std::memory_order mo = std::memory_order_seq_cst) noexcept {
    return compare_exchange_weak(
        expected, desired, mo, detail::default_failure_memory_order(mo));
  }
  bool compare_exchange_weak(
      SharedPtr& expected,
      SharedPtr&& desired,
      std::memory_order success,
      std::memory_order failure) /* noexcept */ {
    return compare_exchange_weak(expected, desired, success, failure);
  }
  bool compare_exchange_strong(
      SharedPtr& expected,
      const SharedPtr& n,
      std::memory_order mo = std::memory_order_seq_cst) noexcept {
    return compare_exchange_strong(
        expected, n, mo, detail::default_failure_memory_order(mo));
  }
  bool compare_exchange_strong(
      SharedPtr& expected,
      const SharedPtr& n,
      std::memory_order success,
      std::memory_order failure) /* noexcept */ {
    auto local_expected = expected;
    do {
      if (compare_exchange_weak(expected, n, success, failure)) {
        return true;
      }
    } while (local_expected == expected);

    return false;
  }
  bool compare_exchange_strong(
      SharedPtr& expected,
      SharedPtr&& desired,
      std::memory_order mo = std::memory_order_seq_cst) noexcept {
    return compare_exchange_strong(
        expected, desired, mo, detail::default_failure_memory_order(mo));
  }
  bool compare_exchange_strong(
      SharedPtr& expected,
      SharedPtr&& desired,
      std::memory_order success,
      std::memory_order failure) /* noexcept */ {
    return compare_exchange_strong(expected, desired, success, failure);
  }

 private:
  // Matches packed_sync_pointer.  Must be > max number of local
  // counts.  This is the max number of threads that can access this
  // atomic_shared_ptr at once before we start blocking.
  static constexpr unsigned EXTERNAL_OFFSET{0x2000};
  // Bit signifying aliased constructor
  static constexpr unsigned ALIASED_PTR{0x4000};

  mutable AtomicStruct<PackedPtr, Atom> ptr_;

  void add_external(BasePtr* res, int64_t c = 0) const {
    assert(res);
    CountedDetail::inc_shared_count(res, EXTERNAL_OFFSET + c);
  }
  void release_external(PackedPtr& res, int64_t c = 0) const {
    if (!res.get()) {
      return;
    }
    int64_t count = get_local_count(res) + c;
    int64_t diff = EXTERNAL_OFFSET - count;
    assert(diff >= 0);
    CountedDetail::template release_shared<T>(res.get(), diff);
  }
  PackedPtr get_newptr(const SharedPtr& n) const {
    BasePtr* newval;
    unsigned count = 0;
    if (!n) {
      newval = nullptr;
    } else {
      newval = CountedDetail::get_counted_base(n);
      if (n.get() != CountedDetail::template get_shared_ptr<T>(newval)) {
        // This is an aliased sharedptr.  Make an un-aliased one
        // by wrapping in *another* shared_ptr.
        auto data = CountedDetail::template make_ptr<SharedPtr>(n);
        newval = CountedDetail::get_counted_base(data);
        count = ALIASED_PTR;
        // (add external must happen before data goes out of scope)
        add_external(newval);
      } else {
        add_external(newval);
      }
    }

    PackedPtr newptr;
    newptr.init(newval, count);

    return newptr;
  }
  PackedPtr get_newptr(SharedPtr&& n) const {
    BasePtr* newval;
    unsigned count = 0;
    if (!n) {
      newval = nullptr;
    } else {
      newval = CountedDetail::get_counted_base(n);
      if (n.get() != CountedDetail::template get_shared_ptr<T>(newval)) {
        // This is an aliased sharedptr.  Make an un-aliased one
        // by wrapping in *another* shared_ptr.
        auto data = CountedDetail::template make_ptr<SharedPtr>(std::move(n));
        newval = CountedDetail::get_counted_base(data);
        count = ALIASED_PTR;
        CountedDetail::release_ptr(data);
        add_external(newval, -1);
      } else {
        CountedDetail::release_ptr(n);
        add_external(newval, -1);
      }
    }

    PackedPtr newptr;
    newptr.init(newval, count);

    return newptr;
  }
  void init() {
    PackedPtr data;
    data.init();
    ptr_.store(data);
  }

  unsigned int get_local_count(const PackedPtr& p) const {
    return p.extra() & ~ALIASED_PTR;
  }

  // Check pointer equality considering wrapped aliased pointers.
  bool owners_eq(PackedPtr& p1, BasePtr* p2) {
    bool aliased1 = p1.extra() & ALIASED_PTR;
    if (aliased1) {
      auto p1a = CountedDetail::template get_shared_ptr_from_counted_base<T>(
          p1.get(), false);
      return CountedDetail::get_counted_base(p1a) == p2;
    }
    return p1.get() == p2;
  }

  SharedPtr get_shared_ptr(const PackedPtr& p, bool inc = true) const {
    bool aliased = p.extra() & ALIASED_PTR;

    auto res = CountedDetail::template get_shared_ptr_from_counted_base<T>(
        p.get(), inc);
    if (aliased) {
      auto aliasedp =
          CountedDetail::template get_shared_ptr_from_counted_base<SharedPtr>(
              p.get());
      res = *aliasedp;
    }
    return res;
  }

  /* Get a reference to the pointer, either from the local batch or
   * from the global count.
   *
   * return is the base ptr, and the previous local count, if it is
   * needed for compare_and_swap later.
   */
  PackedPtr takeOwnedBase(std::memory_order order) const noexcept {
    PackedPtr local, newlocal;
    local = ptr_.load(std::memory_order_acquire);
    while (true) {
      if (!local.get()) {
        return local;
      }
      newlocal = local;
      if (get_local_count(newlocal) + 1 > EXTERNAL_OFFSET) {
        // spinlock in the rare case we have more than
        // EXTERNAL_OFFSET threads trying to access at once.
        std::this_thread::yield();
        // Force DeterministicSchedule to choose a different thread
        local = ptr_.load(std::memory_order_acquire);
      } else {
        newlocal.setExtra(newlocal.extra() + 1);
        assert(get_local_count(newlocal) > 0);
        if (ptr_.compare_exchange_weak(local, newlocal, order)) {
          break;
        }
      }
    }

    // Check if we need to push a batch from local -> global
    auto batchcount = EXTERNAL_OFFSET / 2;
    if (get_local_count(newlocal) > batchcount) {
      CountedDetail::inc_shared_count(newlocal.get(), batchcount);
      putOwnedBase(newlocal.get(), batchcount, order);
    }

    return newlocal;
  }

  void putOwnedBase(BasePtr* p, unsigned int count, std::memory_order mo) const
      noexcept {
    PackedPtr local = ptr_.load(std::memory_order_acquire);
    while (true) {
      if (local.get() != p) {
        break;
      }
      auto newlocal = local;
      if (get_local_count(local) > count) {
        newlocal.setExtra(local.extra() - count);
      } else {
        // Otherwise it may be the same pointer, but someone else won
        // the compare_exchange below, local count was already made
        // global.  We decrement the global count directly instead of
        // the local one.
        break;
      }
      if (ptr_.compare_exchange_weak(local, newlocal, mo)) {
        return;
      }
    }

    CountedDetail::template release_shared<T>(p, count);
  }
};

} // namespace folly

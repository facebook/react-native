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

#include <folly/Portability.h>

#if !FOLLY_X64 && !FOLLY_PPC64
# error "PackedSyncPtr is x64 and ppc64 specific code."
#endif

/*
 * An 8-byte pointer with an integrated spin lock and 15-bit integer
 * (you can use this for a size of the allocation, if you want, or
 * something else, or nothing).
 *
 * This is using an x64-specific detail about the effective virtual
 * address space.  Long story short: the upper two bytes of all our
 * pointers will be zero in reality---and if you have a couple billion
 * such pointers in core, it makes pretty good sense to try to make
 * use of that memory.  The exact details can be perused here:
 *
 *    http://en.wikipedia.org/wiki/X86-64#Canonical_form_addresses
 *
 * This is not a "smart" pointer: nothing automagical is going on
 * here.  Locking is up to the user.  Resource deallocation is up to
 * the user.  Locks are never acquired or released outside explicit
 * calls to lock() and unlock().
 *
 * Change the value of the raw pointer with set(), but you must hold
 * the lock when calling this function if multiple threads could be
 * using this class.
 *
 * TODO(jdelong): should we use the low order bit for the lock, so we
 * get a whole 16-bits for our integer?  (There's also 2 more bits
 * down there if the pointer comes from malloc.)
 *
 * @author Spencer Ahrens <sahrens@fb.com>
 * @author Jordan DeLong <delong.j@fb.com>
 */

#include <folly/SmallLocks.h>
#include <type_traits>
#include <glog/logging.h>

namespace folly {

template<class T>
class PackedSyncPtr {
  // This just allows using this class even with T=void.  Attempting
  // to use the operator* or operator[] on a PackedSyncPtr<void> will
  // still properly result in a compile error.
  typedef typename std::add_lvalue_reference<T>::type reference;

public:
  /*
   * If you default construct one of these, you must call this init()
   * function before using it.
   *
   * (We are avoiding a constructor to ensure gcc allows us to put
   * this class in packed structures.)
   */
  void init(T* initialPtr = 0, uint16_t initialExtra = 0) {
    auto intPtr = reinterpret_cast<uintptr_t>(initialPtr);
    CHECK(!(intPtr >> 48));
    data_.init(intPtr);
    setExtra(initialExtra);
  }

  /*
   * Sets a new pointer.  You must hold the lock when calling this
   * function, or else be able to guarantee no other threads could be
   * using this PackedSyncPtr<>.
   */
  void set(T* t) {
    auto intPtr = reinterpret_cast<uintptr_t>(t);
    auto shiftedExtra = uintptr_t(extra()) << 48;
    CHECK(!(intPtr >> 48));
    data_.setData(intPtr | shiftedExtra);
  }

  /*
   * Get the pointer.
   *
   * You can call any of these without holding the lock, with the
   * normal types of behavior you'll get on x64 from reading a pointer
   * without locking.
   */
  T* get() const {
    return reinterpret_cast<T*>(data_.getData() & (-1ull >> 16));
  }
  T* operator->() const { return get(); }
  reference operator*() const { return *get(); }
  reference operator[](std::ptrdiff_t i) const { return get()[i]; }

  // Synchronization (logically const, even though this mutates our
  // locked state: you can lock a const PackedSyncPtr<T> to read it).
  void lock() const { data_.lock(); }
  void unlock() const { data_.unlock(); }
  bool try_lock() const { return data_.try_lock(); }

  /*
   * Access extra data stored in unused bytes of the pointer.
   *
   * It is ok to call this without holding the lock.
   */
  uint16_t extra() const {
    return data_.getData() >> 48;
  }

  /*
   * Don't try to put anything into this that has the high bit set:
   * that's what we're using for the mutex.
   *
   * Don't call this without holding the lock.
   */
  void setExtra(uint16_t extra) {
    CHECK(!(extra & 0x8000));
    auto ptr = data_.getData() & (-1ull >> 16);
    data_.setData((uintptr_t(extra) << 48) | ptr);
  }

 private:
  PicoSpinLock<uintptr_t> data_;
} FOLLY_PACK_ATTR;

static_assert(
    std::is_pod<PackedSyncPtr<void>>::value,
    "PackedSyncPtr must be kept a POD type.");
static_assert(sizeof(PackedSyncPtr<void>) == 8,
              "PackedSyncPtr should be only 8 bytes---something is "
              "messed up");

}

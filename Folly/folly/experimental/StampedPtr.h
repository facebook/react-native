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

#include <folly/lang/SafeAssert.h>

#include <stdint.h>

namespace folly {

/**
 * StampedPtr packs both a pointer to T and a uint16_t into a 64-bit value,
 * exploiting the fact that current addresses are limited to 48 bits on
 * all current x86-64 and ARM64 processors.
 *
 * For both x86-64 and ARM64, 64-bit pointers have a canonical
 * form in which the upper 16 bits are equal to bit 47.  Intel has
 * announced a 57-bit addressing mode (see https://software.intel.com/
 * sites/default/files/managed/2b/80/5-level_paging_white_paper.pdf),
 * but it is not yet available.  The first problematic platform will
 * probably be ARMv8.2, which supports 52-bit virtual addresses.
 *
 * This code works on all of the platforms I have available for test,
 * and probably on all currently-shipping platforms that have a hope of
 * compiling folly.  Rather than enumerating the supported platforms via
 * ifdef, this code dynamically validates its packing assumption in debug
 * builds on each call to a mutating function.  Presumably by the time we
 * are running this process in an operating system image that can address
 * more than 256TB of memory, RAM cost and the latency of 128-bit CAS
 * will have improved enough that this optimization is no longer impactful.
 *
 * A common approach to this kind of packing seems to be to just assume
 * the top 16 bits are zero, but https://github.com/LuaJIT/LuaJIT/issues/49
 * indicates that ARM64 platforms in the wild are actually setting bit 47
 * in their stack addresses.  That means that we need to extend bit 47 to
 * do the right thing (it's not expensive, it compiles to one instruction
 * on x86-64 and arm64).
 *
 * Compare to PackedSyncPtr and DiscriminatedPtr, which perform similar
 * packing but add additional functionality.  The name is taken from
 * Java's AtomicStampedReference.  Unlike PackedSyncPtr, which tries to
 * act pointer-like, this class acts more like a pair whose elements are
 * named ptr and stamp.  It also allows direct access to the internal
 * raw field: since we're already at the metal you might want to play
 * additional games.  It is guaranteed that a zero raw value gets decoded
 * as a (ptr,stamp) of (nullptr,0).
 */
template <typename T>
struct StampedPtr {
  /**
   * The packing is not guaranteed, except that it is guaranteed that
   * raw == 0 iff ptr() == nullptr && stamp() == 0.
   */
  uint64_t raw;

  /* IMPORTANT: default initialization doesn't result in a sane state */

  T* ptr() const {
    return unpackPtr(raw);
  }

  uint16_t stamp() const {
    return unpackStamp(raw);
  }

  void set(T* ptr, uint16_t stamp) {
    raw = pack(ptr, stamp);
  }

  void setPtr(T* ptr) {
    raw = pack(ptr, unpackStamp(raw));
  }

  void setStamp(uint16_t stamp) {
    raw = pack(unpackPtr(raw), stamp);
  }

  static T* unpackPtr(uint64_t raw) {
    // Canonical form means we need to extend bit 47 of the pointer to
    // bits 48..63 (unless the operating system never hands those pointers
    // to us, which is difficult to prove).  Signed right-shift of a
    // negative number is implementation-defined in C++ (not undefined!),
    // but actually does the right thing on all the platforms I can find.
    auto extended = static_cast<int64_t>(raw) >> kInternalStampBits;
    return reinterpret_cast<T*>(static_cast<intptr_t>(extended));
  }

  static uint16_t unpackStamp(uint64_t raw) {
    return static_cast<uint16_t>(raw);
  }

  static uint64_t pack(T* ptr, uint16_t stamp) {
    auto shifted = static_cast<uint64_t>(reinterpret_cast<uintptr_t>(ptr))
        << kInternalStampBits;
    uint64_t raw = shifted | stamp;
    FOLLY_SAFE_DCHECK(unpackPtr(raw) == ptr, "ptr mismatch.");
    FOLLY_SAFE_DCHECK(unpackStamp(raw) == stamp, "stamp mismatch.");
    return raw;
  }

 private:
  // On 32-bit platforms it works okay to store a ptr in the top 48
  // bits of a 64-bit value, but it will result in unnecessary work.
  // If we align the pointer part at word granularity when we have the
  // space then no shifting will ever be needed.
  static constexpr unsigned kInternalStampBits = sizeof(void*) == 4 ? 32 : 16;
};

template <typename T>
StampedPtr<T> makeStampedPtr(T* ptr, uint16_t stamp) {
  return StampedPtr<T>{StampedPtr<T>::pack(ptr, stamp)};
}

} // namespace folly

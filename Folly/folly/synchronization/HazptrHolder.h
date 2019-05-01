/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/synchronization/Hazptr-fwd.h>
#include <folly/synchronization/HazptrDomain.h>
#include <folly/synchronization/HazptrRec.h>
#include <folly/synchronization/HazptrThrLocal.h>

#include <folly/synchronization/AsymmetricMemoryBarrier.h>

namespace folly {

///
/// Classes related to hazard pointer holders.
///

/**
 *  hazptr_holder
 *
 *  Class for automatic acquisition and release of hazard pointers,
 *  and interface for hazard pointer operations.
 *
 *  Usage example:
 *    T* ptr;
 *    {
 *      hazptr_holder h;
 *      ptr = h.get_protected(src);
 *      //  ... *ptr is protected ...
 *      h.reset();
 *      // ... *ptr is not protected ...
 *      ptr = src.load();
 *      while (!h.try_protect(ptr, src)) {}
 *      // ... *ptr is protected ...
 *    }
 *    // ... *ptr is not protected
 */
template <template <typename> class Atom>
class hazptr_holder {
  hazptr_rec<Atom>* hprec_;

 public:
  /** Constructor - automatically acquires a hazard pointer. */
  FOLLY_ALWAYS_INLINE explicit hazptr_holder(
      hazptr_domain<Atom>& domain = default_hazptr_domain<Atom>()) {
#if FOLLY_HAZPTR_THR_LOCAL
    if (LIKELY(&domain == &default_hazptr_domain<Atom>())) {
      auto hprec = hazptr_tc_tls<Atom>().try_get();
      if (LIKELY(hprec != nullptr)) {
        hprec_ = hprec;
        return;
      }
    }
#endif
    hprec_ = domain.hprec_acquire();
  }

  /** Empty constructor */
  FOLLY_ALWAYS_INLINE explicit hazptr_holder(std::nullptr_t) noexcept
      : hprec_(nullptr) {}

  /** Move constructor */
  FOLLY_ALWAYS_INLINE hazptr_holder(hazptr_holder&& rhs) noexcept {
    hprec_ = rhs.hprec_;
    rhs.hprec_ = nullptr;
  }

  hazptr_holder(const hazptr_holder&) = delete;
  hazptr_holder& operator=(const hazptr_holder&) = delete;

  /** Destructor */
  FOLLY_ALWAYS_INLINE ~hazptr_holder() {
    if (LIKELY(hprec_ != nullptr)) {
      hprec_->reset_hazptr();
      auto domain = hprec_->domain();
#if FOLLY_HAZPTR_THR_LOCAL
      if (LIKELY(domain == &default_hazptr_domain<Atom>())) {
        if (LIKELY(hazptr_tc_tls<Atom>().try_put(hprec_))) {
          return;
        }
      }
#endif
      domain->hprec_release(hprec_);
    }
  }

  /** Move operator */
  FOLLY_ALWAYS_INLINE hazptr_holder& operator=(hazptr_holder&& rhs) noexcept {
    /* Self-move is a no-op.  */
    if (LIKELY(this != &rhs)) {
      this->~hazptr_holder();
      new (this) hazptr_holder(nullptr);
      hprec_ = rhs.hprec_;
      rhs.hprec_ = nullptr;
    }
    return *this;
  }

  /** Hazard pointer operations */

  /** try_protect */
  template <typename T>
  FOLLY_ALWAYS_INLINE bool try_protect(T*& ptr, const Atom<T*>& src) noexcept {
    return try_protect(ptr, src, [](T* t) { return t; });
  }

  template <typename T, typename Func>
  FOLLY_ALWAYS_INLINE bool
  try_protect(T*& ptr, const Atom<T*>& src, Func f) noexcept {
    /* Filtering the protected pointer through function Func is useful
       for stealing bits of the pointer word */
    auto p = ptr;
    reset(f(p));
    /*** Full fence ***/ folly::asymmetricLightBarrier();
    ptr = src.load(std::memory_order_acquire);
    if (UNLIKELY(p != ptr)) {
      reset();
      return false;
    }
    return true;
  }

  /** get_protected */
  template <typename T>
  FOLLY_ALWAYS_INLINE T* get_protected(const Atom<T*>& src) noexcept {
    return get_protected(src, [](T* t) { return t; });
  }

  template <typename T, typename Func>
  FOLLY_ALWAYS_INLINE T* get_protected(const Atom<T*>& src, Func f) noexcept {
    T* ptr = src.load(std::memory_order_relaxed);
    while (!try_protect(ptr, src, f)) {
      /* Keep trying */;
    }
    return ptr;
  }

  /** reset */
  template <typename T>
  FOLLY_ALWAYS_INLINE void reset(const T* ptr) noexcept {
    auto p = static_cast<hazptr_obj<Atom>*>(const_cast<T*>(ptr));
    DCHECK(hprec_); // UB if *this is empty
    hprec_->reset_hazptr(p);
  }

  FOLLY_ALWAYS_INLINE void reset(std::nullptr_t = nullptr) noexcept {
    DCHECK(hprec_); // UB if *this is empty
    hprec_->reset_hazptr();
  }

  /* Swap ownership of hazard pointers between hazptr_holder-s. */
  /* Note: The owned hazard pointers remain unmodified during the swap
   * and continue to protect the respective objects that they were
   * protecting before the swap, if any. */
  FOLLY_ALWAYS_INLINE void swap(hazptr_holder<Atom>& rhs) noexcept {
    std::swap(this->hprec_, rhs.hprec_);
  }

  /** Returns a pointer to the owned hazptr_rec */
  FOLLY_ALWAYS_INLINE hazptr_rec<Atom>* hprec() const noexcept {
    return hprec_;
  }

  /** Set the pointer to the owned hazptr_rec */
  FOLLY_ALWAYS_INLINE void set_hprec(hazptr_rec<Atom>* hprec) noexcept {
    hprec_ = hprec;
  }
}; // hazptr_holder

/**
 *  Free function swap of hazptr_holder-s.
 */
template <template <typename> class Atom>
FOLLY_ALWAYS_INLINE void swap(
    hazptr_holder<Atom>& lhs,
    hazptr_holder<Atom>& rhs) noexcept {
  lhs.swap(rhs);
}

/**
 *  Type used by hazptr_array and hazptr_local.
 */
template <template <typename> class Atom>
using aligned_hazptr_holder = typename std::aligned_storage<
    sizeof(hazptr_holder<Atom>),
    alignof(hazptr_holder<Atom>)>::type;

/**
 *  hazptr_array
 *
 *  Optimized template for bulk construction and destruction of hazard
 *  pointers.
 *
 *  WARNING: Do not move from or to individual hazptr_holder-s.
 *  Only move the whole hazptr_array.
 *
 *  NOTE: It is allowed to swap an individual hazptr_holder that
 *  belongs to hazptr_array with (a) a hazptr_holder object, or (b) a
 *  hazptr_holder that is part of hazptr_array, under the conditions:
 *  (i) both hazptr_holder-s are either both empty or both nonempty
 *  and (ii) both belong to the same domain.
 */
template <uint8_t M, template <typename> class Atom>
class hazptr_array {
  static_assert(M > 0, "M must be a positive integer.");

  aligned_hazptr_holder<Atom> raw_[M];
  bool empty_{false};

 public:
  /** Constructor */
  FOLLY_ALWAYS_INLINE hazptr_array() {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
#if FOLLY_HAZPTR_THR_LOCAL
    static_assert(
        M <= hazptr_tc<Atom>::capacity(),
        "M must be within the thread cache capacity.");
    auto& tc = hazptr_tc_tls<Atom>();
    auto count = tc.count();
    if (UNLIKELY(M > count)) {
      tc.fill(M - count);
      count = M;
    }
    uint8_t offset = count - M;
    for (uint8_t i = 0; i < M; ++i) {
      auto hprec = tc[offset + i].get();
      DCHECK(hprec != nullptr);
      new (&h[i]) hazptr_holder<Atom>(nullptr);
      h[i].set_hprec(hprec);
    }
    tc.set_count(offset);
#else
    for (uint8_t i = 0; i < M; ++i) {
      new (&h[i]) hazptr_holder<Atom>;
    }
#endif
  }

  /** Empty constructor */
  FOLLY_ALWAYS_INLINE hazptr_array(std::nullptr_t) noexcept {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
    for (uint8_t i = 0; i < M; ++i) {
      new (&h[i]) hazptr_holder<Atom>(nullptr);
    }
    empty_ = true;
  }

  /** Move constructor */
  FOLLY_ALWAYS_INLINE hazptr_array(hazptr_array&& other) noexcept {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
    auto hother = reinterpret_cast<hazptr_holder<Atom>*>(&other.raw_);
    for (uint8_t i = 0; i < M; ++i) {
      new (&h[i]) hazptr_holder<Atom>(std::move(hother[i]));
    }
    empty_ = other.empty_;
    other.empty_ = true;
  }

  hazptr_array(const hazptr_array&) = delete;
  hazptr_array& operator=(const hazptr_array&) = delete;

  /** Destructor */
  FOLLY_ALWAYS_INLINE ~hazptr_array() {
    if (empty_) {
      return;
    }
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
#if FOLLY_HAZPTR_THR_LOCAL
    auto& tc = hazptr_tc_tls<Atom>();
    auto count = tc.count();
    auto cap = hazptr_tc<Atom>::capacity();
    if (UNLIKELY((M + count) > cap)) {
      tc.evict((M + count) - cap);
      count = cap - M;
    }
    for (uint8_t i = 0; i < M; ++i) {
      h[i].reset();
      tc[count + i].fill(h[i].hprec());
      new (&h[i]) hazptr_holder<Atom>(nullptr);
    }
    tc.set_count(count + M);
#else
    for (uint8_t i = 0; i < M; ++i) {
      h[i].~hazptr_holder();
    }
#endif
  }

  /** Move operator */
  FOLLY_ALWAYS_INLINE hazptr_array& operator=(hazptr_array&& other) noexcept {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
    for (uint8_t i = 0; i < M; ++i) {
      h[i] = std::move(other[i]);
    }
    empty_ = other.empty_;
    other.empty_ = true;
    return *this;
  }

  /** [] operator */
  FOLLY_ALWAYS_INLINE hazptr_holder<Atom>& operator[](uint8_t i) noexcept {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
    DCHECK(i < M);
    return h[i];
  }
}; // hazptr_array

/**
 *  hazptr_local
 *
 *  Optimized for construction and destruction of one or more
 *  hazptr_holder-s with local scope.
 *
 *  WARNING 1: Do not move from or to individual hazptr_holder-s.
 *
 *  WARNING 2: There can only be one hazptr_local active for the same
 *  thread at any time. This is not tracked and checked by the
 *  implementation (except in debug mode) because it would negate the
 *  performance gains of this class.
 */
template <uint8_t M, template <typename> class Atom>
class hazptr_local {
  static_assert(M > 0, "M must be a positive integer.");

  aligned_hazptr_holder<Atom> raw_[M];

 public:
  /** Constructor */
  FOLLY_ALWAYS_INLINE hazptr_local() {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
#if FOLLY_HAZPTR_THR_LOCAL
    static_assert(
        M <= hazptr_tc<Atom>::capacity(),
        "M must be <= hazptr_tc::capacity().");
    auto& tc = hazptr_tc_tls<Atom>();
    auto count = tc.count();
    if (UNLIKELY(M > count)) {
      tc.fill(M - count);
    }
    if (kIsDebug) {
      DCHECK(!tc.local());
      tc.set_local(true);
    }
    for (uint8_t i = 0; i < M; ++i) {
      auto hprec = tc[i].get();
      DCHECK(hprec != nullptr);
      new (&h[i]) hazptr_holder<Atom>(nullptr);
      h[i].set_hprec(hprec);
    }
#else
    for (uint8_t i = 0; i < M; ++i) {
      new (&h[i]) hazptr_holder<Atom>;
    }
#endif
  }

  hazptr_local(const hazptr_local&) = delete;
  hazptr_local& operator=(const hazptr_local&) = delete;
  hazptr_local(hazptr_local&&) = delete;
  hazptr_local& operator=(hazptr_local&&) = delete;

  /** Destructor */
  FOLLY_ALWAYS_INLINE ~hazptr_local() {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
#if FOLLY_HAZPTR_THR_LOCAL
    if (kIsDebug) {
      auto& tc = hazptr_tc_tls<Atom>();
      DCHECK(tc.local());
      tc.set_local(false);
    }
    for (uint8_t i = 0; i < M; ++i) {
      h[i].reset();
    }
#else
    for (uint8_t i = 0; i < M; ++i) {
      h[i].~hazptr_holder();
    }
#endif
  }

  /** [] operator */
  FOLLY_ALWAYS_INLINE hazptr_holder<Atom>& operator[](uint8_t i) noexcept {
    auto h = reinterpret_cast<hazptr_holder<Atom>*>(&raw_);
    DCHECK(i < M);
    return h[i];
  }
}; // hazptr_local

} // namespace folly

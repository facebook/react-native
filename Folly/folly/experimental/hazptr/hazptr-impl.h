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
/* override-include-guard */
#ifndef HAZPTR_H
#error "This should only be included by hazptr.h"
#endif

/* quality of implementation switches */

// NOTE: The #ifndef pattern is prone to ODR violation. Its use for
// quality of implementation options is temporary. Eventually these
// options should be added to the API in future API extensions.

#ifndef HAZPTR_AMB
#define HAZPTR_AMB true
#endif

#ifndef HAZPTR_TC

// If we are targeting a mobile device, do not use thread caching as a
// precaution. Performance is potentially suboptimal without thread
// local support
#if FOLLY_MOBILE
#define HAZPTR_TC false
#else
#define HAZPTR_TC true
#endif
#endif

#ifndef HAZPTR_TC_SIZE
#define HAZPTR_TC_SIZE 10
#endif

#ifndef HAZPTR_PRIV
// If we are targeting a mobile device, do not use thread caching as a
// precaution. Performance is potentially suboptimal without thread
// local support
#if FOLLY_MOBILE
#define HAZPTR_PRIV false
#else
#define HAZPTR_PRIV true
#endif
#endif

#ifndef HAZPTR_ENABLE_TLS
#if HAZPTR_TC || HAZPTR_PRIV
#define HAZPTR_ENABLE_TLS true
#else
#define HAZPTR_ENABLE_TLS false
#endif
#endif

#ifndef HAZPTR_PRIV_THRESHOLD
#define HAZPTR_PRIV_THRESHOLD 20
#endif

#ifndef HAZPTR_ONE_DOMAIN
#define HAZPTR_ONE_DOMAIN false
#endif

#ifndef HAZPTR_SCAN_MULT
#define HAZPTR_SCAN_MULT 2
#endif

#ifndef HAZPTR_SCAN_THRESHOLD
#define HAZPTR_SCAN_THRESHOLD 1000
#endif

/* stats switch */
#ifndef HAZPTR_STATS
#define HAZPTR_STATS false
#endif

#include <folly/SingletonThreadLocal.h>
#include <folly/concurrency/CacheLocality.h>
#include <folly/experimental/hazptr/debug.h>
#include <folly/synchronization/AsymmetricMemoryBarrier.h>

#include <mutex> // for thread caching
#include <unordered_set> // for hash set in bulk reclamation

namespace folly {
namespace hazptr {

/**
 *  Helper classes and functions
 */

/** hazptr_stats */

class hazptr_stats;

#if HAZPTR_STATS
#define INC_HAZPTR_STATS(x) hazptr_stats_.x()
#else
#define INC_HAZPTR_STATS(x)
#endif

/** hazptr_mb */

class hazptr_mb {
 public:
  static void light();
  static void heavy();
};

/**
 *  TLS structures
 */

/** TLS life state */

enum hazptr_tls_state { TLS_ALIVE, TLS_UNINITIALIZED, TLS_DESTROYED };

/** hazptr_tc structures
 *  Thread caching of hazptr_rec-s that belong to the default domain.
 */

struct hazptr_tc_entry {
  hazptr_rec* hprec_;

  void fill(hazptr_rec* hprec);
  hazptr_rec* get();
  void evict();
};

static_assert(
    std::is_trivial<hazptr_tc_entry>::value,
    "hazptr_tc_entry must be trivial"
    " to avoid a branch to check initialization");

struct hazptr_tc {
  hazptr_tc_entry entry_[HAZPTR_TC_SIZE];
  size_t count_;
  bool local_; // for debug mode only

 public:
  hazptr_tc_entry& operator[](size_t i);
  hazptr_rec* get();
  bool put(hazptr_rec* hprec);
  size_t count();
};

static_assert(
    std::is_trivial<hazptr_tc>::value,
    "hazptr_tc must be trivial to avoid a branch to check initialization");

bool hazptr_tc_enabled();
bool hazptr_priv_enabled();

hazptr_tc* hazptr_tc_tls();
void hazptr_tc_init(hazptr_tc& tc);
void hazptr_tc_shutdown(hazptr_tc& tc);
hazptr_rec* hazptr_tc_try_get();
bool hazptr_tc_try_put(hazptr_rec* hprec);

/** hazptr_priv structures
 *  Thread private lists of retired objects that belong to the default domain.
 */
class hazptr_priv {
  std::atomic<hazptr_obj*> head_;
  std::atomic<hazptr_obj*> tail_;
  int rcount_;
  bool active_;
  hazptr_priv* prev_;
  hazptr_priv* next_;

 public:
  void init() {
    head_ = nullptr;
    tail_ = nullptr;
    rcount_ = 0;
    active_ = true;
  }

  bool active() {
    return active_;
  }

  hazptr_priv* prev() {
    return prev_;
  }

  hazptr_priv* next() {
    return next_;
  }

  bool empty() {
    return head() == nullptr;
  }

  void set_prev(hazptr_priv* rec) {
    prev_ = rec;
  }

  void set_next(hazptr_priv* rec) {
    next_ = rec;
  }

  void clear_active() {
    active_ = false;
  }

  void push(hazptr_obj* obj) {
    while (true) {
      if (tail()) {
        if (pushInNonEmptyList(obj)) {
          break;
        }
      } else {
        if (pushInEmptyList(obj)) {
          break;
        }
      }
    }
    if (++rcount_ >= HAZPTR_PRIV_THRESHOLD) {
      push_all_to_domain();
    }
  }

  void push_all_to_domain() {
    auto& domain = default_hazptr_domain();
    hazptr_obj* h = nullptr;
    hazptr_obj* t = nullptr;
    collect(h, t);
    if (h) {
      DCHECK(t);
      domain.pushRetired(h, t, rcount_);
    }
    rcount_ = 0;
    domain.tryBulkReclaim();
    domain.tryTimedCleanup();
  }

  void collect(hazptr_obj*& colHead, hazptr_obj*& colTail) {
    // This function doesn't change rcount_.
    // The value rcount_ is accurate excluding the effects of collect().
    auto h = exchangeHead();
    if (h) {
      auto t = exchangeTail();
      DCHECK(t);
      if (colTail) {
        colTail->set_next(h);
      } else {
        colHead = h;
      }
      colTail = t;
    }
  }

 private:
  hazptr_obj* head() {
    return head_.load(std::memory_order_acquire);
  }

  hazptr_obj* tail() {
    return tail_.load(std::memory_order_acquire);
  }

  void setHead(hazptr_obj* obj) {
    head_.store(obj, std::memory_order_release);
  }

  bool casHead(hazptr_obj* expected, hazptr_obj* obj) {
    return head_.compare_exchange_weak(
        expected, obj, std::memory_order_acq_rel, std::memory_order_relaxed);
  }

  bool casTail(hazptr_obj* expected, hazptr_obj* obj) {
    return tail_.compare_exchange_weak(
        expected, obj, std::memory_order_acq_rel, std::memory_order_relaxed);
  }

  hazptr_obj* exchangeHead() {
    return head_.exchange(nullptr, std::memory_order_acq_rel);
  }

  hazptr_obj* exchangeTail() {
    return tail_.exchange(nullptr, std::memory_order_acq_rel);
  }

  bool pushInNonEmptyList(hazptr_obj* obj) {
    auto h = head();
    if (h) {
      obj->set_next(h);
      if (casHead(h, obj)) {
        return true;
      }
    }
    return false;
  }

  bool pushInEmptyList(hazptr_obj* obj) {
    hazptr_obj* t = nullptr;
    obj->set_next(nullptr);
    if (casTail(t, obj)) {
      setHead(obj);
      return true;
    }
    return false;
  }
};

static_assert(
    folly::kCpplibVer || std::is_trivial<hazptr_priv>::value,
    "hazptr_priv must be trivial to avoid a branch to check initialization");

void hazptr_priv_init(hazptr_priv& priv);
void hazptr_priv_shutdown(hazptr_priv& priv);
bool hazptr_priv_try_retire(hazptr_obj* obj);

/** tls globals */

struct hazptr_tls_globals_ {
  hazptr_tls_state tls_state{TLS_UNINITIALIZED};
  hazptr_tc tc;
  hazptr_priv priv;

  hazptr_tls_globals_() {
    HAZPTR_DEBUG_PRINT(this);
    tls_state = TLS_ALIVE;
    hazptr_tc_init(tc);
    hazptr_priv_init(priv);
  }
  ~hazptr_tls_globals_() {
    HAZPTR_DEBUG_PRINT(this);
    CHECK(tls_state == TLS_ALIVE);
    hazptr_tc_shutdown(tc);
    hazptr_priv_shutdown(priv);
    tls_state = TLS_DESTROYED;
  }
};

struct HazptrTag {};
typedef folly::SingletonThreadLocal<hazptr_tls_globals_, HazptrTag> PrivList;
FOLLY_ALWAYS_INLINE hazptr_tls_globals_& hazptr_tls_globals() {
  return PrivList::get();
}

/**
 *  hazptr_domain
 */

inline constexpr hazptr_domain::hazptr_domain(memory_resource* mr) noexcept
    : mr_(mr) {}

/**
 *  hazptr_obj_base
 */

template <typename T, typename D>
inline void hazptr_obj_base<T, D>::retire(hazptr_domain& domain, D deleter) {
  HAZPTR_DEBUG_PRINT(this << " " << &domain);
  retireCheck();
  deleter_ = std::move(deleter);
  reclaim_ = [](hazptr_obj* p) {
    auto hobp = static_cast<hazptr_obj_base*>(p);
    auto obj = static_cast<T*>(hobp);
    hobp->deleter_(obj);
  };
  if (HAZPTR_PRIV &&
      (HAZPTR_ONE_DOMAIN || (&domain == &default_hazptr_domain()))) {
    if (hazptr_priv_try_retire(this)) {
      return;
    }
  }
  domain.objRetire(this);
}

/**
 *  hazptr_obj_base_refcounted
 */

template <typename T, typename D>
inline void hazptr_obj_base_refcounted<T, D>::retire(
    hazptr_domain& domain,
    D deleter) {
  HAZPTR_DEBUG_PRINT(this << " " << &domain);
  preRetire(deleter);
  if (HAZPTR_PRIV &&
      (HAZPTR_ONE_DOMAIN || (&domain == &default_hazptr_domain()))) {
    if (hazptr_priv_try_retire(this)) {
      return;
    }
  }
  domain.objRetire(this);
}

template <typename T, typename D>
inline void hazptr_obj_base_refcounted<T, D>::acquire_ref() {
  HAZPTR_DEBUG_PRINT(this);
  auto oldval = refcount_.fetch_add(1);
  DCHECK(oldval >= 0);
}

template <typename T, typename D>
inline void hazptr_obj_base_refcounted<T, D>::acquire_ref_safe() {
  HAZPTR_DEBUG_PRINT(this);
  auto oldval = refcount_.load(std::memory_order_acquire);
  DCHECK(oldval >= 0);
  refcount_.store(oldval + 1, std::memory_order_release);
}

template <typename T, typename D>
inline bool hazptr_obj_base_refcounted<T, D>::release_ref() {
  HAZPTR_DEBUG_PRINT(this);
  auto oldval = refcount_.load(std::memory_order_acquire);
  if (oldval > 0) {
    oldval = refcount_.fetch_sub(1);
  } else {
    if (kIsDebug) {
      refcount_.store(static_cast<decltype(refcount_)>(-1));
    }
  }
  HAZPTR_DEBUG_PRINT(this << " " << oldval);
  DCHECK(oldval >= 0);
  return oldval == 0;
}

template <typename T, typename D>
inline void hazptr_obj_base_refcounted<T, D>::preRetire(D deleter) {
  deleter_ = std::move(deleter);
  retireCheck();
  reclaim_ = [](hazptr_obj* p) {
    auto hrobp = static_cast<hazptr_obj_base_refcounted*>(p);
    if (hrobp->release_ref()) {
      auto obj = static_cast<T*>(hrobp);
      hrobp->deleter_(obj);
    }
  };
}

/**
 *  hazptr_rec
 */

class alignas(hardware_destructive_interference_size) hazptr_rec {
  friend class hazptr_domain;
  friend class hazptr_holder;
  friend struct hazptr_tc_entry;

  std::atomic<const void*> hazptr_{nullptr};
  hazptr_rec* next_{nullptr};
  std::atomic<bool> active_{false};

  void set(const void* p) noexcept;
  const void* get() const noexcept;
  void clear() noexcept;
  bool isActive() noexcept;
  bool tryAcquire() noexcept;
  void release() noexcept;
};

/**
 *  hazptr_holder
 */

FOLLY_ALWAYS_INLINE hazptr_holder::hazptr_holder(hazptr_domain& domain) {
  domain_ = &domain;
  if (LIKELY(
          HAZPTR_TC &&
          (HAZPTR_ONE_DOMAIN || &domain == &default_hazptr_domain()))) {
    auto hprec = hazptr_tc_try_get();
    if (LIKELY(hprec != nullptr)) {
      hazptr_ = hprec;
      HAZPTR_DEBUG_PRINT(this << " " << domain_ << " " << hazptr_);
      return;
    }
  }
  hazptr_ = domain_->hazptrAcquire();
  HAZPTR_DEBUG_PRINT(this << " " << domain_ << " " << hazptr_);
  if (hazptr_ == nullptr) {
    std::bad_alloc e;
    throw e;
  }
}

FOLLY_ALWAYS_INLINE hazptr_holder::hazptr_holder(std::nullptr_t) noexcept {
  domain_ = nullptr;
  hazptr_ = nullptr;
  HAZPTR_DEBUG_PRINT(this << " " << domain_ << " " << hazptr_);
}

FOLLY_ALWAYS_INLINE hazptr_holder::~hazptr_holder() {
  HAZPTR_DEBUG_PRINT(this);
  if (LIKELY(hazptr_ != nullptr)) {
    DCHECK(domain_ != nullptr);
    hazptr_->clear();
    if (LIKELY(
            HAZPTR_TC &&
            (HAZPTR_ONE_DOMAIN || domain_ == &default_hazptr_domain()))) {
      if (LIKELY(hazptr_tc_try_put(hazptr_))) {
        return;
      }
    }
    domain_->hazptrRelease(hazptr_);
  }
}

FOLLY_ALWAYS_INLINE hazptr_holder::hazptr_holder(hazptr_holder&& rhs) noexcept {
  domain_ = rhs.domain_;
  hazptr_ = rhs.hazptr_;
  rhs.domain_ = nullptr;
  rhs.hazptr_ = nullptr;
}

FOLLY_ALWAYS_INLINE
hazptr_holder& hazptr_holder::operator=(hazptr_holder&& rhs) noexcept {
  /* Self-move is a no-op.  */
  if (LIKELY(this != &rhs)) {
    this->~hazptr_holder();
    new (this) hazptr_holder(std::move(rhs));
  }
  return *this;
}

template <typename T>
FOLLY_ALWAYS_INLINE bool hazptr_holder::try_protect(
    T*& ptr,
    const std::atomic<T*>& src) noexcept {
  return try_protect(ptr, src, [](T* t) { return t; });
}

template <typename T, typename Func>
FOLLY_ALWAYS_INLINE bool hazptr_holder::try_protect(
    T*& ptr,
    const std::atomic<T*>& src,
    Func f) noexcept {
  HAZPTR_DEBUG_PRINT(this << " " << ptr << " " << &src);
  reset(f(ptr));
  /*** Full fence ***/ hazptr_mb::light();
  T* p = src.load(std::memory_order_acquire);
  if (UNLIKELY(p != ptr)) {
    ptr = p;
    reset();
    return false;
  }
  return true;
}

template <typename T>
FOLLY_ALWAYS_INLINE T* hazptr_holder::get_protected(
    const std::atomic<T*>& src) noexcept {
  return get_protected(src, [](T* t) { return t; });
}

template <typename T, typename Func>
FOLLY_ALWAYS_INLINE T* hazptr_holder::get_protected(
    const std::atomic<T*>& src,
    Func f) noexcept {
  T* p = src.load(std::memory_order_relaxed);
  while (!try_protect(p, src, f)) {
  }
  HAZPTR_DEBUG_PRINT(this << " " << p << " " << &src);
  return p;
}

template <typename T>
FOLLY_ALWAYS_INLINE void hazptr_holder::reset(const T* ptr) noexcept {
  auto p = static_cast<hazptr_obj*>(const_cast<T*>(ptr));
  HAZPTR_DEBUG_PRINT(this << " " << ptr << " p:" << p);
  DCHECK(hazptr_); // UB if *this is empty
  hazptr_->set(p);
}

FOLLY_ALWAYS_INLINE void hazptr_holder::reset(std::nullptr_t) noexcept {
  HAZPTR_DEBUG_PRINT(this);
  DCHECK(hazptr_); // UB if *this is empty
  hazptr_->clear();
}

FOLLY_ALWAYS_INLINE void hazptr_holder::swap(hazptr_holder& rhs) noexcept {
  HAZPTR_DEBUG_PRINT(
      this << " " << this->hazptr_ << " " << this->domain_ << " -- " << &rhs
           << " " << rhs.hazptr_ << " " << rhs.domain_);
  if (!HAZPTR_ONE_DOMAIN) {
    std::swap(this->domain_, rhs.domain_);
  }
  std::swap(this->hazptr_, rhs.hazptr_);
}

FOLLY_ALWAYS_INLINE void swap(hazptr_holder& lhs, hazptr_holder& rhs) noexcept {
  lhs.swap(rhs);
}

/**
 *  hazptr_array
 */

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_array<M>::hazptr_array() {
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  if (HAZPTR_TC) {
    auto ptc = hazptr_tc_tls();
    if (LIKELY(ptc != nullptr)) {
      auto& tc = *ptc;
      auto count = tc.count();
      if (M <= count) {
        size_t offset = count - M;
        for (size_t i = 0; i < M; ++i) {
          auto hprec = tc[offset + i].hprec_;
          DCHECK(hprec != nullptr);
          HAZPTR_DEBUG_PRINT(i << " " << &h[i]);
          new (&h[i]) hazptr_holder(nullptr);
          h[i].hazptr_ = hprec;
          HAZPTR_DEBUG_PRINT(
              i << " " << &h[i] << " " << h[i].domain_ << " " << h[i].hazptr_);
        }
        tc.count_ = offset;
        return;
      }
    }
  }
  // slow path
  for (size_t i = 0; i < M; ++i) {
    new (&h[i]) hazptr_holder;
    HAZPTR_DEBUG_PRINT(
        i << " " << &h[i] << " " << h[i].domain_ << " " << h[i].hazptr_);
  }
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_array<M>::hazptr_array(
    hazptr_array&& other) noexcept {
  HAZPTR_DEBUG_PRINT(this << " " << M << " " << &other);
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  auto hother = reinterpret_cast<hazptr_holder*>(&other.raw_);
  for (size_t i = 0; i < M; ++i) {
    new (&h[i]) hazptr_holder(std::move(hother[i]));
    HAZPTR_DEBUG_PRINT(i << " " << &h[i] << " " << &hother[i]);
  }
  empty_ = other.empty_;
  other.empty_ = true;
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_array<M>::hazptr_array(std::nullptr_t) noexcept {
  HAZPTR_DEBUG_PRINT(this << " " << M);
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  for (size_t i = 0; i < M; ++i) {
    new (&h[i]) hazptr_holder(nullptr);
    HAZPTR_DEBUG_PRINT(i << " " << &h[i]);
  }
  empty_ = true;
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_array<M>::~hazptr_array() {
  if (empty_) {
    return;
  }
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  if (HAZPTR_TC) {
    auto ptc = hazptr_tc_tls();
    if (LIKELY(ptc != nullptr)) {
      auto& tc = *ptc;
      auto count = tc.count();
      if ((M <= HAZPTR_TC_SIZE) && (count + M <= HAZPTR_TC_SIZE)) {
        for (size_t i = 0; i < M; ++i) {
          h[i].reset();
          tc[count + i].hprec_ = h[i].hazptr_;
          HAZPTR_DEBUG_PRINT(i << " " << &h[i]);
          new (&h[i]) hazptr_holder(nullptr);
          HAZPTR_DEBUG_PRINT(
              i << " " << &h[i] << " " << h[i].domain_ << " " << h[i].hazptr_);
        }
        tc.count_ = count + M;
        return;
      }
    }
  }
  // slow path
  for (size_t i = 0; i < M; ++i) {
    h[i].domain_ = &default_hazptr_domain();
    h[i].~hazptr_holder();
  }
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_array<M>& hazptr_array<M>::operator=(
    hazptr_array&& other) noexcept {
  HAZPTR_DEBUG_PRINT(this << " " << M << " " << &other);
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  for (size_t i = 0; i < M; ++i) {
    h[i] = std::move(other[i]);
    HAZPTR_DEBUG_PRINT(i << " " << &h[i] << " " << &other[i]);
  }
  empty_ = other.empty_;
  other.empty_ = true;
  return *this;
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_holder& hazptr_array<M>::operator[](
    size_t i) noexcept {
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  DCHECK(i < M);
  return h[i];
}

/**
 *  hazptr_local
 */

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_local<M>::hazptr_local() {
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  if (HAZPTR_TC) {
    auto ptc = hazptr_tc_tls();
    if (LIKELY(ptc != nullptr)) {
      auto& tc = *ptc;
      auto count = tc.count();
      if (M <= count) {
        if (kIsDebug) {
          DCHECK(!tc.local_);
          tc.local_ = true;
        }
        // Fast path
        for (size_t i = 0; i < M; ++i) {
          auto hprec = tc[i].hprec_;
          DCHECK(hprec != nullptr);
          HAZPTR_DEBUG_PRINT(i << " " << &h[i]);
          new (&h[i]) hazptr_holder(nullptr);
          h[i].hazptr_ = hprec;
          HAZPTR_DEBUG_PRINT(
              i << " " << &h[i] << " " << h[i].domain_ << " " << h[i].hazptr_);
        }
        return;
      }
    }
  }
  // Slow path
  slow_path_ = true;
  for (size_t i = 0; i < M; ++i) {
    new (&h[i]) hazptr_holder;
    HAZPTR_DEBUG_PRINT(
        i << " " << &h[i] << " " << h[i].domain_ << " " << h[i].hazptr_);
  }
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_local<M>::~hazptr_local() {
  if (LIKELY(!slow_path_)) {
    if (kIsDebug) {
      auto ptc = hazptr_tc_tls();
      DCHECK(ptc != nullptr);
      auto& tc = *ptc;
      DCHECK(tc.local_);
      tc.local_ = false;
    }
    auto h = reinterpret_cast<hazptr_holder*>(&raw_);
    for (size_t i = 0; i < M; ++i) {
      h[i].reset();
    }
    return;
  }
  // Slow path
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  for (size_t i = 0; i < M; ++i) {
    h[i].~hazptr_holder();
  }
}

template <size_t M>
FOLLY_ALWAYS_INLINE hazptr_holder& hazptr_local<M>::operator[](
    size_t i) noexcept {
  auto h = reinterpret_cast<hazptr_holder*>(&raw_);
  DCHECK(i < M);
  return h[i];
}

////////////////////////////////////////////////////////////////////////////////
// [TODO]:
// - Control of reclamation (when and by whom)
// - End-to-end lock-free implementation

/** Definition of default_hazptr_domain() */

FOLLY_ALWAYS_INLINE hazptr_domain& default_hazptr_domain() {
  HAZPTR_DEBUG_PRINT(&default_domain_);
  return default_domain_;
}

template <typename T, typename D>
FOLLY_ALWAYS_INLINE void hazptr_retire(T* obj, D reclaim) {
  default_hazptr_domain().retire(obj, std::move(reclaim));
}

inline void hazptr_cleanup(hazptr_domain& domain) {
  domain.cleanup();
}

/** hazptr_rec */

FOLLY_ALWAYS_INLINE void hazptr_rec::set(const void* p) noexcept {
  HAZPTR_DEBUG_PRINT(this << " " << p);
  hazptr_.store(p, std::memory_order_release);
}

inline const void* hazptr_rec::get() const noexcept {
  auto p = hazptr_.load(std::memory_order_acquire);
  HAZPTR_DEBUG_PRINT(this << " " << p);
  return p;
}

FOLLY_ALWAYS_INLINE void hazptr_rec::clear() noexcept {
  HAZPTR_DEBUG_PRINT(this);
  hazptr_.store(nullptr, std::memory_order_release);
}

inline bool hazptr_rec::isActive() noexcept {
  return active_.load(std::memory_order_acquire);
}

inline bool hazptr_rec::tryAcquire() noexcept {
  bool active = isActive();
  if (!active &&
      active_.compare_exchange_strong(
          active, true, std::memory_order_release, std::memory_order_relaxed)) {
    HAZPTR_DEBUG_PRINT(this);
    return true;
  }
  return false;
}

inline void hazptr_rec::release() noexcept {
  HAZPTR_DEBUG_PRINT(this);
  active_.store(false, std::memory_order_release);
}

/** hazptr_obj */

inline const void* hazptr_obj::getObjPtr() const {
  HAZPTR_DEBUG_PRINT(this);
  return this;
}

/** hazptr_domain */

template <typename T, typename D>
void hazptr_domain::retire(T* obj, D reclaim) {
  struct hazptr_retire_node : hazptr_obj {
    std::unique_ptr<T, D> obj_;

    hazptr_retire_node(T* retireObj, D toReclaim)
        : obj_{retireObj, std::move(toReclaim)} {}
  };

  auto node = new hazptr_retire_node(obj, std::move(reclaim));
  node->reclaim_ = [](hazptr_obj* p) {
    delete static_cast<hazptr_retire_node*>(p);
  };
  objRetire(node);
}

inline hazptr_domain::~hazptr_domain() {
  HAZPTR_DEBUG_PRINT(this);
  { /* reclaim all remaining retired objects */
    hazptr_obj* next;
    auto retired = retired_.exchange(nullptr);
    while (retired) {
      for (auto p = retired; p; p = next) {
        next = p->next_;
        DCHECK(p != next);
        HAZPTR_DEBUG_PRINT(this << " " << p);
        (*(p->reclaim_))(p);
      }
      retired = retired_.exchange(nullptr);
    }
  }
  /* Leak the data for the default domain to avoid destruction order
   * issues with thread caches.
   */
  if (this != &default_hazptr_domain()) {
    /* free all hazptr_rec-s */
    hazptr_rec* next;
    for (auto p = hazptrs_.load(std::memory_order_acquire); p; p = next) {
      next = p->next_;
      DCHECK(!p->isActive());
      mr_->deallocate(static_cast<void*>(p), sizeof(hazptr_rec));
    }
  }
}

inline void hazptr_domain::tryTimedCleanup() {
  uint64_t time = std::chrono::duration_cast<std::chrono::nanoseconds>(
                      std::chrono::steady_clock::now().time_since_epoch())
                      .count();
  auto prevtime = syncTime_.load(std::memory_order_relaxed);
  if (time < prevtime ||
      !syncTime_.compare_exchange_strong(
          prevtime, time + syncTimePeriod_, std::memory_order_relaxed)) {
    return;
  }
  cleanup();
}

inline void hazptr_domain::cleanup() {
  hazptr_obj* h = nullptr;
  hazptr_obj* t = nullptr;
  for (hazptr_tls_globals_& tls : PrivList::accessAllThreads()) {
    tls.priv.collect(h, t);
  }
  if (h) {
    DCHECK(t);
    pushRetired(h, t, 0);
  }
  bulkReclaim();
}

inline hazptr_rec* hazptr_domain::hazptrAcquire() {
  hazptr_rec* p;
  hazptr_rec* next;
  for (p = hazptrs_.load(std::memory_order_acquire); p; p = next) {
    next = p->next_;
    if (p->tryAcquire()) {
      return p;
    }
  }
  p = static_cast<hazptr_rec*>(mr_->allocate(sizeof(hazptr_rec)));
  HAZPTR_DEBUG_PRINT(this << " " << p << " " << sizeof(hazptr_rec));
  if (p == nullptr) {
    return nullptr;
  }
  p->active_.store(true, std::memory_order_relaxed);
  p->next_ = hazptrs_.load(std::memory_order_acquire);
  while (!hazptrs_.compare_exchange_weak(
      p->next_, p, std::memory_order_release, std::memory_order_acquire)) {
    /* keep trying */;
  }
  auto hcount = hcount_.fetch_add(1);
  HAZPTR_DEBUG_PRINT(
      this << " " << p << " " << sizeof(hazptr_rec) << " " << hcount);
  return p;
}

inline void hazptr_domain::hazptrRelease(hazptr_rec* p) noexcept {
  HAZPTR_DEBUG_PRINT(this << " " << p);
  p->release();
}

inline int
hazptr_domain::pushRetired(hazptr_obj* head, hazptr_obj* tail, int count) {
  /*** Full fence ***/ hazptr_mb::light();
  tail->next_ = retired_.load(std::memory_order_acquire);
  while (!retired_.compare_exchange_weak(
      tail->next_,
      head,
      std::memory_order_release,
      std::memory_order_acquire)) {
  }
  return rcount_.fetch_add(count) + count;
}

inline bool hazptr_domain::reachedThreshold(int rcount) {
  return (
      rcount >= HAZPTR_SCAN_THRESHOLD &&
      rcount >= HAZPTR_SCAN_MULT * hcount_.load(std::memory_order_acquire));
}

inline void hazptr_domain::objRetire(hazptr_obj* p) {
  auto rcount = pushRetired(p, p, 1);
  if (reachedThreshold(rcount)) {
    tryBulkReclaim();
  }
}

inline void hazptr_domain::tryBulkReclaim() {
  HAZPTR_DEBUG_PRINT(this);
  do {
    auto hcount = hcount_.load(std::memory_order_acquire);
    auto rcount = rcount_.load(std::memory_order_acquire);
    if (rcount < HAZPTR_SCAN_THRESHOLD || rcount < HAZPTR_SCAN_MULT * hcount) {
      return;
    }
    if (rcount_.compare_exchange_weak(
            rcount, 0, std::memory_order_release, std::memory_order_relaxed)) {
      break;
    }
  } while (true);
  bulkReclaim();
}

inline void hazptr_domain::bulkReclaim() {
  HAZPTR_DEBUG_PRINT(this);
  /*** Full fence ***/ hazptr_mb::heavy();
  auto p = retired_.exchange(nullptr, std::memory_order_acquire);
  auto h = hazptrs_.load(std::memory_order_acquire);
  std::unordered_set<const void*> hs; // TODO lock-free alternative
  for (; h; h = h->next_) {
    hs.insert(h->get());
  }
  int rcount = 0;
  hazptr_obj* retired = nullptr;
  hazptr_obj* tail = nullptr;
  hazptr_obj* next;
  for (; p; p = next) {
    next = p->next_;
    DCHECK(p != next);
    if (hs.count(p->getObjPtr()) == 0) {
      HAZPTR_DEBUG_PRINT(this << " " << p);
      (*(p->reclaim_))(p);
    } else {
      p->next_ = retired;
      retired = p;
      if (tail == nullptr) {
        tail = p;
      }
      ++rcount;
    }
  }
  if (tail) {
    pushRetired(retired, tail, rcount);
  }
}

/** hazptr_stats */

class hazptr_stats {
 public:
  ~hazptr_stats();
  void light();
  void heavy();
  void seq_cst();

 private:
  std::atomic<uint64_t> light_{0};
  std::atomic<uint64_t> heavy_{0};
  std::atomic<uint64_t> seq_cst_{0};
};

extern hazptr_stats hazptr_stats_;

inline hazptr_stats::~hazptr_stats() {
  HAZPTR_DEBUG_PRINT(this << " light " << light_.load());
  HAZPTR_DEBUG_PRINT(this << " heavy " << heavy_.load());
  HAZPTR_DEBUG_PRINT(this << " seq_cst " << seq_cst_.load());
}

FOLLY_ALWAYS_INLINE void hazptr_stats::light() {
  if (HAZPTR_STATS) {
    /* atomic */ ++light_;
  }
}

inline void hazptr_stats::heavy() {
  if (HAZPTR_STATS) {
    /* atomic */ ++heavy_;
  }
}

inline void hazptr_stats::seq_cst() {
  if (HAZPTR_STATS) {
    /* atomic */ ++seq_cst_;
  }
}

/** hazptr_mb */

FOLLY_ALWAYS_INLINE void hazptr_mb::light() {
  HAZPTR_DEBUG_PRINT("");
  if (HAZPTR_AMB) {
    folly::asymmetricLightBarrier();
    INC_HAZPTR_STATS(light);
  } else {
    atomic_thread_fence(std::memory_order_seq_cst);
    INC_HAZPTR_STATS(seq_cst);
  }
}

inline void hazptr_mb::heavy() {
  HAZPTR_DEBUG_PRINT("");
  if (HAZPTR_AMB) {
    folly::asymmetricHeavyBarrier(AMBFlags::EXPEDITED);
    INC_HAZPTR_STATS(heavy);
  } else {
    atomic_thread_fence(std::memory_order_seq_cst);
    INC_HAZPTR_STATS(seq_cst);
  }
}

/**
 *  TLS structures
 */

/**
 *  hazptr_tc structures
 */

/** hazptr_tc_entry */

FOLLY_ALWAYS_INLINE void hazptr_tc_entry::fill(hazptr_rec* hprec) {
  hprec_ = hprec;
  HAZPTR_DEBUG_PRINT(this << " " << hprec);
}

FOLLY_ALWAYS_INLINE hazptr_rec* hazptr_tc_entry::get() {
  auto hprec = hprec_;
  HAZPTR_DEBUG_PRINT(this << " " << hprec);
  return hprec;
}

inline void hazptr_tc_entry::evict() {
  auto hprec = hprec_;
  hprec->release();
  HAZPTR_DEBUG_PRINT(this << " " << hprec);
}

/** hazptr_tc */

FOLLY_ALWAYS_INLINE hazptr_tc_entry& hazptr_tc::operator[](size_t i) {
  DCHECK(i <= HAZPTR_TC_SIZE);
  return entry_[i];
}

FOLLY_ALWAYS_INLINE hazptr_rec* hazptr_tc::get() {
  if (LIKELY(count_ != 0)) {
    auto hprec = entry_[--count_].get();
    HAZPTR_DEBUG_PRINT(this << " " << hprec);
    return hprec;
  }
  HAZPTR_DEBUG_PRINT(this << " nullptr");
  return nullptr;
}

FOLLY_ALWAYS_INLINE bool hazptr_tc::put(hazptr_rec* hprec) {
  if (LIKELY(count_ < HAZPTR_TC_SIZE)) {
    entry_[count_++].fill(hprec);
    HAZPTR_DEBUG_PRINT(this << " " << count_ - 1);
    return true;
  }
  return false;
}

FOLLY_ALWAYS_INLINE size_t hazptr_tc::count() {
  return count_;
}

/** hazptr_tc free functions */
FOLLY_ALWAYS_INLINE hazptr_tc* hazptr_tc_tls() {
  HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
  if (LIKELY(hazptr_tls_globals().tls_state == TLS_ALIVE)) {
    HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
    return &hazptr_tls_globals().tc;
  } else if (hazptr_tls_globals().tls_state == TLS_UNINITIALIZED) {
    return &hazptr_tls_globals().tc;
  }
  return nullptr;
}

inline void hazptr_tc_init(hazptr_tc& tc) {
  HAZPTR_DEBUG_PRINT(&tc);
  tc.count_ = 0;
  if (kIsDebug) {
    tc.local_ = false;
  }
}

inline void hazptr_tc_shutdown(hazptr_tc& tc) {
  HAZPTR_DEBUG_PRINT(&tc);
  for (size_t i = 0; i < tc.count_; ++i) {
    tc.entry_[i].evict();
  }
}

FOLLY_ALWAYS_INLINE hazptr_rec* hazptr_tc_try_get() {
  HAZPTR_DEBUG_PRINT(TLS_UNINITIALIZED << TLS_ALIVE << TLS_DESTROYED);
  HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
  if (LIKELY(hazptr_tls_globals().tls_state == TLS_ALIVE)) {
    HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
    return hazptr_tls_globals().tc.get();
  } else if (hazptr_tls_globals().tls_state == TLS_UNINITIALIZED) {
    return hazptr_tls_globals().tc.get();
  }
  return nullptr;
}

FOLLY_ALWAYS_INLINE bool hazptr_tc_try_put(hazptr_rec* hprec) {
  HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
  if (LIKELY(hazptr_tls_globals().tls_state == TLS_ALIVE)) {
    HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
    return hazptr_tls_globals().tc.put(hprec);
  }
  return false;
}

/**
 *  hazptr_priv
 */

inline void hazptr_priv_init(hazptr_priv& priv) {
  HAZPTR_DEBUG_PRINT(&priv);
  priv.init();
}

inline void hazptr_priv_shutdown(hazptr_priv& priv) {
  HAZPTR_DEBUG_PRINT(&priv);
  DCHECK(priv.active());
  priv.clear_active();
  if (!priv.empty()) {
    priv.push_all_to_domain();
  }
}

inline bool hazptr_priv_try_retire(hazptr_obj* obj) {
  HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
  if (hazptr_tls_globals().tls_state == TLS_ALIVE) {
    HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
    hazptr_tls_globals().priv.push(obj);
    return true;
  } else if (hazptr_tls_globals().tls_state == TLS_UNINITIALIZED) {
    HAZPTR_DEBUG_PRINT(hazptr_tls_globals().tls_state);
    hazptr_tls_globals().priv.push(obj);
    return true;
  }
  return false;
}

} // namespace hazptr
} // namespace folly

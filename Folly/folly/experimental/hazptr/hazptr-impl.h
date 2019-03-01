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

/* override-include-guard */
#ifndef HAZPTR_H
#error "This should only be included by hazptr.h"
#endif

#include <folly/experimental/hazptr/debug.h>

#include <unordered_set>

namespace folly {
namespace hazptr {

/** hazptr_domain */

constexpr hazptr_domain::hazptr_domain(memory_resource* mr) noexcept
    : mr_(mr) {}

/** hazptr_obj_base */

template <typename T, typename D>
inline void hazptr_obj_base<T, D>::retire(hazptr_domain& domain, D deleter) {
  DEBUG_PRINT(this << " " << &domain);
  deleter_ = std::move(deleter);
  reclaim_ = [](hazptr_obj* p) {
    auto hobp = static_cast<hazptr_obj_base*>(p);
    auto obj = static_cast<T*>(hobp);
    hobp->deleter_(obj);
  };
  domain.objRetire(this);
}

/** hazptr_rec */

class hazptr_rec {
  friend class hazptr_domain;
  template <typename> friend class hazptr_owner;

  std::atomic<const void*> hazptr_ = {nullptr};
  hazptr_rec* next_ = {nullptr};
  std::atomic<bool> active_ = {false};

  void set(const void* p) noexcept;
  const void* get() const noexcept;
  void clear() noexcept;
  void release() noexcept;
};

/** hazptr_owner */

template <typename T>
inline hazptr_owner<T>::hazptr_owner(hazptr_domain& domain) {
  domain_ = &domain;
  hazptr_ = domain_->hazptrAcquire();
  DEBUG_PRINT(this << " " << domain_ << " " << hazptr_);
  if (hazptr_ == nullptr) { std::bad_alloc e; throw e; }
}

template <typename T>
hazptr_owner<T>::~hazptr_owner() {
  DEBUG_PRINT(this);
  domain_->hazptrRelease(hazptr_);
}

template <typename T>
template <typename A>
inline bool hazptr_owner<T>::try_protect(T*& ptr, const A& src) noexcept {
  static_assert(
      std::is_same<decltype(std::declval<A>().load()), T*>::value,
      "Return type of A::load() must be T*");
  DEBUG_PRINT(this << " " << ptr << " " << &src);
  set(ptr);
  T* p = src.load();
  if (p != ptr) {
    ptr = p;
    clear();
    return false;
  }
  return true;
}

template <typename T>
template <typename A>
inline T* hazptr_owner<T>::get_protected(const A& src) noexcept {
  static_assert(
      std::is_same<decltype(std::declval<A>().load()), T*>::value,
      "Return type of A::load() must be T*");
  T* p = src.load();
  while (!try_protect(p, src)) {}
  DEBUG_PRINT(this << " " << p << " " << &src);
  return p;
}

template <typename T>
inline void hazptr_owner<T>::set(const T* ptr) noexcept {
  DEBUG_PRINT(this << " " << ptr);
  hazptr_->set(ptr);
}

template <typename T>
inline void hazptr_owner<T>::clear() noexcept {
  DEBUG_PRINT(this);
  hazptr_->clear();
}

template <typename T>
inline void hazptr_owner<T>::swap(hazptr_owner<T>& rhs) noexcept {
  DEBUG_PRINT(
    this << " " <<  this->hazptr_ << " " << this->domain_ << " -- "
    << &rhs << " " << rhs.hazptr_ << " " << rhs.domain_);
  std::swap(this->domain_, rhs.domain_);
  std::swap(this->hazptr_, rhs.hazptr_);
}

template <typename T>
inline void swap(hazptr_owner<T>& lhs, hazptr_owner<T>& rhs) noexcept {
  lhs.swap(rhs);
}

////////////////////////////////////////////////////////////////////////////////
// Non-template part of implementation
////////////////////////////////////////////////////////////////////////////////
// [TODO]:
// - Thread caching of hazptr_rec-s
// - Private storage of retired objects
// - Control of reclamation (when and by whom)
// - Optimized memory order

/** Definition of default_hazptr_domain() */
inline hazptr_domain& default_hazptr_domain() {
  static hazptr_domain d;
  DEBUG_PRINT(&d);
  return d;
}

/** hazptr_rec */

inline void hazptr_rec::set(const void* p) noexcept {
  DEBUG_PRINT(this << " " << p);
  hazptr_.store(p);
}

inline const void* hazptr_rec::get() const noexcept {
  DEBUG_PRINT(this << " " << hazptr_.load());
  return hazptr_.load();
}

inline void hazptr_rec::clear() noexcept {
  DEBUG_PRINT(this);
  hazptr_.store(nullptr);
}

inline void hazptr_rec::release() noexcept {
  DEBUG_PRINT(this);
  clear();
  active_.store(false);
}

/** hazptr_obj */

inline const void* hazptr_obj::getObjPtr() const {
  DEBUG_PRINT(this);
  return this;
}

/** hazptr_domain */

inline hazptr_domain::~hazptr_domain() {
  DEBUG_PRINT(this);
  { /* free all hazptr_rec-s */
    hazptr_rec* next;
    for (auto p = hazptrs_.load(); p; p = next) {
      next = p->next_;
      mr_->deallocate(static_cast<void*>(p), sizeof(hazptr_rec));
    }
  }
  { /* reclaim all remaining retired objects */
    hazptr_obj* next;
    for (auto p = retired_.load(); p; p = next) {
      next = p->next_;
      (*(p->reclaim_))(p);
    }
  }
}

inline void hazptr_domain::try_reclaim() {
  DEBUG_PRINT(this);
  rcount_.exchange(0);
  bulkReclaim();
}

inline hazptr_rec* hazptr_domain::hazptrAcquire() {
  hazptr_rec* p;
  hazptr_rec* next;
  for (p = hazptrs_.load(); p; p = next) {
    next = p->next_;
    bool active = p->active_.load();
    if (!active) {
      if (p->active_.compare_exchange_weak(active, true)) {
        DEBUG_PRINT(this << " " << p);
        return p;
      }
    }
  }
  p = static_cast<hazptr_rec*>(mr_->allocate(sizeof(hazptr_rec)));
  if (p == nullptr) {
    return nullptr;
  }
  p->active_.store(true);
  do {
    p->next_ = hazptrs_.load();
    if (hazptrs_.compare_exchange_weak(p->next_, p)) {
      break;
    }
  } while (true);
  auto hcount = hcount_.fetch_add(1);
  DEBUG_PRINT(this << " " << p << " " << sizeof(hazptr_rec) << " " << hcount);
  return p;
}

inline void hazptr_domain::hazptrRelease(hazptr_rec* p) noexcept {
  DEBUG_PRINT(this << " " << p);
  p->release();
}

inline int
hazptr_domain::pushRetired(hazptr_obj* head, hazptr_obj* tail, int count) {
  tail->next_ = retired_.load();
  while (!retired_.compare_exchange_weak(tail->next_, head)) {}
  return rcount_.fetch_add(count);
}

inline void hazptr_domain::objRetire(hazptr_obj* p) {
  auto rcount = pushRetired(p, p, 1) + 1;
  if (rcount >= kScanThreshold * hcount_.load()) {
    tryBulkReclaim();
  }
}

inline void hazptr_domain::tryBulkReclaim() {
  DEBUG_PRINT(this);
  do {
    auto hcount = hcount_.load();
    auto rcount = rcount_.load();
    if (rcount < kScanThreshold * hcount) {
      return;
    }
    if (rcount_.compare_exchange_weak(rcount, 0)) {
      break;
    }
  } while (true);
  bulkReclaim();
}

inline void hazptr_domain::bulkReclaim() {
  DEBUG_PRINT(this);
  auto p = retired_.exchange(nullptr);
  auto h = hazptrs_.load();
  std::unordered_set<const void*> hs;
  for (; h; h = h->next_) {
    hs.insert(h->hazptr_.load());
  }
  int rcount = 0;
  hazptr_obj* retired = nullptr;
  hazptr_obj* tail = nullptr;
  hazptr_obj* next;
  for (; p; p = next) {
    next = p->next_;
    if (hs.count(p->getObjPtr()) == 0) {
      DEBUG_PRINT(this << " " << p << " " << p->reclaim_);
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

} // namespace folly
} // namespace hazptr

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

#if FOLLY_HAZPTR_THR_LOCAL

#include <folly/synchronization/HazptrObj.h>
#include <folly/synchronization/HazptrRec.h>

#include <folly/SingletonThreadLocal.h>

#include <glog/logging.h>

#include <atomic>

/**
 *  Thread local classes and singletons
 */

namespace folly {

/**
 *  hazptr_tc_entry
 *
 *  Thread cache entry.
 */
template <template <typename> class Atom>
class hazptr_tc_entry {
  hazptr_rec<Atom>* hprec_;

  template <uint8_t, template <typename> class>
  friend class hazptr_array;
  template <uint8_t, template <typename> class>
  friend class hazptr_local;
  friend class hazptr_tc<Atom>;

  FOLLY_ALWAYS_INLINE void fill(hazptr_rec<Atom>* hprec) noexcept {
    hprec_ = hprec;
  }

  FOLLY_ALWAYS_INLINE hazptr_rec<Atom>* get() const noexcept {
    return hprec_;
  }

  void evict() {
    hprec_->release();
  }
}; // hazptr_tc_entry

/**
 *  hazptr_tc:
 *
 *  Thread cache of hazptr_rec-s that belong to the default domain.
 */
template <template <typename> class Atom>
class hazptr_tc {
  static constexpr uint8_t kCapacity = 9;

  hazptr_tc_entry<Atom> entry_[kCapacity];
  uint8_t count_{0};
  bool local_{false}; // for debug mode only

 public:
  ~hazptr_tc() {
    for (uint8_t i = 0; i < count(); ++i) {
      entry_[i].evict();
    }
  }

  static constexpr uint8_t capacity() noexcept {
    return kCapacity;
  }

 private:
  template <uint8_t, template <typename> class>
  friend class hazptr_array;
  friend class hazptr_holder<Atom>;
  template <uint8_t, template <typename> class>
  friend class hazptr_local;

  FOLLY_ALWAYS_INLINE
  hazptr_tc_entry<Atom>& operator[](uint8_t i) noexcept {
    DCHECK(i <= capacity());
    return entry_[i];
  }

  FOLLY_ALWAYS_INLINE hazptr_rec<Atom>* try_get() noexcept {
    if (LIKELY(count_ > 0)) {
      auto hprec = entry_[--count_].get();
      return hprec;
    }
    return nullptr;
  }

  FOLLY_ALWAYS_INLINE bool try_put(hazptr_rec<Atom>* hprec) noexcept {
    if (LIKELY(count_ < capacity())) {
      entry_[count_++].fill(hprec);
      return true;
    }
    return false;
  }

  FOLLY_ALWAYS_INLINE uint8_t count() const noexcept {
    return count_;
  }

  FOLLY_ALWAYS_INLINE void set_count(uint8_t val) noexcept {
    count_ = val;
  }

  FOLLY_NOINLINE void fill(uint8_t num) {
    DCHECK_LE(count_ + num, capacity());
    auto& domain = default_hazptr_domain<Atom>();
    for (uint8_t i = 0; i < num; ++i) {
      auto hprec = domain.hprec_acquire();
      entry_[count_++].fill(hprec);
    }
  }

  FOLLY_NOINLINE void evict(uint8_t num) {
    DCHECK_GE(count_, num);
    for (uint8_t i = 0; i < num; ++i) {
      entry_[--count_].evict();
    }
  }

  bool local() const noexcept { // for debugging only
    return local_;
  }

  void set_local(bool b) noexcept { // for debugging only
    local_ = b;
  }
}; // hazptr_tc

/** hazptr_tc_tls */
template <template <typename> class Atom>
FOLLY_ALWAYS_INLINE hazptr_tc<Atom>& hazptr_tc_tls() {
  return folly::SingletonThreadLocal<hazptr_tc<Atom>, void>::get();
}

/**
 *  hazptr_priv
 *
 *  Per-thread list of retired objects to be pushed in bulk to domain.
 */
template <template <typename> class Atom>
class hazptr_priv {
  static constexpr int kThreshold = 20;

  Atom<hazptr_obj<Atom>*> head_;
  Atom<hazptr_obj<Atom>*> tail_;
  int rcount_;
  bool in_dtor_;

 public:
  hazptr_priv() : head_(nullptr), tail_(nullptr), rcount_(0), in_dtor_(false) {}

  ~hazptr_priv() {
    in_dtor_ = true;
    if (!empty()) {
      push_all_to_domain(false);
    }
  }

 private:
  friend class hazptr_domain<Atom>;
  friend class hazptr_obj<Atom>;

  bool empty() const noexcept {
    return head() == nullptr;
  }

  void push(hazptr_obj<Atom>* obj) {
    DCHECK(!in_dtor_);
    push_in_priv_list(obj);
  }

  void push_in_priv_list(hazptr_obj<Atom>* obj) {
    while (true) {
      if (tail()) {
        if (push_in_non_empty_list(obj)) {
          break;
        }
      } else {
        if (push_in_empty_list(obj)) {
          break;
        }
      }
    }
    if (++rcount_ >= kThreshold) {
      push_all_to_domain(true);
    }
  }

  void push_all_to_domain(bool check_to_reclaim) {
    hazptr_obj<Atom>* h = nullptr;
    hazptr_obj<Atom>* t = nullptr;
    collect(h, t);
    if (h) {
      DCHECK(t);
      hazptr_obj_list<Atom> l(h, t, rcount_);
      hazptr_domain_push_retired<Atom>(l, check_to_reclaim);
      rcount_ = 0;
    }
  }

  void collect(
      hazptr_obj<Atom>*& colHead,
      hazptr_obj<Atom>*& colTail) noexcept {
    // This function doesn't change rcount_.
    // The value rcount_ is accurate excluding the effects of calling collect().
    auto h = exchange_head();
    if (h) {
      auto t = exchange_tail();
      DCHECK(t);
      if (colTail) {
        colTail->set_next(h);
      } else {
        colHead = h;
      }
      colTail = t;
    }
  }

  hazptr_obj<Atom>* head() const noexcept {
    return head_.load(std::memory_order_acquire);
  }

  hazptr_obj<Atom>* tail() const noexcept {
    return tail_.load(std::memory_order_acquire);
  }

  void set_head(hazptr_obj<Atom>* obj) noexcept {
    head_.store(obj, std::memory_order_release);
  }

  bool cas_head(hazptr_obj<Atom>* expected, hazptr_obj<Atom>* obj) noexcept {
    return head_.compare_exchange_weak(
        expected, obj, std::memory_order_acq_rel, std::memory_order_relaxed);
  }

  bool cas_tail(hazptr_obj<Atom>* expected, hazptr_obj<Atom>* obj) noexcept {
    return tail_.compare_exchange_weak(
        expected, obj, std::memory_order_acq_rel, std::memory_order_relaxed);
  }

  hazptr_obj<Atom>* exchange_head() noexcept {
    return head_.exchange(nullptr, std::memory_order_acq_rel);
  }

  hazptr_obj<Atom>* exchange_tail() noexcept {
    return tail_.exchange(nullptr, std::memory_order_acq_rel);
  }

  bool push_in_non_empty_list(hazptr_obj<Atom>* obj) noexcept {
    auto h = head();
    if (h) {
      obj->set_next(h);
      if (cas_head(h, obj)) {
        return true;
      }
    }
    return false;
  }

  bool push_in_empty_list(hazptr_obj<Atom>* obj) noexcept {
    hazptr_obj<Atom>* t = nullptr;
    obj->set_next(nullptr);
    if (cas_tail(t, obj)) {
      set_head(obj);
      return true;
    }
    return false;
  }
}; // hazptr_priv

/** hazptr_priv_tls */
struct HazptrTag {};

template <template <typename> class Atom>
using hazptr_priv_singleton =
    folly::SingletonThreadLocal<hazptr_priv<Atom>, HazptrTag>;

template <template <typename> class Atom>
FOLLY_ALWAYS_INLINE hazptr_priv<Atom>& hazptr_priv_tls() {
  return hazptr_priv_singleton<Atom>::get();
}

} // namespace folly

#endif // FOLLY_HAZPTR_THR_LOCAL

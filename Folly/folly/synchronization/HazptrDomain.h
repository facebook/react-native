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
#include <folly/synchronization/HazptrObj.h>
#include <folly/synchronization/HazptrRec.h>
#include <folly/synchronization/HazptrThrLocal.h>

#include <folly/Portability.h>
#include <folly/Singleton.h>
#include <folly/synchronization/AsymmetricMemoryBarrier.h>

#include <atomic>
#include <unordered_set> // for hash set in bulk_reclaim

///
/// Classes related to hazard pointer domains.
///

namespace folly {

namespace detail {

constexpr int hazptr_domain_rcount_threshold() {
  return 1000;
}

} // namespace detail

/**
 *  hazptr_domain
 *
 *  A domain manages a set of hazard pointers and a set of retired objects.
 *
 *  Most user code need not specify any domains.
 */
template <template <typename> class Atom>
class hazptr_domain {
  static constexpr int kThreshold = detail::hazptr_domain_rcount_threshold();
  static constexpr int kMultiplier = 2;
  static constexpr uint64_t kSyncTimePeriod{2000000000}; // nanoseconds

  Atom<hazptr_rec<Atom>*> hazptrs_{nullptr};
  Atom<hazptr_obj<Atom>*> retired_{nullptr};
  Atom<uint64_t> sync_time_{0};
  /* Using signed int for rcount_ because it may transiently be negative.
     Using signed int for all integer variables that may be involved in
     calculations related to the value of rcount_. */
  Atom<int> hcount_{0};
  Atom<int> rcount_{0};
  Atom<uint16_t> num_bulk_reclaims_{0};
  bool shutdown_{false};

 public:
  /** Constructor */
  hazptr_domain() = default;

  /** Destructor */
  ~hazptr_domain() {
    shutdown_ = true;
    reclaim_all_objects();
    free_hazptr_recs();
  }

  hazptr_domain(const hazptr_domain&) = delete;
  hazptr_domain(hazptr_domain&&) = delete;
  hazptr_domain& operator=(const hazptr_domain&) = delete;
  hazptr_domain& operator=(hazptr_domain&&) = delete;

 public:
  /** retire - nonintrusive - allocates memory */
  template <typename T, typename D = std::default_delete<T>>
  void retire(T* obj, D reclaim = {}) {
    struct hazptr_retire_node : hazptr_obj<Atom> {
      std::unique_ptr<T, D> obj_;
      hazptr_retire_node(T* retireObj, D toReclaim)
          : obj_{retireObj, std::move(toReclaim)} {}
    };

    auto node = new hazptr_retire_node(obj, std::move(reclaim));
    node->reclaim_ = [](hazptr_obj<Atom>* p, hazptr_obj_list<Atom>&) {
      delete static_cast<hazptr_retire_node*>(p);
    };
    hazptr_obj_list<Atom> l(node);
    push_retired(l);
  }

  /** cleanup */
  void cleanup() noexcept {
    relaxed_cleanup();
    wait_for_zero_bulk_reclaims(); // wait for concurrent bulk_reclaim-s
  }

 private:
  friend void hazptr_domain_push_retired<Atom>(
      hazptr_obj_list<Atom>&,
      bool check,
      hazptr_domain<Atom>&) noexcept;
  friend class hazptr_holder<Atom>;
  friend class hazptr_obj<Atom>;
#if FOLLY_HAZPTR_THR_LOCAL
  friend class hazptr_tc<Atom>;
#endif

  /** hprec_acquire */
  hazptr_rec<Atom>* hprec_acquire() {
    auto rec = try_acquire_existing_hprec();
    return rec != nullptr ? rec : acquire_new_hprec();
  }

  /** hprec_release */
  void hprec_release(hazptr_rec<Atom>* hprec) noexcept {
    hprec->release();
  }

  /** push_retired */
  void push_retired(hazptr_obj_list<Atom>& l, bool check = true) {
    /*** Full fence ***/ asymmetricLightBarrier();
    while (true) {
      auto r = retired();
      l.tail()->set_next(r);
      if (retired_.compare_exchange_weak(
              r,
              l.head(),
              std::memory_order_release,
              std::memory_order_acquire)) {
        break;
      }
    }
    rcount_.fetch_add(l.count(), std::memory_order_release);
    if (check) {
      check_cleanup_and_reclaim();
    }
  }

  hazptr_rec<Atom>* head() const noexcept {
    return hazptrs_.load(std::memory_order_acquire);
  }

  hazptr_obj<Atom>* retired() const noexcept {
    return retired_.load(std::memory_order_acquire);
  }

  int hcount() const noexcept {
    return hcount_.load(std::memory_order_acquire);
  }

  int rcount() const noexcept {
    return rcount_.load(std::memory_order_acquire);
  }

  bool reached_threshold(int rc, int hc) const noexcept {
    return rc >= kThreshold && rc >= kMultiplier * hc;
  }

  void reclaim_all_objects() {
    auto retired = retired_.exchange(nullptr);
    while (retired) {
      auto obj = retired;
      hazptr_obj_list<Atom> l;
      while (obj) {
        auto next = obj->next();
        DCHECK(obj != next);
        (*(obj->reclaim()))(obj, l);
        obj = next;
      }
      if (l.count()) {
        push_retired(l);
      }
      retired = retired_.exchange(nullptr);
    }
  }

  void free_hazptr_recs() {
    /* Leak the hazard pointers for the default domain to avoid
       destruction order issues with thread caches.  */
    if (this == &default_hazptr_domain<Atom>()) {
      return;
    }
    auto rec = head();
    while (rec) {
      auto next = rec->next();
      DCHECK(!rec->active());
      delete rec;
      rec = next;
    }
  }

  void check_cleanup_and_reclaim() {
    if (try_timed_cleanup()) {
      return;
    }
    if (reached_threshold(rcount(), hcount())) {
      try_bulk_reclaim();
    }
  }

  void relaxed_cleanup() noexcept {
#if FOLLY_HAZPTR_THR_LOCAL
    hazptr_obj<Atom>* h = nullptr;
    hazptr_obj<Atom>* t = nullptr;
    for (hazptr_priv<Atom>& priv :
         hazptr_priv_singleton<Atom>::accessAllThreads()) {
      priv.collect(h, t);
    }
    if (h) {
      DCHECK(t);
      hazptr_obj_list<Atom> l(h, t, 0);
      push_retired(l);
    }
#endif
    rcount_.store(0, std::memory_order_release);
    bulk_reclaim(true);
  }

  void wait_for_zero_bulk_reclaims() {
    while (num_bulk_reclaims_.load(std::memory_order_acquire) > 0) {
      std::this_thread::yield();
    }
  }

  void try_bulk_reclaim() {
    auto hc = hcount();
    auto rc = rcount();
    if (!reached_threshold(rc, hc)) {
      return;
    }
    rc = rcount_.exchange(0, std::memory_order_release);
    if (!reached_threshold(rc, hc)) {
      /* No need to add rc back to rcount_. At least one concurrent
         try_bulk_reclaim will proceed to bulk_reclaim. */
      return;
    }
    bulk_reclaim();
  }

  void bulk_reclaim(bool transitive = false) {
    num_bulk_reclaims_.fetch_add(1, std::memory_order_acquire);
    while (true) {
      auto obj = retired_.exchange(nullptr, std::memory_order_acquire);
      /*** Full fence ***/ asymmetricHeavyBarrier(AMBFlags::EXPEDITED);
      auto rec = hazptrs_.load(std::memory_order_acquire);
      /* Part 1 - read hazard pointer values into private search structure */
      std::unordered_set<const void*> hashset; // TOTO: lock-free fixed hash set
      for (; rec; rec = rec->next()) {
        hashset.insert(rec->hazptr());
      }
      /* Part 2 - for each retired object, reclaim if no match */
      if (bulk_lookup_and_reclaim(obj, hashset) || !transitive) {
        break;
      }
    }
    num_bulk_reclaims_.fetch_sub(1, std::memory_order_release);
  }

  bool bulk_lookup_and_reclaim(
      hazptr_obj<Atom>* obj,
      const std::unordered_set<const void*>& hashset) {
    hazptr_obj_list<Atom> children;
    hazptr_obj_list<Atom> matched;
    while (obj) {
      auto next = obj->next();
      DCHECK_NE(obj, next);
      if (hashset.count(obj->raw_ptr()) == 0) {
        (*(obj->reclaim()))(obj, children);
      } else {
        matched.push(obj);
      }
      obj = next;
    }
#if FOLLY_HAZPTR_THR_LOCAL
    if (!shutdown_) {
      hazptr_priv_tls<Atom>().push_all_to_domain(false);
    }
#endif
    bool done = ((children.count() == 0) && (retired() == nullptr));
    matched.splice(children);
    if (matched.count() > 0) {
      push_retired(matched, false /* don't call bulk_reclaim recursively */);
    }
    return done;
  }

  bool try_timed_cleanup() {
    uint64_t time = std::chrono::duration_cast<std::chrono::nanoseconds>(
                        std::chrono::steady_clock::now().time_since_epoch())
                        .count();
    auto prevtime = sync_time_.load(std::memory_order_relaxed);
    if (time < prevtime ||
        !sync_time_.compare_exchange_strong(
            prevtime, time + kSyncTimePeriod, std::memory_order_relaxed)) {
      return false;
    }
    relaxed_cleanup(); // calling regular cleanup may self deadlock
    return true;
  }

  hazptr_rec<Atom>* try_acquire_existing_hprec() {
    auto rec = head();
    while (rec) {
      auto next = rec->next();
      if (rec->try_acquire()) {
        return rec;
      }
      rec = next;
    }
    return nullptr;
  }

  hazptr_rec<Atom>* acquire_new_hprec() {
    auto rec = new hazptr_rec<Atom>;
    rec->set_active();
    rec->set_domain(this);
    while (true) {
      auto h = head();
      rec->set_next(h);
      if (hazptrs_.compare_exchange_weak(
              h, rec, std::memory_order_release, std::memory_order_acquire)) {
        break;
      }
    }
    hcount_.fetch_add(1);
    return rec;
  }
}; // hazptr_domain

/**
 *  Free functions related to hazptr domains
 */

/** default_hazptr_domain: Returns reference to the default domain */

template <template <typename> class Atom>
struct hazptr_default_domain_helper {
  static FOLLY_ALWAYS_INLINE hazptr_domain<Atom>& get() {
    static hazptr_domain<Atom> domain;
    return domain;
  }
};

template <>
struct hazptr_default_domain_helper<std::atomic> {
  static FOLLY_ALWAYS_INLINE hazptr_domain<std::atomic>& get() {
    return default_domain;
  }
};

template <template <typename> class Atom>
FOLLY_ALWAYS_INLINE hazptr_domain<Atom>& default_hazptr_domain() {
  return hazptr_default_domain_helper<Atom>::get();
}

/** hazptr_domain_push_retired: push a list of retired objects into a domain */
template <template <typename> class Atom>
void hazptr_domain_push_retired(
    hazptr_obj_list<Atom>& l,
    bool check,
    hazptr_domain<Atom>& domain) noexcept {
  domain.push_retired(l, check);
}

/** hazptr_retire */
template <template <typename> class Atom, typename T, typename D>
FOLLY_ALWAYS_INLINE void hazptr_retire(T* obj, D reclaim) {
  default_hazptr_domain<Atom>().retire(obj, std::move(reclaim));
}

/** hazptr_cleanup: Reclaims all reclaimable objects retired to the domain */
template <template <typename> class Atom>
void hazptr_cleanup(hazptr_domain<Atom>& domain) noexcept {
  domain.cleanup();
}

} // namespace folly

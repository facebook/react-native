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

#include <glog/logging.h>

#include <atomic>
#include <stack>

///
/// Classes related to link counted objects and automatic retirement.
///

namespace folly {

/**
 *  hazptr_root
 *
 *  Link to counted objects. When destroyed unlinks the linked object
 *  if any.
 *
 *  Template parameter T must support a member function unlink(),
 *  inherited from hazptr_obj_base_linked.
 *
 *  Use example: Bucket heads in ConcurrentHashMap.
 */
template <typename T, template <typename> class Atom>
class hazptr_root {
  Atom<T*> link_;

 public:
  explicit hazptr_root(T* p = nullptr) noexcept : link_(p) {}

  ~hazptr_root() {
    auto p = link_.load(std::memory_order_relaxed);
    if (p) {
      p->unlink();
    }
  }

  const Atom<T*>& operator()() const noexcept {
    return link_;
  }

  Atom<T*>& operator()() noexcept {
    return link_;
  }
}; // hazptr_root

/**
 *  hazptr_obj_linked
 *
 *  Base class template for link counted objects.
 *  Supports:
 *  - Protecting descendants of protected objects.
 *  - One-pass reclamation of long immutable chains of objects.
 *  - Automatic reclamation of acyclic structures.
 *
 *  Two inbound link counts are maintained per object:
 *  - Link count: Represents the number of links from mutable paths.
 *  - Ref count: Represents the number of links from immutable paths.
 *     [Note: The ref count is one less than such links plus one if
 *     the object hasn't gone through matching with hazard pointers
 *     without finding a match. That is, a new object without inbound
 *     links has a ref count of 0 and an about-to-be-reclaimed object
 *     can be viewed to have a ref count of -1.]
 *
 *  User code can increment the link and ref counts by calling
 *  acquire_link and acquire_ref or their variants that require the
 *  user to guarantee thread safety. There are no public functions to
 *  decrement the counts explicitly. Counts are decremented implicitly
 *  as described in hazptr_obj_base_linked.
 */
template <template <typename> class Atom>
class hazptr_obj_linked : public hazptr_obj<Atom> {
  using Count = uint32_t;

  static constexpr Count kRef = 1u;
  static constexpr Count kLink = 1u << 16;
  static constexpr Count kRefMask = kLink - 1u;
  static constexpr Count kLinkMask = ~kRefMask;

  Atom<Count> count_{0};

 public:
  void acquire_link() noexcept {
    count_inc(kLink);
  }

  void acquire_link_safe() noexcept {
    count_inc_safe(kLink);
  }

  void acquire_ref() noexcept {
    count_inc(kRef);
  }

  void acquire_ref_safe() noexcept {
    count_inc_safe(kRef);
  }

 private:
  template <typename, template <typename> class, typename>
  friend class hazptr_obj_base_linked;

  Count count() const noexcept {
    return count_.load(std::memory_order_acquire);
  }

  void count_set(Count val) noexcept {
    count_.store(val, std::memory_order_release);
  }

  void count_inc(Count add) noexcept {
    auto oldval = count_.fetch_add(add, std::memory_order_acq_rel);
    DCHECK_LT(oldval & kLinkMask, kLinkMask);
    DCHECK_LT(oldval & kRefMask, kRefMask);
  }

  void count_inc_safe(Count add) noexcept {
    auto oldval = count();
    count_set(oldval + add);
    DCHECK_LT(oldval & kLinkMask, kLinkMask);
    DCHECK_LT(oldval & kRefMask, kRefMask);
  }

  bool count_cas(Count& oldval, Count newval) noexcept {
    return count_.compare_exchange_weak(
        oldval, newval, std::memory_order_acq_rel, std::memory_order_acquire);
  }

  bool release_link() noexcept {
    auto sub = kLink;
    auto oldval = count();
    while (true) {
      DCHECK_GT(oldval & kLinkMask, 0u);
      if (oldval == kLink) {
        count_set(0u);
        return true;
      }
      if (count_cas(oldval, oldval - sub)) {
        return false;
      }
    }
  }

  bool release_ref() noexcept {
    auto sub = kRef;
    auto oldval = count();
    while (true) {
      if (oldval == 0u) {
        if (kIsDebug) {
          count_set(kRefMask);
        }
        return true;
      }
      DCHECK_GT(oldval & kRefMask, 0u);
      if (count_cas(oldval, oldval - sub)) {
        return false;
      }
    }
  }

  bool downgrade_link() noexcept {
    auto oldval = count();
    auto sub = kLink - kRef;
    while (true) {
      if (oldval == kLink) {
        count_set(kRef);
        return true;
      }
      if (count_cas(oldval, oldval - sub)) {
        return (oldval & kLinkMask) == kLink;
      }
    }
  }
}; // hazptr_obj_linked

/**
 *  hazptr_obj_base_linked
 *
 *  Base class template for link counted objects.
 *
 *  Supports both *explicit* and *implicit* object retirement, depending
 *  on whether object removal is *certain* or *uncertain*.
 *
 *  A derived object's removal is certain when it is always possible
 *  to reason based only on the local state of user code when an
 *  object is removed, i.e., becomes unreachable from static
 *  roots. Otherwise, removal is uncertain.
 *
 *  For example, Removal in UnboundedQueue is certain, whereas removal
 *  is ConcurrentHashMap is uncertain.
 *
 *  If removal is certain, user code can call retire() explicitly.
 *  Otherwise, user code should call unlink() whenever an inbound
 *  link to the object is changed. Calls to unlink() automatically
 *  retire the object when the link count is decremented to 0. [Note:
 *  A ref count greater than 0 does not delay retiring an object.]
 *
 *  Derived type T must define a member function template
 *    template <typename S>
 *    void push_links(bool m, S& s) {
 *      if (m) { // m stands mutable links
 *        // for each outbound mutable pointer p call
 *        //   s.push(p);
 *      } else {
 *        // for each outbound immutable pointer p call
 *        //   s.push(p);
 *      }
 *   }
 *
 *   T may have both, either, or none of the two types of outbound
 *   links. For example, UnboundedQueue Segment has an immutable
 *   link, and ConcurrentHashMap NodeT has a mutable link.
 */
template <typename T, template <typename> class Atom, typename D>
class hazptr_obj_base_linked : public hazptr_obj_linked<Atom>,
                               public hazptr_deleter<T, D> {
  using Stack = std::stack<hazptr_obj_base_linked<T, Atom, D>*>;

 public:
  void retire() {
    this->pre_retire_check(); // defined in hazptr_obj
    set_reclaim();
    this->push_to_retired(
        default_hazptr_domain<Atom>()); // defined in hazptr_obj
  }

  /* unlink: Retire object if last link is released. */
  void unlink() {
    if (this->release_link()) { // defined in hazptr_obj_linked
      downgrade_retire_immutable_descendants();
      retire();
    }
  }

  /* unlink_and_reclaim_unchecked: Reclaim object if the last link is
     released, without checking hazard pointers. To be called only
     when the object cannot possibly be protected by any hazard
     pointers. */
  void unlink_and_reclaim_unchecked() {
    if (this->release_link()) { // defined in hazptr_obj_linked
      DCHECK_EQ(this->count(), 0u);
      delete_self();
    }
  }

 private:
  void set_reclaim() noexcept {
    this->reclaim_ = [](hazptr_obj<Atom>* p, hazptr_obj_list<Atom>& l) {
      auto obj = static_cast<hazptr_obj_base_linked<T, Atom, D>*>(p);
      if (obj->release_ref()) { // defined in hazptr_obj_linked
        obj->release_delete_immutable_descendants();
        obj->release_retire_mutable_children(l);
        obj->delete_self();
      }
    };
  }

  void downgrade_retire_immutable_descendants() {
    Stack s;
    call_push_links(false, s);
    while (!s.empty()) {
      auto p = s.top();
      s.pop();
      if (p && p->downgrade_link()) {
        p->call_push_links(false, s);
        p->retire();
      }
    }
  }

  void release_delete_immutable_descendants() {
    Stack s;
    call_push_links(false, s);
    while (!s.empty()) {
      auto p = s.top();
      s.pop();
      if (p && p->release_ref()) {
        p->call_push_links(false, s);
        p->delete_self();
      }
    }
  }

  void release_retire_mutable_children(hazptr_obj_list<Atom>& l) {
    Stack s;
    call_push_links(true, s);
    while (!s.empty()) {
      auto p = s.top();
      s.pop();
      if (p->release_link()) {
        p->pre_retire_check(); // defined in hazptr_obj
        p->set_reclaim();
        l.push(p); // treated as if retired immediately
      }
    }
  }

  void call_push_links(bool m, Stack& s) {
    static_cast<T*>(this)->push_links(m, s); // to be defined in T
  }

  void delete_self() {
    this->delete_obj(static_cast<T*>(this)); // defined in hazptr_deleter
  }
}; // hazptr_obj_base_linked

} // namespace folly

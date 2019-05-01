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

#include <folly/synchronization/Hazptr.h>

#include <atomic>

namespace folly {

/** Set implemented as an ordered singly-linked list.
 *
 *  A single writer thread may add or remove elements. Multiple reader
 *  threads may search the set concurrently with each other and with
 *  the writer's operations.
 */
template <typename T, template <typename> class Atom = std::atomic>
class HazptrSWMRSet {
  template <typename Node>
  struct Reclaimer {
    void operator()(Node* p) {
      delete p;
    }
  };

  struct Node : public hazptr_obj_base<Node, Atom, Reclaimer<Node>> {
    T elem_;
    Atom<Node*> next_;

    Node(T e, Node* n) : elem_(e), next_(n) {}
  };

  Atom<Node*> head_{nullptr};

 public:
  HazptrSWMRSet() : head_(nullptr) {}

  ~HazptrSWMRSet() {
    auto p = head_.load();
    while (p) {
      auto next = p->next_.load();
      delete p;
      p = next;
    }
  }

  bool add(T v) {
    auto prev = &head_;
    locate_lower_bound(v, prev);
    auto curr = prev->load(std::memory_order_relaxed);
    if (curr && curr->elem_ == v) {
      return false;
    }
    prev->store(new Node(std::move(v), curr));
    return true;
  }

  bool remove(const T& v) {
    auto prev = &head_;
    locate_lower_bound(v, prev);
    auto curr = prev->load(std::memory_order_relaxed);
    if (!curr || curr->elem_ != v) {
      return false;
    }
    Node* curr_next = curr->next_.load();
    // Patch up the actual list...
    prev->store(curr_next, std::memory_order_release);
    // ...and only then null out the removed node.
    curr->next_.store(nullptr, std::memory_order_release);
    curr->retire();
    return true;
  }

  /* Used by readers */
  bool contains(const T& val) const {
    /* Two hazard pointers for hand-over-hand traversal. */
    hazptr_local<2, Atom> hptr;
    hazptr_holder<Atom>* hptr_prev = &hptr[0];
    hazptr_holder<Atom>* hptr_curr = &hptr[1];
    while (true) {
      auto prev = &head_;
      auto curr = prev->load(std::memory_order_acquire);
      while (true) {
        if (!curr) {
          return false;
        }
        if (!hptr_curr->try_protect(curr, *prev)) {
          break;
        }
        auto next = curr->next_.load(std::memory_order_acquire);
        if (prev->load(std::memory_order_acquire) != curr) {
          break;
        }
        if (curr->elem_ == val) {
          return true;
        } else if (!(curr->elem_ < val)) {
          return false; // because the list is sorted
        }
        prev = &(curr->next_);
        curr = next;
        std::swap(hptr_curr, hptr_prev);
      }
    }
  }

 private:
  /* Used by the single writer */
  void locate_lower_bound(const T& v, Atom<Node*>*& prev) const {
    auto curr = prev->load(std::memory_order_relaxed);
    while (curr) {
      if (curr->elem_ >= v) {
        break;
      }
      prev = &(curr->next_);
      curr = curr->next_.load(std::memory_order_relaxed);
    }
    return;
  }
};

} // namespace folly

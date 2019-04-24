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

#include <folly/experimental/hazptr/debug.h>
#include <folly/experimental/hazptr/hazptr.h>

namespace folly {
namespace hazptr {

/** Set implemented as an ordered singly-linked list.
 *
 *  A single writer thread may add or remove elements. Multiple reader
 *  threads may search the set concurrently with each other and with
 *  the writer's operations.
 */
template <typename T>
class SWMRListSet {
  template <typename Node>
  struct Reclaimer {
    void operator()(Node* p) {
      HAZPTR_DEBUG_PRINT(p << " " << sizeof(Node));
      delete p;
    }
  };

  class Node : public hazptr_obj_base<Node, Reclaimer<Node>> {
    friend SWMRListSet;
    T elem_;
    std::atomic<Node*> next_;

    Node(T e, Node* n) : elem_(e), next_(n) {
      HAZPTR_DEBUG_PRINT(this << " " << e << " " << n);
    }

   public:
    ~Node() {
      HAZPTR_DEBUG_PRINT(this);
    }
  };

  std::atomic<Node*> head_ = {nullptr};

  /* Used by the single writer */
  void locate_lower_bound(const T& v, std::atomic<Node*>*& prev) const {
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

 public:
  ~SWMRListSet() {
    Node* next;
    for (auto p = head_.load(); p; p = next) {
      next = p->next_.load();
      delete p;
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
    hazptr_local<2> hptr;
    hazptr_holder* hptr_prev = &hptr[0];
    hazptr_holder* hptr_curr = &hptr[1];
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
};

} // namespace hazptr
} // namespace folly

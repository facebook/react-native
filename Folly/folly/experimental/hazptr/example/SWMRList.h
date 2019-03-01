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
      DEBUG_PRINT(p << " " << sizeof(Node));
      delete p;
    }
  };

  class Node : public hazptr_obj_base<Node, Reclaimer<Node>> {
    friend SWMRListSet;
    T elem_;
    std::atomic<Node*> next_;

    Node(T e, Node* n) : elem_(e), next_(n) {
      DEBUG_PRINT(this << " " << e << " " << n);
    }

   public:
    ~Node() {
      DEBUG_PRINT(this);
    }
  };

  std::atomic<Node*> head_ = {nullptr};
  hazptr_domain& domain_;

  /* Used by the single writer */
  void locate_lower_bound(const T v, std::atomic<Node*>*& prev) const {
    auto curr = prev->load();
    while (curr) {
      if (curr->elem_ >= v) break;
      prev = &(curr->next_);
      curr = curr->next_.load();
    }
    return;
  }

 public:
  explicit SWMRListSet(hazptr_domain& domain = default_hazptr_domain())
      : domain_(domain) {}

  ~SWMRListSet() {
    Node* next;
    for (auto p = head_.load(); p; p = next) {
      next = p->next_.load();
      delete p;
    }
  }

  bool add(const T v) {
    auto prev = &head_;
    locate_lower_bound(v, prev);
    auto curr = prev->load();
    if (curr && curr->elem_ == v) return false;
    prev->store(new Node(v, curr));
    return true;
  }

  bool remove(const T v) {
    auto prev = &head_;
    locate_lower_bound(v, prev);
    auto curr = prev->load();
    if (!curr || curr->elem_ != v) return false;
    prev->store(curr->next_.load());
    curr->retire(domain_);
    return true;
  }
  /* Used by readers */
  bool contains(const T val) const {
    /* Acquire two hazard pointers for hand-over-hand traversal. */
    hazptr_owner<Node> hptr_prev(domain_);
    hazptr_owner<Node> hptr_curr(domain_);
    T elem;
    bool done = false;
    while (!done) {
      auto prev = &head_;
      auto curr = prev->load();
      while (true) {
        if (!curr) { done = true; break; }
        if (!hptr_curr.try_protect(curr, *prev))
          break;
        auto next = curr->next_.load();
        elem = curr->elem_;
        if (prev->load() != curr) break;
        if (elem >= val) { done = true; break; }
        prev = &(curr->next_);
        curr = next;
        /* Swap does not change the values of the owned hazard
         * pointers themselves. After the swap, The hazard pointer
         * owned by hptr_prev continues to protect the node that
         * contains the pointer *prev. The hazard pointer owned by
         * hptr_curr will continue to protect the node that contains
         * the old *prev (unless the old prev was &head), which no
         * longer needs protection, so hptr_curr's hazard pointer is
         * now free to protect *curr in the next iteration (if curr !=
         * null).
         */
        swap(hptr_curr, hptr_prev);
      }
    }
    return elem == val;
    /* The hazard pointers are released automatically. */
  }
};

} // namespace folly {
} // namespace hazptr {

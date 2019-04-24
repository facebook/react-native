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

#include <folly/experimental/hazptr/debug.h>
#include <folly/experimental/hazptr/hazptr.h>

namespace folly {
namespace hazptr {

/** Set implemented as an ordered singly-linked list.
 *
 *  Multiple writers may add or remove elements. Multiple reader
 *  threads may search the set concurrently with each other and with
 *  the writers' operations.
 */
template <typename T>
class MWMRListSet {
  class Node : public hazptr_obj_base<Node> {
    friend MWMRListSet;
    T elem_;
    std::atomic<uint64_t> refcount_{1};
    std::atomic<Node*> next_{nullptr};

    // Node must be refcounted for wait-free access: A deleted node
    // may have hazptrs pointing at it, so the rest of the list (or at
    // least, what existed at the time of the hazptr load) must still
    // be accessible.
    void release() {
      if (refcount_.fetch_sub(1) == 1) {
        this->retire();
      }
    }

    // Optimization in the case that we know there are no hazptrs pointing
    // at the list.
    void releaseFast() {
      if (refcount_.load(std::memory_order_relaxed) == 1) {
        auto next = getPtr(next_.load(std::memory_order_relaxed));
        if (next) {
          next->releaseFast();
          next_.store(nullptr, std::memory_order_relaxed);
        }
        delete this;
      }
    }

    void acquire() {
      DCHECK(refcount_.load() != 0);
      refcount_.fetch_add(1);
    }

   public:
    explicit Node(T e) : elem_(e) {
      HAZPTR_DEBUG_PRINT(this << " " << e);
    }

    ~Node() {
      HAZPTR_DEBUG_PRINT(this);
      auto next = getPtr(next_.load(std::memory_order_relaxed));
      if (next) {
        next->release();
      }
    }
  };

  static bool getDeleted(Node* ptr) {
    return uintptr_t(ptr) & 1;
  }

  static Node* getPtr(Node* ptr) {
    return (Node*)(uintptr_t(ptr) & ~1UL);
  }

  mutable std::atomic<Node*> head_ = {nullptr};

  // Remove a single deleted item.
  // Although it doesn't have to be our item.
  //
  // Note that standard lock-free Michael linked lists put this in the
  // contains() path, while this implementation leaves it only in
  // remove(), such that contains() is wait-free.
  void fixlist(
      hazptr_holder& hptr_prev,
      hazptr_holder& hptr_curr,
      std::atomic<Node*>*& prev,
      Node*& curr) const {
    while (true) {
      prev = &head_;
      curr = hptr_curr.get_protected(*prev, getPtr);
      while (getPtr(curr)) {
        auto next = getPtr(curr)->next_.load(std::memory_order_acquire);
        if (getDeleted(next)) {
          auto nextp = getPtr(next);
          if (nextp) {
            nextp->acquire();
          }
          // Try to fix
          auto curr_no_mark = getPtr(curr);
          if (prev->compare_exchange_weak(curr_no_mark, nextp)) {
            // Physically delete
            curr_no_mark->release();
            return;
          } else {
            if (nextp) {
              nextp->release();
            }
            break;
          }
        }
        prev = &(getPtr(curr)->next_);
        curr = hptr_prev.get_protected(getPtr(curr)->next_, getPtr);

        swap(hptr_curr, hptr_prev);
      }
      DCHECK(getPtr(curr));
    }
  }

  /* wait-free set search */
  bool find(
      const T& val,
      hazptr_holder& hptr_prev,
      hazptr_holder& hptr_curr,
      std::atomic<Node*>*& prev,
      Node*& curr) const {
    prev = &head_;
    curr = hptr_curr.get_protected(*prev, getPtr);
    while (getPtr(curr)) {
      auto next = getPtr(curr)->next_.load(std::memory_order_acquire);
      if (!getDeleted(next)) {
        if (getPtr(curr)->elem_ == val) {
          return true;
        } else if (!(getPtr(curr)->elem_ < val)) {
          break; // Because the list is sorted.
        }
      }
      prev = &(getPtr(curr)->next_);
      curr = hptr_prev.get_protected(getPtr(curr)->next_, getPtr);
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

    return false;
  }

 public:
  explicit MWMRListSet() {}

  ~MWMRListSet() {
    Node* next = head_.load();
    if (next) {
      next->releaseFast();
    }
  }

  bool add(T v) {
    hazptr_holder hptr_prev;
    hazptr_holder hptr_curr;
    std::atomic<Node*>* prev;
    Node* cur;

    auto newnode = folly::make_unique<Node>(v);

    while (true) {
      if (find(v, hptr_prev, hptr_curr, prev, cur)) {
        return false;
      }
      newnode->next_.store(cur, std::memory_order_relaxed);
      auto cur_no_mark = getPtr(cur);
      if (prev->compare_exchange_weak(cur_no_mark, newnode.get())) {
        newnode.release();
        return true;
      }
      // Ensure ~Node() destructor doesn't destroy next_
      newnode->next_.store(nullptr, std::memory_order_relaxed);
    }
  }

  bool remove(const T& v) {
    hazptr_holder hptr_prev;
    hazptr_holder hptr_curr;
    std::atomic<Node*>* prev;
    Node* curr;

    while (true) {
      if (!find(v, hptr_prev, hptr_curr, prev, curr)) {
        return false;
      }
      auto next = getPtr(curr)->next_.load(std::memory_order_acquire);
      auto next_no_mark = getPtr(next); // Ensure only one deleter wins
      // Logically delete
      if (!getPtr(curr)->next_.compare_exchange_weak(
              next_no_mark, (Node*)(uintptr_t(next_no_mark) | 1))) {
        continue;
      }
      if (next) {
        next->acquire();
      }

      // Swing prev around
      auto curr_no_mark = getPtr(curr); /* ensure not deleted */
      if (prev->compare_exchange_weak(curr_no_mark, next)) {
        // Physically delete
        curr->release();
        return true;
      }
      if (next) {
        next->release();
      }

      // Someone else modified prev.  Call fixlist
      // to unlink deleted element by re-walking list.
      fixlist(hptr_prev, hptr_curr, prev, curr);
    }
  }

  bool contains(const T& v) const {
    hazptr_holder hptr_prev;
    hazptr_holder hptr_curr;
    std::atomic<Node*>* prev;
    Node* curr;

    return find(v, hptr_prev, hptr_curr, prev, curr);
  }
};

} // namespace hazptr
} // namespace folly

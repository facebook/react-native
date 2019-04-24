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

#include <atomic>

#include <folly/Function.h>
#include <folly/Synchronized.h>
#include <folly/ThreadLocal.h>
#include <glog/logging.h>

namespace folly {

namespace detail {

// This is a thread-local cached, multi-producer single-consumer
// queue, similar to a concurrent version of std::list.
//
class ThreadCachedListsBase {
 public:
  struct Node {
    folly::Function<void()> cb_;
    Node* next_{nullptr};
  };
};

template <typename Tag>
class ThreadCachedLists : public ThreadCachedListsBase {
 public:
  struct AtomicListHead {
    std::atomic<Node*> tail_{nullptr};
    std::atomic<Node*> head_{nullptr};
  };

  // Non-concurrent list, similar to std::list.
  struct ListHead {
    Node* head_{nullptr};
    Node* tail_{nullptr};

    // Run func on each list node.
    template <typename Func>
    void forEach(Func func) {
      auto node = tail_;
      while (node != nullptr) {
        auto next = node->next_;
        func(node);
        node = next;
      }
    }

    // Splice other in to this list.
    // Afterwards, other is a valid empty listhead.
    void splice(ListHead& other);

    void splice(AtomicListHead& other);
  };

  // Push a node on a thread-local list.  Returns true if local list
  // was pushed global.
  void push(Node* node);

  // Collect all thread local lists to a single local list.
  // This function is threadsafe with concurrent push()es,
  // but only a single thread may call collect() at a time.
  void collect(ListHead& list);

 private:
  // Push list to the global list.
  void pushGlobal(ListHead& list);

  folly::Synchronized<ListHead> ghead_;

  struct TLHead : public AtomicListHead {
    ThreadCachedLists* parent_;

   public:
    TLHead(ThreadCachedLists* parent) : parent_(parent) {}

    ~TLHead() {
      parent_->ghead_->splice(*this);
    }
  };

  folly::ThreadLocalPtr<TLHead, Tag> lhead_;
};

// push() and splice() are optimistic w.r.t setting the list head: The
// first pusher cas's the list head, which functions as a lock until
// tail != null.  The first pusher then sets tail_ = head_.
//
// splice() does the opposite: steals the tail_ via exchange, then
// unlocks the list again by setting head_ to null.
template <typename Tag>
void ThreadCachedLists<Tag>::push(Node* node) {
  DCHECK(node->next_ == nullptr);
  static thread_local TLHead* cache_{nullptr};

  if (!cache_) {
    auto l = lhead_.get();
    if (!l) {
      lhead_.reset(new TLHead(this));
      l = lhead_.get();
      DCHECK(l);
    }
    cache_ = l;
  }

  while (true) {
    auto head = cache_->head_.load(std::memory_order_relaxed);
    if (!head) {
      node->next_ = nullptr;
      if (cache_->head_.compare_exchange_weak(head, node)) {
        cache_->tail_.store(node);
        break;
      }
    } else {
      auto tail = cache_->tail_.load(std::memory_order_relaxed);
      if (tail) {
        node->next_ = tail;
        if (cache_->tail_.compare_exchange_weak(node->next_, node)) {
          break;
        }
      }
    }
  }
}

template <typename Tag>
void ThreadCachedLists<Tag>::collect(ListHead& list) {
  auto acc = lhead_.accessAllThreads();

  for (auto& thr : acc) {
    list.splice(thr);
  }

  list.splice(*ghead_.wlock());
}

template <typename Tag>
void ThreadCachedLists<Tag>::ListHead::splice(ListHead& other) {
  if (other.head_ != nullptr) {
    DCHECK(other.tail_ != nullptr);
  } else {
    DCHECK(other.tail_ == nullptr);
    return;
  }

  if (head_) {
    DCHECK(tail_ != nullptr);
    DCHECK(head_->next_ == nullptr);
    head_->next_ = other.tail_;
    head_ = other.head_;
  } else {
    DCHECK(head_ == nullptr);
    head_ = other.head_;
    tail_ = other.tail_;
  }

  other.head_ = nullptr;
  other.tail_ = nullptr;
}

template <typename Tag>
void ThreadCachedLists<Tag>::ListHead::splice(AtomicListHead& list) {
  ListHead local;

  auto tail = list.tail_.load();
  if (tail) {
    local.tail_ = list.tail_.exchange(nullptr);
    local.head_ = list.head_.exchange(nullptr);
    splice(local);
  }
}

} // namespace detail
} // namespace folly

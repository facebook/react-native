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

template <typename T>
class LockFreeLIFO {
  class Node : public hazptr_obj_base<Node> {
    friend LockFreeLIFO;
   public:
    ~Node() {
      DEBUG_PRINT(this);
    }
   private:
    Node(T v, Node* n) : value_(v), next_(n) {
      DEBUG_PRINT(this);
    }
    T value_;
    Node* next_;
  };

 public:
  LockFreeLIFO() {
    DEBUG_PRINT(this);
  }

  ~LockFreeLIFO() {
    DEBUG_PRINT(this);
  }

  void push(T val) {
    DEBUG_PRINT(this);
    auto pnode = new Node(val, head_.load());
    while (!head_.compare_exchange_weak(pnode->next_, pnode));
  }

  bool pop(T& val) {
    DEBUG_PRINT(this);
    hazptr_owner<Node> hptr;
    Node* pnode = head_.load();
    do {
      if (pnode == nullptr)
        return false;
      if (!hptr.try_protect(pnode, head_))
        continue;
      auto next = pnode->next_;
      if (head_.compare_exchange_weak(pnode, next)) break;
    } while (true);
    hptr.clear();
    val = pnode->value_;
    pnode->retire();
    return true;
  }

 private:
  std::atomic<Node*> head_ = {nullptr};
};

} // namespace folly {
} // namespace hazptr {

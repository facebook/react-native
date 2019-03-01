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

#include <string>

namespace folly {
namespace hazptr {

/** Wide CAS.
 */
class WideCAS {
  using T = std::string;
  class Node : public hazptr_obj_base<Node> {
    friend WideCAS;
    T val_;
    Node() : val_(T()) { DEBUG_PRINT(this << " " << val_); }
    explicit Node(T v) : val_(v) { DEBUG_PRINT(this << " " << v); }
   public:
    ~Node() { DEBUG_PRINT(this); }
  };

  std::atomic<Node*> p_ = {new Node()};

 public:
  WideCAS() = default;
  ~WideCAS() {
    DEBUG_PRINT(this << " " << p_.load());
    delete p_.load();
  }

  bool cas(T& u, T& v) {
    DEBUG_PRINT(this << " " << u << " " << v);
    Node* n = new Node(v);
    hazptr_owner<Node> hptr;
    Node* p;
    do {
      p = hptr.get_protected(p_);
      if (p->val_ != u) { delete n; return false; }
      if (p_.compare_exchange_weak(p, n)) break;
    } while (true);
    hptr.clear();
    p->retire();
    DEBUG_PRINT(this << " " << p << " " << u << " " << n << " " << v);
    return true;
  }
};

} // namespace folly {
} // namespace hazptr {

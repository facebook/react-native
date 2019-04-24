/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/experimental/exception_tracer/StackTrace.h>

#include <cassert>
#include <cstdlib>
#include <new>

#include <folly/experimental/symbolizer/StackTrace.h>

namespace folly {
namespace exception_tracer {

class StackTraceStack::Node : public StackTrace {
 public:
  static Node* allocate();
  void deallocate();

  Node* next;

 private:
  Node() : next(nullptr) {}
  ~Node() {}
};

auto StackTraceStack::Node::allocate() -> Node* {
  // Null pointer on error, please.
  return new (std::nothrow) Node();
}

void StackTraceStack::Node::deallocate() {
  delete this;
}

bool StackTraceStack::pushCurrent() {
  checkGuard();
  auto node = Node::allocate();
  if (!node) {
    // cannot allocate memory
    return false;
  }

  ssize_t n = folly::symbolizer::getStackTrace(node->addresses, kMaxFrames);
  if (n == -1) {
    node->deallocate();
    return false;
  }
  node->frameCount = n;

  node->next = top_;
  top_ = node;
  return true;
}

bool StackTraceStack::pop() {
  checkGuard();
  if (!top_) {
    return false;
  }

  auto node = top_;
  top_ = node->next;
  node->deallocate();
  return true;
}

bool StackTraceStack::moveTopFrom(StackTraceStack& other) {
  checkGuard();
  if (!other.top_) {
    return false;
  }

  auto node = other.top_;
  other.top_ = node->next;
  node->next = top_;
  top_ = node;
  return true;
}

void StackTraceStack::clear() {
  checkGuard();
  while (top_) {
    pop();
  }
}

StackTrace* StackTraceStack::top() {
  checkGuard();
  return top_;
}

StackTrace* StackTraceStack::next(StackTrace* p) {
  checkGuard();
  assert(p);
  return static_cast<Node*>(p)->next;
}
} // namespace exception_tracer
} // namespace folly

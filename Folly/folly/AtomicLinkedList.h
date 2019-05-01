/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/AtomicIntrusiveLinkedList.h>
#include <folly/Memory.h>

namespace folly {

/**
 * A very simple atomic single-linked list primitive.
 *
 * Usage:
 *
 * AtomicLinkedList<MyClass> list;
 * list.insert(a);
 * list.sweep([] (MyClass& c) { doSomething(c); }
 */

template <class T>
class AtomicLinkedList {
 public:
  AtomicLinkedList() {}
  AtomicLinkedList(const AtomicLinkedList&) = delete;
  AtomicLinkedList& operator=(const AtomicLinkedList&) = delete;
  AtomicLinkedList(AtomicLinkedList&& other) noexcept = default;
  AtomicLinkedList& operator=(AtomicLinkedList&& other) = default;

  ~AtomicLinkedList() {
    sweep([](T&&) {});
  }

  bool empty() const {
    return list_.empty();
  }

  /**
   * Atomically insert t at the head of the list.
   * @return True if the inserted element is the only one in the list
   *         after the call.
   */
  bool insertHead(T t) {
    auto wrapper = std::make_unique<Wrapper>(std::move(t));

    return list_.insertHead(wrapper.release());
  }

  /**
   * Repeatedly pops element from head,
   * and calls func() on the removed elements in the order from tail to head.
   * Stops when the list is empty.
   */
  template <typename F>
  void sweep(F&& func) {
    list_.sweep([&](Wrapper* wrapperPtr) mutable {
      std::unique_ptr<Wrapper> wrapper(wrapperPtr);

      func(std::move(wrapper->data));
    });
  }

  /**
   * Similar to sweep() but calls func() on elements in LIFO order.
   *
   * func() is called for all elements in the list at the moment
   * reverseSweep() is called.  Unlike sweep() it does not loop to ensure the
   * list is empty at some point after the last invocation.  This way callers
   * can reason about the ordering: elements inserted since the last call to
   * reverseSweep() will be provided in LIFO order.
   *
   * Example: if elements are inserted in the order 1-2-3, the callback is
   * invoked 3-2-1.  If the callback moves elements onto a stack, popping off
   * the stack will produce the original insertion order 1-2-3.
   */
  template <typename F>
  void reverseSweep(F&& func) {
    list_.reverseSweep([&](Wrapper* wrapperPtr) mutable {
      std::unique_ptr<Wrapper> wrapper(wrapperPtr);

      func(std::move(wrapper->data));
    });
  }

 private:
  struct Wrapper {
    explicit Wrapper(T&& t) : data(std::move(t)) {}

    AtomicIntrusiveLinkedListHook<Wrapper> hook;
    T data;
  };
  AtomicIntrusiveLinkedList<Wrapper, &Wrapper::hook> list_;
};

} // namespace folly

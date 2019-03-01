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

#include <memory>

namespace folly {

/** C++11 closures don't support move-in capture. Nor does std::bind.
    facepalm.

    http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2013/n3610.html

    "[...] a work-around that should make people's stomach crawl:
    write a wrapper that performs move-on-copy, much like the deprecated
    auto_ptr"

    Unlike auto_ptr, this doesn't require a heap allocation.
    */
template <class T>
class MoveWrapper {
 public:
  /** If value can be default-constructed, why not?
      Then we don't have to move it in */
  MoveWrapper() = default;

  /// Move a value in.
  explicit
  MoveWrapper(T&& t) : value(std::move(t)) {}

  /// copy is move
  MoveWrapper(const MoveWrapper& other) : value(std::move(other.value)) {}

  /// move is also move
  MoveWrapper(MoveWrapper&& other) : value(std::move(other.value)) {}

  const T& operator*() const { return value; }
        T& operator*()       { return value; }

  const T* operator->() const { return &value; }
        T* operator->()       { return &value; }

  /// move the value out (sugar for std::move(*moveWrapper))
  T&& move() { return std::move(value); }

  // If you want these you're probably doing it wrong, though they'd be
  // easy enough to implement
  MoveWrapper& operator=(MoveWrapper const&) = delete;
  MoveWrapper& operator=(MoveWrapper&&) = delete;

 private:
  mutable T value;
};

/// Make a MoveWrapper from the argument. Because the name "makeMoveWrapper"
/// is already quite transparent in its intent, this will work for lvalues as
/// if you had wrapped them in std::move.
template <class T, class T0 = typename std::remove_reference<T>::type>
MoveWrapper<T0> makeMoveWrapper(T&& t) {
  return MoveWrapper<T0>(std::forward<T0>(t));
}

} // namespace

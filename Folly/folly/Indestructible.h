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

#include <cassert>
#include <type_traits>
#include <utility>

namespace folly {

/***
 *  Indestructible
 *
 *  When you need a Meyers singleton that will not get destructed, even at
 *  shutdown, and you also want the object stored inline.
 *
 *  Use like:
 *
 *      void doSomethingWithExpensiveData();
 *
 *      void doSomethingWithExpensiveData() {
 *        static const Indestructible<map<string, int>> data{
 *          map<string, int>{{"key1", 17}, {"key2", 19}, {"key3", 23}},
 *        };
 *        callSomethingTakingAMapByRef(*data);
 *      }
 *
 *  This should be used only for Meyers singletons, and, even then, only when
 *  the instance does not need to be destructed ever.
 *
 *  This should not be used more generally, e.g., as member fields, etc.
 *
 *  This is designed as an alternative, but with one fewer allocation at
 *  construction time and one fewer pointer dereference at access time, to the
 *  Meyers singleton pattern of:
 *
 *    void doSomethingWithExpensiveData() {
 *      static const auto data =  // never `delete`d
 *          new map<string, int>{{"key1", 17}, {"key2", 19}, {"key3", 23}};
 *      callSomethingTakingAMapByRef(*data);
 *    }
 */

template <typename T>
class Indestructible final {

 public:
  template <typename S = T, typename = decltype(S())>
  constexpr Indestructible() noexcept(noexcept(T())) {}

  template <typename... Args, typename = decltype(T(std::declval<Args&&>()...))>
  explicit constexpr Indestructible(Args&&... args) noexcept(
      std::is_nothrow_constructible<T, Args&&...>::value)
      : storage_(std::forward<Args>(args)...) {}

  ~Indestructible() = default;

  Indestructible(Indestructible const&) = delete;
  Indestructible& operator=(Indestructible const&) = delete;

  Indestructible(Indestructible&& other) noexcept(
      std::is_nothrow_move_constructible<T>::value)
      : storage_(std::move(other.storage_.value)) {
    other.erased_ = true;
  }
  Indestructible& operator=(Indestructible&& other) noexcept(
      std::is_nothrow_move_assignable<T>::value) {
    storage_.value = std::move(other.storage_.value);
    other.erased_ = true;
  }

  T* get() {
    check();
    return &storage_.value;
  }
  T const* get() const {
    check();
    return &storage_.value;
  }
  T& operator*() { return *get(); }
  T const& operator*() const { return *get(); }
  T* operator->() { return get(); }
  T const* operator->() const { return get(); }

 private:
  void check() const {
    assert(!erased_);
  }

  union Storage {
    T value;

    template <typename S = T, typename = decltype(S())>
    constexpr Storage() noexcept(noexcept(T())) : value() {}

    template <
        typename... Args,
        typename = decltype(T(std::declval<Args&&>()...))>
    explicit constexpr Storage(Args&&... args)
        : value(std::forward<Args>(args)...) {}

    ~Storage() {}
  };

  Storage storage_{};
  bool erased_{false};
};
}

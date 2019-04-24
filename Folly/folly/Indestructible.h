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

#include <cassert>
#include <type_traits>
#include <utility>

#include <folly/Traits.h>

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

  /**
   * Constructor accepting a single argument by forwarding reference, this
   * allows using list initialzation without the overhead of things like
   * in_place, etc and also works with std::initializer_list constructors
   * which can't be deduced, the default parameter helps there.
   *
   *    auto i = folly::Indestructible<std::map<int, int>>{{{1, 2}}};
   *
   * This provides convenience
   *
   * There are two versions of this constructor - one for when the element is
   * implicitly constructible from the given argument and one for when the
   * type is explicitly but not implicitly constructible from the given
   * argument.
   */
  template <
      typename U = T,
      _t<std::enable_if<std::is_constructible<T, U&&>::value>>* = nullptr,
      _t<std::enable_if<
          !std::is_same<Indestructible<T>, remove_cvref_t<U>>::value>>* =
          nullptr,
      _t<std::enable_if<!std::is_convertible<U&&, T>::value>>* = nullptr>
  explicit constexpr Indestructible(U&& u) noexcept(
      noexcept(T(std::declval<U>())))
      : storage_(std::forward<U>(u)) {}
  template <
      typename U = T,
      _t<std::enable_if<std::is_constructible<T, U&&>::value>>* = nullptr,
      _t<std::enable_if<
          !std::is_same<Indestructible<T>, remove_cvref_t<U>>::value>>* =
          nullptr,
      _t<std::enable_if<std::is_convertible<U&&, T>::value>>* = nullptr>
  /* implicit */ constexpr Indestructible(U&& u) noexcept(
      noexcept(T(std::declval<U>())))
      : storage_(std::forward<U>(u)) {}

  template <typename... Args, typename = decltype(T(std::declval<Args>()...))>
  explicit constexpr Indestructible(Args&&... args) noexcept(
      noexcept(T(std::declval<Args>()...)))
      : storage_(std::forward<Args>(args)...) {}
  template <
      typename U,
      typename... Args,
      typename = decltype(
          T(std::declval<std::initializer_list<U>&>(),
            std::declval<Args>()...))>
  explicit constexpr Indestructible(std::initializer_list<U> il, Args... args) noexcept(
      noexcept(
          T(std::declval<std::initializer_list<U>&>(),
            std::declval<Args>()...)))
      : storage_(il, std::forward<Args>(args)...) {}

  ~Indestructible() = default;

  Indestructible(Indestructible const&) = delete;
  Indestructible& operator=(Indestructible const&) = delete;

  Indestructible(Indestructible&& other) noexcept(
      noexcept(T(std::declval<T>())))
      : storage_(std::move(other.storage_.value)) {
    other.erased_ = true;
  }
  Indestructible& operator=(Indestructible&& other) noexcept(
      noexcept(T(std::declval<T>()))) {
    storage_.value = std::move(other.storage_.value);
    other.erased_ = true;
  }

  T* get() noexcept {
    check();
    return &storage_.value;
  }
  T const* get() const noexcept {
    check();
    return &storage_.value;
  }
  T& operator*() noexcept {
    return *get();
  }
  T const& operator*() const noexcept {
    return *get();
  }
  T* operator->() noexcept {
    return get();
  }
  T const* operator->() const noexcept {
    return get();
  }

 private:
  void check() const noexcept {
    assert(!erased_);
  }

  union Storage {
    T value;

    template <typename S = T, typename = decltype(S())>
    constexpr Storage() noexcept(noexcept(T())) : value() {}

    template <typename... Args, typename = decltype(T(std::declval<Args>()...))>
    explicit constexpr Storage(Args&&... args) noexcept(
        noexcept(T(std::declval<Args>()...)))
        : value(std::forward<Args>(args)...) {}

    ~Storage() {}
  };

  Storage storage_{};
  bool erased_{false};
};
} // namespace folly

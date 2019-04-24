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

#include <cassert>
#include <memory>
#include <utility>

namespace folly {

/**
 * Class template that wraps a reference to an rvalue. Similar to
 * std::reference_wrapper but with three important differences:
 *
 * 1) folly::rvalue_reference_wrappers can only be moved, not copied;
 * 2) the get() function and the conversion-to-T operator are destructive and
 *    not const, they invalidate the wrapper;
 * 3) the constructor-from-T is explicit.
 *
 * These restrictions are designed to make it harder to accidentally create a
 * a dangling rvalue reference, or to use an rvalue reference multiple times.
 * (Using an rvalue reference typically implies invalidation of the target
 * object, such as move-assignment to another object.)
 *
 * @seealso folly::rref
 */
template <class T>
class rvalue_reference_wrapper {
 public:
  using type = T;

  /**
   * Default constructor. Creates an invalid reference. Must be move-assigned
   * to in order to be come valid.
   */
  rvalue_reference_wrapper() noexcept : ptr_(nullptr) {}

  /**
   * Explicit constructor to make it harder to accidentally create a dangling
   * reference to a temporary.
   */
  explicit rvalue_reference_wrapper(T&& ref) noexcept
      : ptr_(std::addressof(ref)) {}

  /**
   * No construction from lvalue reference. Use std::move.
   */
  explicit rvalue_reference_wrapper(T&) noexcept = delete;

  /**
   * Destructive move construction.
   */
  rvalue_reference_wrapper(rvalue_reference_wrapper<T>&& other) noexcept
      : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }

  /**
   * Destructive move assignment.
   */
  rvalue_reference_wrapper& operator=(
      rvalue_reference_wrapper&& other) noexcept {
    ptr_ = other.ptr_;
    other.ptr_ = nullptr;
    return *this;
  }

  /**
   * Implicit conversion to raw reference. Destructive.
   */
  /* implicit */ operator T &&() && noexcept {
    return static_cast<rvalue_reference_wrapper&&>(*this).get();
  }

  /**
   * Explicit unwrap. Destructive.
   */
  T&& get() && noexcept {
    assert(valid());
    T& ref = *ptr_;
    ptr_ = nullptr;
    return static_cast<T&&>(ref);
  }

  /**
   * Calls the callable object to whom reference is stored. Only available if
   * the wrapped reference points to a callable object. Destructive.
   */
  template <class... Args>
      decltype(auto) operator()(Args&&... args) &&
      noexcept(noexcept(std::declval<T>()(std::forward<Args>(args)...))) {
    return static_cast<rvalue_reference_wrapper&&>(*this).get()(
        std::forward<Args>(args)...);
  }

  /**
   * Check whether wrapped reference is valid.
   */
  bool valid() const noexcept {
    return ptr_ != nullptr;
  }

 private:
  // Disallow copy construction and copy assignment, to make it harder to
  // accidentally use an rvalue reference multiple times.
  rvalue_reference_wrapper(const rvalue_reference_wrapper&) = delete;
  rvalue_reference_wrapper& operator=(const rvalue_reference_wrapper&) = delete;

  T* ptr_;
};

/**
 * Create a folly::rvalue_reference_wrapper. Analogous to std::ref().
 *
 * Warning: folly::rvalue_reference_wrappers are potentially dangerous, because
 * they can easily be used to capture references to temporary values. Users must
 * ensure that the target object outlives the reference wrapper.
 *
 * @example
 *   class Object {};
 *   void f(Object&&);
 *   // BAD
 *   void g() {
 *     auto ref = folly::rref(Object{});  // create reference to temporary
 *     f(std::move(ref));                 // pass dangling reference
 *   }
 *   // GOOD
 *   void h() {
 *     Object o;
 *     auto ref = folly::rref(std::move(o));
 *     f(std::move(ref));
 *   }
 */
template <typename T>
rvalue_reference_wrapper<T> rref(T&& value) noexcept {
  return rvalue_reference_wrapper<T>(std::move(value));
}
template <typename T>
rvalue_reference_wrapper<T> rref(T&) noexcept = delete;
} // namespace folly

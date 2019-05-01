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

#pragma once

#include <memory>

namespace folly {

/*
 * folly::enable_shared_from_this
 *
 * To be removed once C++17 becomes a minimum requirement for folly.
 */
#if __cplusplus >= 201700L || __cpp_lib_enable_shared_from_this >= 201603L

// Guaranteed to have std::enable_shared_from_this::weak_from_this(). Prefer
// type alias over our own class.
/* using override */ using std::enable_shared_from_this;

#else

/**
 * Extends std::enabled_shared_from_this. Offers weak_from_this() to pre-C++17
 * code. Use as drop-in replacement for std::enable_shared_from_this.
 *
 * C++14 has no direct means of creating a std::weak_ptr, one must always
 * create a (temporary) std::shared_ptr first. C++17 adds weak_from_this() to
 * std::enable_shared_from_this to avoid that overhead. Alas code that must
 * compile under different language versions cannot call
 * std::enable_shared_from_this::weak_from_this() directly. Hence this class.
 *
 * @example
 *   class MyClass : public folly::enable_shared_from_this<MyClass> {};
 *
 *   int main() {
 *     std::shared_ptr<MyClass> sp = std::make_shared<MyClass>();
 *     std::weak_ptr<MyClass> wp = sp->weak_from_this();
 *   }
 */
template <typename T>
class enable_shared_from_this : public std::enable_shared_from_this<T> {
 public:
  constexpr enable_shared_from_this() noexcept = default;

  std::weak_ptr<T> weak_from_this() noexcept {
    return weak_from_this_<T>(this);
  }

  std::weak_ptr<T const> weak_from_this() const noexcept {
    return weak_from_this_<T>(this);
  }

 private:
  // Uses SFINAE to detect and call
  // std::enable_shared_from_this<T>::weak_from_this() if available. Falls
  // back to std::enable_shared_from_this<T>::shared_from_this() otherwise.
  template <typename U>
  auto weak_from_this_(std::enable_shared_from_this<U>* base_ptr) noexcept
      -> decltype(base_ptr->weak_from_this()) {
    return base_ptr->weak_from_this();
  }

  template <typename U>
  auto weak_from_this_(std::enable_shared_from_this<U> const* base_ptr) const
      noexcept -> decltype(base_ptr->weak_from_this()) {
    return base_ptr->weak_from_this();
  }

  template <typename U>
  std::weak_ptr<U> weak_from_this_(...) noexcept {
    try {
      return this->shared_from_this();
    } catch (std::bad_weak_ptr const&) {
      // C++17 requires that weak_from_this() on an object not owned by a
      // shared_ptr returns an empty weak_ptr. Sadly, in C++14,
      // shared_from_this() on such an object is undefined behavior, and there
      // is nothing we can do to detect and handle the situation in a portable
      // manner. But in case a compiler is nice enough to implement C++17
      // semantics of shared_from_this() and throws a bad_weak_ptr, we catch it
      // and return an empty weak_ptr.
      return std::weak_ptr<U>{};
    }
  }

  template <typename U>
  std::weak_ptr<U const> weak_from_this_(...) const noexcept {
    try {
      return this->shared_from_this();
    } catch (std::bad_weak_ptr const&) {
      return std::weak_ptr<U const>{};
    }
  }
};

#endif

} // namespace folly

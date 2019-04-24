/*
 * Copyright 2011-present Facebook, Inc.
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

/**
 * Discriminated pointer: Type-safe pointer to one of several types.
 *
 * Similar to boost::variant, but has no space overhead over a raw pointer, as
 * it relies on the fact that (on x86_64) there are 16 unused bits in a
 * pointer.
 *
 * @author Tudor Bosman (tudorb@fb.com)
 */

#pragma once

#include <limits>
#include <stdexcept>

#include <glog/logging.h>

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/detail/DiscriminatedPtrDetail.h>

#if !FOLLY_X64 && !FOLLY_AARCH64 && !FOLLY_PPC64
#error "DiscriminatedPtr is x64, arm64 and ppc64 specific code."
#endif

namespace folly {

/**
 * Discriminated pointer.
 *
 * Given a list of types, a DiscriminatedPtr<Types...> may point to an object
 * of one of the given types, or may be empty.  DiscriminatedPtr is type-safe:
 * you may only get a pointer to the type that you put in, otherwise get
 * throws an exception (and get_nothrow returns nullptr)
 *
 * This pointer does not do any kind of lifetime management -- it's not a
 * "smart" pointer.  You are responsible for deallocating any memory used
 * to hold pointees, if necessary.
 */
template <typename... Types>
class DiscriminatedPtr {
  // <, not <=, as our indexes are 1-based (0 means "empty")
  static_assert(
      sizeof...(Types) < std::numeric_limits<uint16_t>::max(),
      "too many types");

 public:
  /**
   * Create an empty DiscriminatedPtr.
   */
  DiscriminatedPtr() : data_(0) {}

  /**
   * Create a DiscriminatedPtr that points to an object of type T.
   * Fails at compile time if T is not a valid type (listed in Types)
   */
  template <typename T>
  explicit DiscriminatedPtr(T* ptr) {
    set(ptr, typeIndex<T>());
  }

  /**
   * Set this DiscriminatedPtr to point to an object of type T.
   * Fails at compile time if T is not a valid type (listed in Types)
   */
  template <typename T>
  void set(T* ptr) {
    set(ptr, typeIndex<T>());
  }

  /**
   * Get a pointer to the object that this DiscriminatedPtr points to, if it is
   * of type T.  Fails at compile time if T is not a valid type (listed in
   * Types), and returns nullptr if this DiscriminatedPtr is empty or points to
   * an object of a different type.
   */
  template <typename T>
  T* get_nothrow() noexcept {
    void* p = LIKELY(hasType<T>()) ? ptr() : nullptr;
    return static_cast<T*>(p);
  }

  template <typename T>
  const T* get_nothrow() const noexcept {
    const void* p = LIKELY(hasType<T>()) ? ptr() : nullptr;
    return static_cast<const T*>(p);
  }

  /**
   * Get a pointer to the object that this DiscriminatedPtr points to, if it is
   * of type T.  Fails at compile time if T is not a valid type (listed in
   * Types), and throws std::invalid_argument if this DiscriminatedPtr is empty
   * or points to an object of a different type.
   */
  template <typename T>
  T* get() {
    if (UNLIKELY(!hasType<T>())) {
      throw std::invalid_argument("Invalid type");
    }
    return static_cast<T*>(ptr());
  }

  template <typename T>
  const T* get() const {
    if (UNLIKELY(!hasType<T>())) {
      throw std::invalid_argument("Invalid type");
    }
    return static_cast<const T*>(ptr());
  }

  /**
   * Return true iff this DiscriminatedPtr is empty.
   */
  bool empty() const {
    return index() == 0;
  }

  /**
   * Return true iff the object pointed by this DiscriminatedPtr has type T,
   * false otherwise.  Fails at compile time if T is not a valid type (listed
   * in Types...)
   */
  template <typename T>
  bool hasType() const {
    return index() == typeIndex<T>();
  }

  /**
   * Clear this DiscriminatedPtr, making it empty.
   */
  void clear() {
    data_ = 0;
  }

  /**
   * Assignment operator from a pointer of type T.
   */
  template <typename T>
  DiscriminatedPtr& operator=(T* ptr) {
    set(ptr);
    return *this;
  }

  /**
   * Apply a visitor to this object, calling the appropriate overload for
   * the type currently stored in DiscriminatedPtr.  Throws invalid_argument
   * if the DiscriminatedPtr is empty.
   *
   * The visitor must meet the following requirements:
   *
   * - The visitor must allow invocation as a function by overloading
   *   operator(), unambiguously accepting all values of type T* (or const T*)
   *   for all T in Types...
   * - All operations of the function object on T* (or const T*) must
   *   return the same type (or a static_assert will fire).
   */
  template <typename V>
  typename dptr_detail::VisitorResult<V, Types...>::type apply(V&& visitor) {
    size_t n = index();
    if (n == 0) {
      throw std::invalid_argument("Empty DiscriminatedPtr");
    }
    return dptr_detail::ApplyVisitor<V, Types...>()(
        n, std::forward<V>(visitor), ptr());
  }

  template <typename V>
  typename dptr_detail::ConstVisitorResult<V, Types...>::type apply(
      V&& visitor) const {
    size_t n = index();
    if (n == 0) {
      throw std::invalid_argument("Empty DiscriminatedPtr");
    }
    return dptr_detail::ApplyConstVisitor<V, Types...>()(
        n, std::forward<V>(visitor), ptr());
  }

 private:
  /**
   * Get the 1-based type index of T in Types.
   */
  template <typename T>
  uint16_t typeIndex() const {
    return uint16_t(dptr_detail::GetTypeIndex<T, Types...>::value);
  }

  uint16_t index() const {
    return data_ >> 48;
  }
  void* ptr() const {
    return reinterpret_cast<void*>(data_ & ((1ULL << 48) - 1));
  }

  void set(void* p, uint16_t v) {
    uintptr_t ip = reinterpret_cast<uintptr_t>(p);
    CHECK(!(ip >> 48));
    ip |= static_cast<uintptr_t>(v) << 48;
    data_ = ip;
  }

  /**
   * We store a pointer in the least significant 48 bits of data_, and a type
   * index (0 = empty, or 1-based index in Types) in the most significant 16
   * bits.  We rely on the fact that pointers have their most significant 16
   * bits clear on x86_64.
   */
  uintptr_t data_;
};

template <typename Visitor, typename... Args>
decltype(auto) apply_visitor(
    Visitor&& visitor,
    const DiscriminatedPtr<Args...>& variant) {
  return variant.apply(std::forward<Visitor>(visitor));
}

template <typename Visitor, typename... Args>
decltype(auto) apply_visitor(
    Visitor&& visitor,
    DiscriminatedPtr<Args...>& variant) {
  return variant.apply(std::forward<Visitor>(visitor));
}

template <typename Visitor, typename... Args>
decltype(auto) apply_visitor(
    Visitor&& visitor,
    DiscriminatedPtr<Args...>&& variant) {
  return variant.apply(std::forward<Visitor>(visitor));
}

} // namespace folly

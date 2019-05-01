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

#include <functional>
#include <type_traits>
#include <utility>

#include <folly/Traits.h>
#include <folly/Utility.h>

namespace folly {

template <typename Pointer>
class propagate_const;

template <typename Pointer>
constexpr Pointer& get_underlying(propagate_const<Pointer>& obj) {
  return obj.pointer_;
}

template <typename Pointer>
constexpr Pointer const& get_underlying(propagate_const<Pointer> const& obj) {
  return obj.pointer_;
}

namespace detail {
template <typename>
struct is_propagate_const : std::false_type {};
template <typename Pointer>
struct is_propagate_const<propagate_const<Pointer>> : std::true_type {};
template <typename T>
using is_decay_propagate_const = is_propagate_const<_t<std::decay<T>>>;

namespace propagate_const_adl {
using std::swap;
template <typename T>
auto adl_swap(T& a, T& b) noexcept(noexcept(swap(a, b)))
    -> decltype(swap(a, b)) {
  swap(a, b);
}
} // namespace propagate_const_adl
} // namespace detail

//  mimic: std::experimental::propagate_const, C++ Library Fundamentals TS v2
template <typename Pointer>
class propagate_const {
 public:
  using element_type =
      _t<std::remove_reference<decltype(*std::declval<Pointer&>())>>;

  constexpr propagate_const() = default;
  FOLLY_CPP14_CONSTEXPR propagate_const(propagate_const&&) = default;
  propagate_const(propagate_const const&) = delete;

  template <
      typename OtherPointer,
      _t<std::enable_if<
          std::is_constructible<Pointer, OtherPointer&&>::value &&
              !std::is_convertible<OtherPointer&&, Pointer>::value,
          int>> = 0>
  constexpr explicit propagate_const(propagate_const<OtherPointer>&& other)
      : pointer_(static_cast<OtherPointer&&>(other.pointer_)) {}

  template <
      typename OtherPointer,
      _t<std::enable_if<
          std::is_constructible<Pointer, OtherPointer&&>::value &&
              std::is_convertible<OtherPointer&&, Pointer>::value,
          int>> = 0>
  constexpr propagate_const(propagate_const<OtherPointer>&& other)
      : pointer_(static_cast<OtherPointer&&>(other.pointer_)) {}

  template <
      typename OtherPointer,
      _t<std::enable_if<
          !detail::is_decay_propagate_const<OtherPointer>::value &&
              std::is_constructible<Pointer, OtherPointer&&>::value &&
              !std::is_convertible<OtherPointer&&, Pointer>::value,
          int>> = 0>
  constexpr explicit propagate_const(OtherPointer&& other)
      : pointer_(static_cast<OtherPointer&&>(other)) {}

  template <
      typename OtherPointer,
      _t<std::enable_if<
          !detail::is_decay_propagate_const<OtherPointer>::value &&
              std::is_constructible<Pointer, OtherPointer&&>::value &&
              std::is_convertible<OtherPointer&&, Pointer>::value,
          int>> = 0>
  constexpr propagate_const(OtherPointer&& other)
      : pointer_(static_cast<OtherPointer&&>(other)) {}

  FOLLY_CPP14_CONSTEXPR propagate_const& operator=(propagate_const&&) = default;
  propagate_const& operator=(propagate_const const&) = delete;

  template <
      typename OtherPointer,
      typename = _t<
          std::enable_if<std::is_convertible<OtherPointer&&, Pointer>::value>>>
  FOLLY_CPP14_CONSTEXPR propagate_const& operator=(
      propagate_const<OtherPointer>&& other) {
    pointer_ = static_cast<OtherPointer&&>(other.pointer_);
  }

  template <
      typename OtherPointer,
      typename = _t<std::enable_if<
          !detail::is_decay_propagate_const<OtherPointer>::value &&
          std::is_convertible<OtherPointer&&, Pointer>::value>>>
  FOLLY_CPP14_CONSTEXPR propagate_const& operator=(OtherPointer&& other) {
    pointer_ = static_cast<OtherPointer&&>(other);
    return *this;
  }

  FOLLY_CPP14_CONSTEXPR void swap(propagate_const& other) noexcept(
      noexcept(detail::propagate_const_adl::adl_swap(
          std::declval<Pointer&>(),
          other.pointer_))) {
    detail::propagate_const_adl::adl_swap(pointer_, other.pointer_);
  }

  FOLLY_CPP14_CONSTEXPR element_type* get() {
    return get_(pointer_);
  }

  constexpr element_type const* get() const {
    return get_(pointer_);
  }

  constexpr explicit operator bool() const {
    return static_cast<bool>(pointer_);
  }

  FOLLY_CPP14_CONSTEXPR element_type& operator*() {
    return *get();
  }

  constexpr element_type const& operator*() const {
    return *get();
  }

  FOLLY_CPP14_CONSTEXPR element_type* operator->() {
    return get();
  }

  constexpr element_type const* operator->() const {
    return get();
  }

  template <
      typename OtherPointer = Pointer,
      typename = _t<std::enable_if<
          std::is_pointer<OtherPointer>::value ||
          std::is_convertible<OtherPointer, element_type*>::value>>>
  FOLLY_CPP14_CONSTEXPR operator element_type*() {
    return get();
  }

  template <
      typename OtherPointer = Pointer,
      typename = _t<std::enable_if<
          std::is_pointer<OtherPointer>::value ||
          std::is_convertible<OtherPointer, element_type const*>::value>>>
  constexpr operator element_type const*() const {
    return get();
  }

 private:
  friend Pointer& get_underlying<>(propagate_const&);
  friend Pointer const& get_underlying<>(propagate_const const&);
  template <typename OtherPointer>
  friend class propagate_const;

  template <typename T>
  constexpr static T* get_(T* t) {
    return t;
  }
  template <typename T>
  constexpr static auto get_(T& t) -> decltype(t.get()) {
    return t.get();
  }

  Pointer pointer_;
};

template <typename Pointer>
FOLLY_CPP14_CONSTEXPR void swap(
    propagate_const<Pointer>& a,
    propagate_const<Pointer>& b) noexcept(noexcept(a.swap(b))) {
  a.swap(b);
}

template <typename Pointer>
constexpr bool operator==(propagate_const<Pointer> const& a, std::nullptr_t) {
  return get_underlying(a) == nullptr;
}

template <typename Pointer>
constexpr bool operator==(std::nullptr_t, propagate_const<Pointer> const& a) {
  return nullptr == get_underlying(a);
}

template <typename Pointer>
constexpr bool operator!=(propagate_const<Pointer> const& a, std::nullptr_t) {
  return get_underlying(a) != nullptr;
}

template <typename Pointer>
constexpr bool operator!=(std::nullptr_t, propagate_const<Pointer> const& a) {
  return nullptr != get_underlying(a);
}

template <typename Pointer>
constexpr bool operator==(
    propagate_const<Pointer> const& a,
    propagate_const<Pointer> const& b) {
  return get_underlying(a) == get_underlying(b);
}

template <typename Pointer>
constexpr bool operator!=(
    propagate_const<Pointer> const& a,
    propagate_const<Pointer> const& b) {
  return get_underlying(a) != get_underlying(b);
}

template <typename Pointer>
constexpr bool operator<(
    propagate_const<Pointer> const& a,
    propagate_const<Pointer> const& b) {
  return get_underlying(a) < get_underlying(b);
}

template <typename Pointer>
constexpr bool operator<=(
    propagate_const<Pointer> const& a,
    propagate_const<Pointer> const& b) {
  return get_underlying(a) <= get_underlying(b);
}

template <typename Pointer>
constexpr bool operator>(
    propagate_const<Pointer> const& a,
    propagate_const<Pointer> const& b) {
  return get_underlying(a) > get_underlying(b);
}

template <typename Pointer>
constexpr bool operator>=(
    propagate_const<Pointer> const& a,
    propagate_const<Pointer> const& b) {
  return get_underlying(a) >= get_underlying(b);
}

//  Note: contrary to the specification, the heterogeneous comparison operators
//  only participate in overload resolution when the equivalent heterogeneous
//  comparison operators on the underlying pointers, as returned by invocation
//  of get_underlying, would also participate in overload resolution.

template <typename Pointer, typename Other>
constexpr auto operator==(propagate_const<Pointer> const& a, Other const& b)
    -> decltype(get_underlying(a) == b, false) {
  return get_underlying(a) == b;
}

template <typename Pointer, typename Other>
constexpr auto operator!=(propagate_const<Pointer> const& a, Other const& b)
    -> decltype(get_underlying(a) != b, false) {
  return get_underlying(a) != b;
}

template <typename Pointer, typename Other>
constexpr auto operator<(propagate_const<Pointer> const& a, Other const& b)
    -> decltype(get_underlying(a) < b, false) {
  return get_underlying(a) < b;
}

template <typename Pointer, typename Other>
constexpr auto operator<=(propagate_const<Pointer> const& a, Other const& b)
    -> decltype(get_underlying(a) <= b, false) {
  return get_underlying(a) <= b;
}

template <typename Pointer, typename Other>
constexpr auto operator>(propagate_const<Pointer> const& a, Other const& b)
    -> decltype(get_underlying(a) > b, false) {
  return get_underlying(a) > b;
}

template <typename Pointer, typename Other>
constexpr auto operator>=(propagate_const<Pointer> const& a, Other const& b)
    -> decltype(get_underlying(a) >= b, false) {
  return get_underlying(a) >= b;
}

template <typename Other, typename Pointer>
constexpr auto operator==(Other const& a, propagate_const<Pointer> const& b)
    -> decltype(a == get_underlying(b), false) {
  return a == get_underlying(b);
}

template <typename Other, typename Pointer>
constexpr auto operator!=(Other const& a, propagate_const<Pointer> const& b)
    -> decltype(a != get_underlying(b), false) {
  return a != get_underlying(b);
}

template <typename Other, typename Pointer>
constexpr auto operator<(Other const& a, propagate_const<Pointer> const& b)
    -> decltype(a < get_underlying(b), false) {
  return a < get_underlying(b);
}

template <typename Other, typename Pointer>
constexpr auto operator<=(Other const& a, propagate_const<Pointer> const& b)
    -> decltype(a <= get_underlying(b), false) {
  return a <= get_underlying(b);
}

template <typename Other, typename Pointer>
constexpr auto operator>(Other const& a, propagate_const<Pointer> const& b)
    -> decltype(a > get_underlying(b), false) {
  return a > get_underlying(b);
}

template <typename Other, typename Pointer>
constexpr auto operator>=(Other const& a, propagate_const<Pointer> const& b)
    -> decltype(a >= get_underlying(b), false) {
  return a >= get_underlying(b);
}

} // namespace folly

namespace std {

template <typename Pointer>
struct hash<folly::propagate_const<Pointer>> : private hash<Pointer> {
  using hash<Pointer>::hash;

  size_t operator()(folly::propagate_const<Pointer> const& obj) const {
    return hash<Pointer>::operator()(folly::get_underlying(obj));
  }
};

template <typename Pointer>
struct equal_to<folly::propagate_const<Pointer>> : private equal_to<Pointer> {
  using equal_to<Pointer>::equal_to;

  constexpr bool operator()(
      folly::propagate_const<Pointer> const& a,
      folly::propagate_const<Pointer> const& b) {
    return equal_to<Pointer>::operator()(
        folly::get_underlying(a), folly::get_underlying(b));
  }
};

template <typename Pointer>
struct not_equal_to<folly::propagate_const<Pointer>>
    : private not_equal_to<Pointer> {
  using not_equal_to<Pointer>::not_equal_to;

  constexpr bool operator()(
      folly::propagate_const<Pointer> const& a,
      folly::propagate_const<Pointer> const& b) {
    return not_equal_to<Pointer>::operator()(
        folly::get_underlying(a), folly::get_underlying(b));
  }
};

template <typename Pointer>
struct less<folly::propagate_const<Pointer>> : private less<Pointer> {
  using less<Pointer>::less;

  constexpr bool operator()(
      folly::propagate_const<Pointer> const& a,
      folly::propagate_const<Pointer> const& b) {
    return less<Pointer>::operator()(
        folly::get_underlying(a), folly::get_underlying(b));
  }
};

template <typename Pointer>
struct greater<folly::propagate_const<Pointer>> : private greater<Pointer> {
  using greater<Pointer>::greater;

  constexpr bool operator()(
      folly::propagate_const<Pointer> const& a,
      folly::propagate_const<Pointer> const& b) {
    return greater<Pointer>::operator()(
        folly::get_underlying(a), folly::get_underlying(b));
  }
};

template <typename Pointer>
struct less_equal<folly::propagate_const<Pointer>>
    : private less_equal<Pointer> {
  using less_equal<Pointer>::less_equal;

  constexpr bool operator()(
      folly::propagate_const<Pointer> const& a,
      folly::propagate_const<Pointer> const& b) {
    return less_equal<Pointer>::operator()(
        folly::get_underlying(a), folly::get_underlying(b));
  }
};

template <typename Pointer>
struct greater_equal<folly::propagate_const<Pointer>>
    : private greater_equal<Pointer> {
  using greater_equal<Pointer>::greater_equal;

  constexpr bool operator()(
      folly::propagate_const<Pointer> const& a,
      folly::propagate_const<Pointer> const& b) {
    return greater_equal<Pointer>::operator()(
        folly::get_underlying(a), folly::get_underlying(b));
  }
};

} // namespace std

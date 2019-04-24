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

#include <folly/Poly.h>

namespace folly {
namespace poly {
/**
 * A `Poly` interface for types that are equality comparable.
 */
struct IEqualityComparable : PolyExtends<> {
  template <class T>
  static auto isEqual_(T const& _this, T const& that)
      -> decltype(std::declval<bool (&)(bool)>()(_this == that)) {
    return _this == that;
  }

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&isEqual_<T>);
};

/**
 * A `Poly` interface for types that are strictly orderable.
 */
struct IStrictlyOrderable : PolyExtends<> {
  template <class T>
  static auto isLess_(T const& _this, T const& that)
      -> decltype(std::declval<bool (&)(bool)>()(_this < that)) {
    return _this < that;
  }

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&isLess_<T>);
};

} // namespace poly

/// \cond
namespace detail {
template <class I1, class I2>
using Comparable = Conjunction<
    std::is_same<std::decay_t<I1>, std::decay_t<I2>>,
    std::is_base_of<poly::IEqualityComparable, std::decay_t<I1>>>;

template <class I1, class I2>
using Orderable = Conjunction<
    std::is_same<std::decay_t<I1>, std::decay_t<I2>>,
    std::is_base_of<poly::IStrictlyOrderable, std::decay_t<I1>>>;
} // namespace detail
/// \endcond

template <
    class I1,
    class I2,
    std::enable_if_t<detail::Comparable<I1, I2>::value, int> = 0>
bool operator==(Poly<I1> const& _this, Poly<I2> const& that) {
  if (poly_empty(_this) != poly_empty(that)) {
    return false;
  } else if (poly_empty(_this)) {
    return true;
  } else if (poly_type(_this) != poly_type(that)) {
    throw BadPolyCast();
  }
  return ::folly::poly_call<0, poly::IEqualityComparable>(_this, that);
}

template <
    class I1,
    class I2,
    std::enable_if_t<detail::Comparable<I1, I2>::value, int> = 0>
bool operator!=(Poly<I1> const& _this, Poly<I2> const& that) {
  return !(_this == that);
}

template <
    class I1,
    class I2,
    std::enable_if_t<detail::Orderable<I1, I2>::value, int> = 0>
bool operator<(Poly<I1> const& _this, Poly<I2> const& that) {
  if (poly_empty(that)) {
    return false;
  } else if (poly_empty(_this)) {
    return true;
  } else if (poly_type(_this) != poly_type(that)) {
    throw BadPolyCast{};
  }
  return ::folly::poly_call<0, poly::IStrictlyOrderable>(_this, that);
}

template <
    class I1,
    class I2,
    std::enable_if_t<detail::Orderable<I1, I2>::value, int> = 0>
bool operator>(Poly<I1> const& _this, Poly<I2> const& that) {
  return that < _this;
}

template <
    class I1,
    class I2,
    std::enable_if_t<detail::Orderable<I1, I2>::value, int> = 0>
bool operator<=(Poly<I1> const& _this, Poly<I2> const& that) {
  return !(that < _this);
}

template <
    class I1,
    class I2,
    std::enable_if_t<detail::Orderable<I1, I2>::value, int> = 0>
bool operator>=(Poly<I1> const& _this, Poly<I2> const& that) {
  return !(_this < that);
}

namespace poly {
/**
 * A `Poly` interface for types that are move-only.
 */
struct IMoveOnly : PolyExtends<> {
  template <class Base>
  struct Interface : Base {
    Interface() = default;
    Interface(Interface const&) = delete;
    Interface(Interface&&) = default;
    Interface& operator=(Interface const&) = delete;
    Interface& operator=(Interface&&) = default;
    using Base::Base;
  };
};

/**
 * A `Poly` interface for types that are copyable and movable.
 */
struct ISemiRegular : PolyExtends<> {};

/**
 * A `Poly` interface for types that are copyable, movable, and equality
 * comparable.
 */
struct IRegular : PolyExtends<ISemiRegular, IEqualityComparable> {};
} // namespace poly
} // namespace folly

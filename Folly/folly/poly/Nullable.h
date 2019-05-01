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
#include <folly/poly/Regular.h>

namespace folly {
namespace poly {
/**
 * A `Poly` interface that can be used to make Poly objects initializable from
 * `nullptr` (to create an empty `Poly`) and equality comparable to `nullptr`
 * (to test for emptiness).
 */
struct INullablePointer : PolyExtends<IEqualityComparable> {
  template <class Base>
  struct Interface : Base {
    Interface() = default;
    using Base::Base;

    /* implicit */ Interface(std::nullptr_t) : Base{} {
      static_assert(
          std::is_default_constructible<PolySelf<Base>>::value,
          "Cannot initialize a non-default constructible Poly with nullptr");
    }

    PolySelf<Base>& operator=(std::nullptr_t) {
      static_assert(
          std::is_default_constructible<PolySelf<Base>>::value,
          "Cannot initialize a non-default constructible Poly with nullptr");
      auto& self = static_cast<PolySelf<Base>&>(*this);
      self = PolySelf<Base>();
      return self;
    }

    friend bool operator==(
        std::nullptr_t,
        PolySelf<Base> const& self) noexcept {
      return poly_empty(self);
    }
    friend bool operator==(
        PolySelf<Base> const& self,
        std::nullptr_t) noexcept {
      return poly_empty(self);
    }
    friend bool operator!=(
        std::nullptr_t,
        PolySelf<Base> const& self) noexcept {
      return !poly_empty(self);
    }
    friend bool operator!=(
        PolySelf<Base> const& self,
        std::nullptr_t) noexcept {
      return !poly_empty(self);
    }
  };
};

/**
 * A `Poly` interface that can be used to make `Poly` objects contextually
 * convertible to `bool` (`true` if and only if non-empty). It also gives
 * `Poly` objects a unary logical negation operator.
 */
struct IBooleanTestable : PolyExtends<> {
  template <class Base>
  struct Interface : Base {
    constexpr bool operator!() const noexcept {
      return poly_empty(*this);
    }
    constexpr explicit operator bool() const noexcept {
      return !!*this;
    }
  };
};
} // namespace poly
} // namespace folly

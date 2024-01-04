/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <iterator>
#include <type_traits>

namespace facebook::yoga {

template <typename EnumT>
constexpr inline int32_t ordinalCount();

/**
 * Count of bits needed to represent every ordinal
 */
template <typename EnumT>
constexpr inline int32_t bitCount();

/**
 * Polyfill of C++ 23 to_underlying()
 * https://en.cppreference.com/w/cpp/utility/to_underlying
 */
constexpr auto to_underlying(auto e) noexcept {
  return static_cast<std::underlying_type_t<decltype(e)>>(e);
}

/**
 * Convenience function to iterate through every value in a Yoga enum as part of
 * a range-based for loop.
 */
template <typename EnumT>
auto ordinals() {
  struct Iterator {
    EnumT e{};

    EnumT operator*() const {
      return e;
    }

    Iterator& operator++() {
      e = static_cast<EnumT>(to_underlying(e) + 1);
      return *this;
    }

    bool operator==(const Iterator& other) const = default;
    bool operator!=(const Iterator& other) const = default;
  };

  struct Range {
    Iterator begin() const {
      return Iterator{};
    }
    Iterator end() const {
      return Iterator{static_cast<EnumT>(ordinalCount<EnumT>())};
    }
  };

  return Range{};
}

} // namespace facebook::yoga

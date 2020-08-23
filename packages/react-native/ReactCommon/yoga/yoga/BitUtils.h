/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdio>
#include <cstdint>
#include "YGEnums.h"

namespace facebook {
namespace yoga {

namespace detail {

constexpr size_t log2ceilFn(size_t n) {
  return n < 1 ? 0 : (1 + log2ceilFn(n / 2));
}

constexpr int mask(size_t bitWidth, size_t index) {
  return ((1 << bitWidth) - 1) << index;
}

// The number of bits necessary to represent enums defined with YG_ENUM_SEQ_DECL
template <typename Enum>
constexpr size_t bitWidthFn() {
  static_assert(
      enums::count<Enum>() > 0, "Enums must have at least one entries");
  return log2ceilFn(enums::count<Enum>() - 1);
}

template <typename Enum>
constexpr Enum getEnumData(int flags, size_t index) {
  return static_cast<Enum>((flags & mask(bitWidthFn<Enum>(), index)) >> index);
}

template <typename Enum>
void setEnumData(uint32_t& flags, size_t index, int newValue) {
  flags = (flags & ~mask(bitWidthFn<Enum>(), index)) |
      ((newValue << index) & (mask(bitWidthFn<Enum>(), index)));
}

template <typename Enum>
void setEnumData(uint8_t& flags, size_t index, int newValue) {
  flags = (flags & ~mask(bitWidthFn<Enum>(), index)) |
      ((newValue << index) & (mask(bitWidthFn<Enum>(), index)));
}

constexpr bool getBooleanData(int flags, size_t index) {
  return (flags >> index) & 1;
}

inline void setBooleanData(uint8_t& flags, size_t index, bool value) {
  if (value) {
    flags |= 1 << index;
  } else {
    flags &= ~(1 << index);
  }
}

} // namespace detail
} // namespace yoga
} // namespace facebook

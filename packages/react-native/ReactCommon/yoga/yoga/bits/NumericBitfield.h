/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <bitset>
#include <cstdio>
#include <cstdint>

#include <yoga/YGEnums.h>

namespace facebook::yoga::details {

constexpr uint8_t log2ceilFn(uint8_t n) {
  return n < 1 ? 0 : (1 + log2ceilFn(n / 2));
}

constexpr uint32_t mask(uint8_t bitWidth, uint8_t index) {
  return ((1u << bitWidth) - 1u) << index;
}

} // namespace facebook::yoga::details

namespace facebook::yoga {

// The number of bits necessary to represent enums defined with YG_ENUM_SEQ_DECL
template <typename Enum>
constexpr uint8_t minimumBitCount() {
  static_assert(
      enums::count<Enum>() > 0, "Enums must have at least one entries");
  return details::log2ceilFn(enums::count<Enum>() - 1);
}

template <typename Enum>
constexpr Enum getEnumData(uint32_t flags, uint8_t index) {
  return static_cast<Enum>(
      (flags & details::mask(minimumBitCount<Enum>(), index)) >> index);
}

template <typename Enum>
void setEnumData(uint32_t& flags, uint8_t index, uint32_t newValue) {
  flags =
      (flags &
       ~static_cast<uint32_t>(details::mask(minimumBitCount<Enum>(), index))) |
      ((newValue << index) & (details::mask(minimumBitCount<Enum>(), index)));
}

constexpr bool getBooleanData(uint32_t flags, uint8_t index) {
  return (flags >> index) & 1;
}

inline void setBooleanData(uint32_t& flags, uint8_t index, bool value) {
  if (value) {
    flags |= 1 << index;
  } else {
    flags &= ~(1 << index);
  }
}

} // namespace facebook::yoga

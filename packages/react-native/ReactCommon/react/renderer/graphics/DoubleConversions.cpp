/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DoubleConversions.h"

#include <array>
#include <charconv>
#include <cmath>

namespace facebook::react {

std::string toString(double doubleValue, char suffix) {
  std::array<char, 256> buffer{};
  int len = 0;
  bool stripZeros = false;

  if (!std::isfinite(doubleValue)) {
    // Serialize infinite and NaN as 0
    buffer[0] = '0';
    len = 1;
  } else {
    double absValue = std::abs(doubleValue);

    // Use fixed notation for values in [1e-6, 1e21), scientific notation
    // with uppercase E otherwise. This approximates JavaScript's
    // Number.toString() behavior, though %g's default precision of 6
    // significant digits may lose precision for values with more digits.
    if (absValue != 0.0 && (absValue < 1e-6 || absValue >= 1e21)) {
      // %G is like %g but uses uppercase E
      auto result = std::to_chars(
          buffer.data(),
          buffer.data() + buffer.size(),
          doubleValue,
          std::chars_format::general,
          6);
      len = result.ec == std::errc{}
          ? static_cast<int>(result.ptr - buffer.data())
          : 0;
      // Uppercase 'e' to 'E' to match %G behavior
      for (int i = 0; i < len; ++i) {
        if (buffer[static_cast<size_t>(i)] == 'e') {
          buffer[static_cast<size_t>(i)] = 'E';
          break;
        }
      }
    } else if (
        (absValue >= 1e-6 && absValue < 1e-4) ||
        (absValue >= 1e6 && absValue < 1e21)) {
      // %g switches to scientific notation for exponents < -4 or >= precision
      // (default 6), so we use %f for [1e-6, 1e-4) and [1e6, 1e21).
      auto result = std::to_chars(
          buffer.data(),
          buffer.data() + buffer.size(),
          doubleValue,
          std::chars_format::fixed,
          20);
      len = result.ec == std::errc{}
          ? static_cast<int>(result.ptr - buffer.data())
          : 0;
      stripZeros = true;
    } else {
      auto result = std::to_chars(
          buffer.data(),
          buffer.data() + buffer.size(),
          doubleValue,
          std::chars_format::general,
          6);
      len = result.ec == std::errc{}
          ? static_cast<int>(result.ptr - buffer.data())
          : 0;
    }

    if (len <= 0 || static_cast<size_t>(len) >= buffer.size()) {
      buffer[0] = '0';
      len = 1;
    } else if (stripZeros) {
      // Strip trailing zeros and unnecessary decimal point
      auto end = static_cast<size_t>(len);
      while (end > 0 && buffer[end - 1] == '0') {
        --end;
      }
      if (end > 0 && buffer[end - 1] == '.') {
        --end;
      }
      len = static_cast<int>(end);
    }
  }

  auto resultLen = static_cast<size_t>(len);
  if (suffix != '\0') {
    buffer[resultLen] = suffix;
    ++resultLen;
  }
  return {buffer.data(), resultLen};
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DoubleConversions.h"

#include <double-conversion/double-conversion.h>
#include <array>

namespace facebook::react {

std::string toString(double doubleValue, char suffix) {
  // Format taken from folly's toString
  static double_conversion::DoubleToStringConverter conv(
      0,
      nullptr,
      nullptr,
      'E',
      -6, // detail::kConvMaxDecimalInShortestLow,
      21, // detail::kConvMaxDecimalInShortestHigh,
      6, // max leading padding zeros
      1); // max trailing padding zeros
  std::array<char, 256> buffer{};
  double_conversion::StringBuilder builder(buffer.data(), buffer.size());
  if (!conv.ToShortest(doubleValue, &builder)) {
    // Serialize infinite and NaN as 0
    builder.AddCharacter('0');
  }
  if (suffix != '\0') {
    builder.AddCharacter(suffix);
  }
  return builder.Finalize();
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ValueUnit.h"

#ifdef RN_SERIALIZABLE_STATE
#include <double-conversion/double-conversion.h>
#include <array>
#include <string>
#endif

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE

std::string toString(double doubleValue, char suffix) {
  // Format taken from folly's toString
  static double_conversion::DoubleToStringConverter conv(
      0,
      NULL,
      NULL,
      'E',
      -6, // detail::kConvMaxDecimalInShortestLow,
      21, // detail::kConvMaxDecimalInShortestHigh,
      6, // max leading padding zeros
      1); // max trailing padding zeros
  std::array<char, 256> buffer{};
  double_conversion::StringBuilder builder(buffer.data(), buffer.size());
  if (!conv.ToShortest(doubleValue, &builder)) {
    // Serialize infinite and NaN as 0%
    builder.AddCharacter('0');
    builder.AddCharacter('%');
  }
  builder.AddCharacter(suffix);
  return builder.Finalize();
}

folly::dynamic ValueUnit::toDynamic() const {
  switch (unit) {
    case UnitType::Undefined:
      return nullptr;
    case UnitType::Point:
      return value;
    case UnitType::Percent:
      return toString(value, '%');
    default:
      return nullptr;
  }
}
#endif

} // namespace facebook::react

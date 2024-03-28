/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ValueUnit.h"

#include <react/renderer/graphics/Float.h>

namespace facebook::react {

ValueUnit ValueUnit::getValueUnitFromRawValue(const RawValue& value) {
  if (value.hasType<Float>()) {
    auto number = (float)value;
    return ValueUnit(number, UnitType::Point);
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue.back() == '%') {
      auto tryValue = folly::tryTo<float>(
          std::string_view(stringValue).substr(0, stringValue.length() - 1));
      if (tryValue.hasValue()) {
        return ValueUnit(tryValue.value(), UnitType::Percent);
      }
    }
  }
  return ValueUnit();
};
} // namespace facebook::react

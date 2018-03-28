/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibilityProps.h"

#include "accessibilityValuesConversions.h"

namespace facebook {
namespace react {

void AccessibilityProps::apply(const RawProps &rawProps) {
  for (auto const &pair : rawProps) {
    auto const &name = pair.first;
    auto const &value = pair.second;

#define ACCESSIBILITY_PROPERTY(stringName, variableName, accessor, convertor) \
  if (name == #stringName) { \
    variableName = convertor(value accessor); \
    continue; \
  }

    ACCESSIBILITY_PROPERTY(accessibilityLabel, accessibilityLabel_, .asString(),)
  }
}

} // namespace react
} // namespace facebook

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewProps.h"

#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/graphics/graphicValuesConversions.h>

namespace facebook {
namespace react {

void ViewProps::apply(const RawProps &rawProps) {
  Props::apply(rawProps);
  YogaStylableProps::apply(rawProps);

  for (auto const &pair : rawProps) {
    auto const &name = pair.first;
    auto const &value = pair.second;

    #pragma mark View Specific Properties

    if (name == "zIndex") {
      zIndex_ = value.asInt();
      continue;
    }

    if (name == "opacity") {
      opacity_ = value.asDouble();
      continue;
    }

    if (name == "color") {
      foregroundColor_ = colorFromDynamic(value);
      continue;
    }

    if (name == "backgroundColor") {
      backgroundColor_ = colorFromDynamic(value);
      continue;
    }
  }
}

#pragma mark - Getters

SharedColor ViewProps::getForegroundColor() const {
  return foregroundColor_;
}

SharedColor ViewProps::getBackgroundColor() const {
  return backgroundColor_;
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  ViewProps defaultProps = {};

  SharedDebugStringConvertibleList list = {};

#define VIEW_PROPS_ADD_TO_SET(stringName, propertyName, accessor, convertor) \
  if (propertyName != defaultProps.propertyName) { \
    list.push_back(std::make_shared<DebugStringConvertibleItem>(#stringName, convertor(propertyName accessor))); \
  }

  VIEW_PROPS_ADD_TO_SET(zIndex, zIndex_, , std::to_string)
  VIEW_PROPS_ADD_TO_SET(opacity, opacity_, , std::to_string)

  VIEW_PROPS_ADD_TO_SET(backgroundColor, backgroundColor_, , colorNameFromColor)
  VIEW_PROPS_ADD_TO_SET(foregroundColor, foregroundColor_, , colorNameFromColor)

  // Accessibility Props
  auto accessibilityPropsList = AccessibilityProps::getDebugProps();
  std::move(accessibilityPropsList.begin(), accessibilityPropsList.end(), std::back_inserter(list));

  // Yoga styles
  list.push_back(std::make_shared<DebugStringConvertibleItem>("style", "", YogaStylableProps::getDebugProps()));

  return list;
}

} // namespace react
} // namespace facebook

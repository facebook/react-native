/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextProps.h"

#include <fabric/attributedstring/textValuesConversions.h>
#include <fabric/core/propsConversions.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/graphics/graphicValuesConversions.h>
#include <fabric/text/propsConversions.h>

namespace facebook {
namespace react {

void TextProps::apply(const RawProps &rawProps) {
  Props::apply(rawProps);
  BaseTextProps::apply(rawProps);
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}

} // namespace react
} // namespace facebook

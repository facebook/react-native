/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTText.h>
#include <react/components/art/ARTElement.h>
#include <react/components/art/conversions.h>

namespace facebook {
namespace react {

bool ARTText::operator==(const ARTElement &rhs) const {
  if (rhs.elementType != ARTElementType::Text) {
    return false;
  }
  auto text = (const ARTText &)(rhs);
  return std::tie(
             elementType,
             opacity,
             transform,
             d,
             stroke,
             strokeDash,
             fill,
             strokeWidth,
             strokeCap,
             strokeJoin,
             alignment,
             frame) ==
      std::tie(
             text.elementType,
             text.opacity,
             text.transform,
             text.d,
             text.stroke,
             text.strokeDash,
             text.fill,
             text.strokeWidth,
             text.strokeCap,
             text.strokeJoin,
             text.alignment,
             text.frame);
}

bool ARTText::operator!=(const ARTElement &rhs) const {
  return !(*this == rhs);
}

#ifdef ANDROID
folly::dynamic ARTText::getDynamic() const {
  return toDynamic(*this);
}
#endif

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTShape.h>
#include <react/components/art/ARTElement.h>
#include <react/components/art/conversions.h>

namespace facebook {
namespace react {

bool ARTShape::operator==(const ARTElement &rhs) const {
  if (rhs.elementType != ARTElementType::Shape) {
    return false;
  }
  auto shape = (const ARTShape &)(rhs);
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
             strokeJoin) ==
      std::tie(
             shape.elementType,
             shape.opacity,
             shape.transform,
             shape.d,
             shape.stroke,
             shape.strokeDash,
             shape.fill,
             shape.strokeWidth,
             shape.strokeCap,
             shape.strokeJoin);
}

bool ARTShape::operator!=(const ARTElement &rhs) const {
  return !(*this == rhs);
}

#ifdef ANDROID
folly::dynamic ARTShape::getDynamic() const {
  return toDynamic(*this);
}
#endif

} // namespace react
} // namespace facebook

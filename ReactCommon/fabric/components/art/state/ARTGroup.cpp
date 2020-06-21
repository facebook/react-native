/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTGroup.h>
#include <react/components/art/ARTElement.h>
#include <react/components/art/conversions.h>

namespace facebook {
namespace react {

bool ARTGroup::operator==(const ARTElement &rhs) const {
  if (rhs.elementType != ARTElementType::Group) {
    return false;
  }
  auto group = (const ARTGroup &)(rhs);
  return std::tie(elementType, opacity, transform, clipping) ==
      std::tie(
             group.elementType,
             group.opacity,
             group.transform,
             group.clipping) &&
      elements == group.elements;
}

bool ARTGroup::operator!=(const ARTElement &rhs) const {
  return !(*this == rhs);
}

#ifdef ANDROID
folly::dynamic ARTGroup::getDynamic() const {
  return toDynamic(*this);
}
#endif

} // namespace react
} // namespace facebook

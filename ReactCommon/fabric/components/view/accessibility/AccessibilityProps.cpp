/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibilityProps.h"

#include <fabric/components/view/accessibilityPropsConversions.h>
#include <fabric/components/view/propsConversions.h>
#include <fabric/core/propsConversions.h>

namespace facebook {
namespace react {

AccessibilityProps::AccessibilityProps(
    const AccessibilityProps &sourceProps,
    const RawProps &rawProps)
    : accessible(convertRawProp(
          rawProps,
          "accessible",
          sourceProps.accessible)),
      accessibilityTraits(convertRawProp(
          rawProps,
          "accessibilityTraits",
          sourceProps.accessibilityTraits)),
      accessibilityLabel(convertRawProp(
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel)),
      accessibilityHint(convertRawProp(
          rawProps,
          "accessibilityHint",
          sourceProps.accessibilityHint)),
      accessibilityActions(convertRawProp(
          rawProps,
          "accessibilityActions",
          sourceProps.accessibilityActions)),
      accessibilityViewIsModal(convertRawProp(
          rawProps,
          "accessibilityViewIsModal",
          sourceProps.accessibilityViewIsModal)),
      accessibilityElementsHidden(convertRawProp(
          rawProps,
          "accessibilityElementsHidden",
          sourceProps.accessibilityElementsHidden)),
      accessibilityIgnoresInvertColors(convertRawProp(
          rawProps,
          "accessibilityIgnoresInvertColors",
          sourceProps.accessibilityIgnoresInvertColors)) {}

} // namespace react
} // namespace facebook

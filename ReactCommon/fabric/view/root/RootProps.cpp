/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootProps.h"

#include <fabric/view/conversions.h>

#include "YogaLayoutableShadowNode.h"

namespace facebook {
namespace react {

static YGStyle yogaStyleFromLayoutConstraints(const LayoutConstraints &layoutConstraints) {
  YGStyle yogaStyle;
  yogaStyle.minDimensions[YGDimensionWidth] =
    yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  yogaStyle.minDimensions[YGDimensionHeight] =
    yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  yogaStyle.maxDimensions[YGDimensionWidth] =
    yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  yogaStyle.maxDimensions[YGDimensionHeight] =
    yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);

  return yogaStyle;
}

RootProps::RootProps(
  const RootProps &sourceProps,
  const LayoutConstraints &layoutConstraints,
  const LayoutContext &layoutContext
):
  ViewProps(yogaStyleFromLayoutConstraints(layoutConstraints)),
  layoutConstraints(layoutConstraints),
  layoutContext(layoutContext) {};

} // namespace react
} // namespace facebook

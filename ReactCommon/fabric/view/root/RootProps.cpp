/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootProps.h"

#include "yogaValuesConversions.h"

namespace facebook {
namespace react {

void RootProps::applyLayoutConstraints(const LayoutConstraints &layoutConstraints) {
  ensureUnsealed();

  layoutConstraints_ = layoutConstraints;

  yogaStyle_.minDimensions[YGDimensionWidth] =
    yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  yogaStyle_.minDimensions[YGDimensionHeight] =
    yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  yogaStyle_.maxDimensions[YGDimensionWidth] =
    yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  yogaStyle_.maxDimensions[YGDimensionHeight] =
    yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);
}

void RootProps::applyLayoutContext(const LayoutContext &layoutContext) {
  ensureUnsealed();
  layoutContext_ = layoutContext;
}

LayoutConstraints RootProps::getLayoutConstraints() const {
  return layoutConstraints_;
}

LayoutContext RootProps::getLayoutContext() const {
  return layoutContext_;
}

} // namespace react
} // namespace facebook

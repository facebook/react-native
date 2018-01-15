/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowView+Layout.h"

#import <yoga/Yoga.h>

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return YGUndefined;
  }

  return value;
}

CGFloat RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

@implementation RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeTop)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeLeft)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeBottom)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeRight))
  };
}

- (UIEdgeInsets)borderAsInsets
{
  YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeTop)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeLeft)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeBottom)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeRight))
  };
}

- (UIEdgeInsets)compoundInsets
{
  UIEdgeInsets borderAsInsets = self.borderAsInsets;
  UIEdgeInsets paddingAsInsets = self.paddingAsInsets;

  return (UIEdgeInsets){
    borderAsInsets.top + paddingAsInsets.top,
    borderAsInsets.left + paddingAsInsets.left,
    borderAsInsets.bottom + paddingAsInsets.bottom,
    borderAsInsets.right + paddingAsInsets.right
  };
}

- (CGSize)availableSize
{
  return UIEdgeInsetsInsetRect((CGRect){CGPointZero, self.frame.size}, self.compoundInsets).size;
}

#pragma mark - Measuring

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  YGNodeRef clonnedYogaNode = YGNodeClone(self.yogaNode);
  YGNodeRef constraintYogaNode = YGNodeNewWithConfig([[self class] yogaConfig]);

  YGNodeInsertChild(constraintYogaNode, clonnedYogaNode, 0);

  YGNodeStyleSetMinWidth(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  YGNodeStyleSetMinHeight(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  YGNodeStyleSetMaxWidth(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  YGNodeStyleSetMaxHeight(constraintYogaNode, RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  YGNodeCalculateLayout(
    constraintYogaNode,
    YGUndefined,
    YGUndefined,
    self.layoutDirection
  );

  CGSize measuredSize = (CGSize){
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetWidth(constraintYogaNode)),
    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  YGNodeRemoveChild(constraintYogaNode, clonnedYogaNode);
  YGNodeFree(constraintYogaNode);
  YGNodeFree(clonnedYogaNode);

  return measuredSize;
}

#pragma mark - Dirty Propagation Control

- (void)dirtyLayout
{
  // The default implementaion does nothing.
}

- (void)clearLayout
{
  // The default implementaion does nothing.
}

@end

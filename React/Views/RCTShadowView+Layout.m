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

@implementation RCTShadowView (Layout)

- (UIEdgeInsets)paddingAsInsets
{
  YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    YGNodeLayoutGetPadding(yogaNode, YGEdgeTop),
    YGNodeLayoutGetPadding(yogaNode, YGEdgeLeft),
    YGNodeLayoutGetPadding(yogaNode, YGEdgeBottom),
    YGNodeLayoutGetPadding(yogaNode, YGEdgeRight)
  };
}

- (UIEdgeInsets)borderAsInsets
{
  YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    YGNodeLayoutGetBorder(yogaNode, YGEdgeTop),
    YGNodeLayoutGetBorder(yogaNode, YGEdgeLeft),
    YGNodeLayoutGetBorder(yogaNode, YGEdgeBottom),
    YGNodeLayoutGetBorder(yogaNode, YGEdgeRight)
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

@end

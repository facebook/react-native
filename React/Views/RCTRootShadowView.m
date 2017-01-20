/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTI18nUtil.h"
#import "RCTRootShadowView.h"

@implementation RCTRootShadowView

/**
 * Init the RCTRootShadowView with RTL status.
 * Returns a RTL CSS layout if isRTL is true (Default is LTR CSS layout).
 */
- (instancetype)init
{
  self = [super init];
  if (self) {
    if ([[RCTI18nUtil sharedInstance] isRTL]) {
      YGNodeStyleSetDirection(self.cssNode, YGDirectionRTL);
    }
  }
  return self;
}

- (void)applySizeConstraints
{
  switch (_sizeFlexibility) {
    case RCTRootViewSizeFlexibilityNone:
      break;
    case RCTRootViewSizeFlexibilityWidth:
      YGNodeStyleSetWidth(self.cssNode, YGUndefined);
      break;
    case RCTRootViewSizeFlexibilityHeight:
      YGNodeStyleSetHeight(self.cssNode, YGUndefined);
      break;
    case RCTRootViewSizeFlexibilityWidthAndHeight:
      YGNodeStyleSetWidth(self.cssNode, YGUndefined);
      YGNodeStyleSetHeight(self.cssNode, YGUndefined);
      break;
  }
}

- (NSSet<RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self applySizeConstraints];

  YGNodeCalculateLayout(self.cssNode, YGUndefined, YGUndefined, YGDirectionInherit);

  NSMutableSet<RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
  return viewsWithNewFrame;
}

@end

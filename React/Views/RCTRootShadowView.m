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
      self.cssNode->style.direction = CSSDirectionRTL;
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
      self.cssNode->style.dimensions[CSSDimensionWidth] = CSSUndefined;
      break;
    case RCTRootViewSizeFlexibilityHeight:
      self.cssNode->style.dimensions[CSSDimensionHeight] = CSSUndefined;
      break;
    case RCTRootViewSizeFlexibilityWidthAndHeight:
      self.cssNode->style.dimensions[CSSDimensionWidth] = CSSUndefined;
      self.cssNode->style.dimensions[CSSDimensionHeight] = CSSUndefined;
      break;
  }
}

- (NSSet<RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self applySizeConstraints];

  layoutNode(self.cssNode, CSSUndefined, CSSUndefined, CSSDirectionInherit);

  NSMutableSet<RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
  return viewsWithNewFrame;
}

@end

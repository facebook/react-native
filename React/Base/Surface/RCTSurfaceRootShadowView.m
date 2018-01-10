/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSurfaceRootShadowView.h"

#import "RCTI18nUtil.h"
#import "RCTShadowView+Layout.h"
#import "RCTUIManagerUtils.h"

@implementation RCTSurfaceRootShadowView {
  CGSize _intrinsicSize;
  BOOL _isRendered;
  BOOL _isLaidOut;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.viewName = @"RCTSurfaceRootView";
    _baseDirection = [[RCTI18nUtil sharedInstance] isRTL] ? YGDirectionRTL : YGDirectionLTR;
    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

    self.alignSelf = YGAlignStretch;
    self.flex = 1;
  }

  return self;
}

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  if (!_isRendered) {
    [_delegate rootShadowViewDidStartRendering:self];
    _isRendered = YES;
  }
}

- (void)calculateLayoutWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximimSize
{
  YGNodeRef yogaNode = self.yogaNode;

  YGNodeStyleSetMinWidth(yogaNode, RCTYogaFloatFromCoreGraphicsFloat(maximimSize.width));
  YGNodeStyleSetMinHeight(yogaNode, RCTYogaFloatFromCoreGraphicsFloat(maximimSize.height));

  YGNodeCalculateLayout(
    self.yogaNode,
    RCTYogaFloatFromCoreGraphicsFloat(maximimSize.width),
    RCTYogaFloatFromCoreGraphicsFloat(maximimSize.height),
    _baseDirection
  );
}

- (NSSet<RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self calculateLayoutWithMinimumSize:_minimumSize
                           maximumSize:_maximumSize];

  NSMutableSet<RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.yogaNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];

  self.intrinsicSize = self.frame.size;

  if (_isRendered && !_isLaidOut) {
    [_delegate rootShadowViewDidStartLayingOut:self];
    _isLaidOut = YES;
  }

  return viewsWithNewFrame;
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  if (CGSizeEqualToSize(minimumSize, _minimumSize) &&
      CGSizeEqualToSize(maximumSize, _maximumSize)) {
    return;
  }

  _maximumSize = maximumSize;
  _minimumSize = minimumSize;
}

- (void)setIntrinsicSize:(CGSize)intrinsicSize
{
  if (CGSizeEqualToSize(_intrinsicSize, intrinsicSize)) {
    return;
  }

  _intrinsicSize = intrinsicSize;

  [_delegate rootShadowView:self didChangeIntrinsicSize:intrinsicSize];
}

- (CGSize)intrinsicSize
{
  return _intrinsicSize;
}

@end

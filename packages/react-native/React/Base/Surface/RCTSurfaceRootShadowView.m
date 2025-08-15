/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceRootShadowView.h"

#ifndef RCT_FIT_RM_OLD_RUNTIME

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

- (void)layoutWithAffectedShadowViews:(NSPointerArray *)affectedShadowViews
{
  NSHashTable<NSString *> *other = [NSHashTable new];

  RCTLayoutContext layoutContext = {};
  layoutContext.affectedShadowViews = affectedShadowViews;
  layoutContext.other = other;

  [self layoutWithMinimumSize:_minimumSize
                  maximumSize:_maximumSize
              layoutDirection:RCTUIKitLayoutDirectionFromYogaLayoutDirection(_baseDirection)
                layoutContext:layoutContext];

  self.intrinsicSize = self.layoutMetrics.frame.size;

  if (_isRendered && !_isLaidOut) {
    [_delegate rootShadowViewDidStartLayingOut:self];
    _isLaidOut = YES;
  }
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  if (CGSizeEqualToSize(minimumSize, _minimumSize) && CGSizeEqualToSize(maximumSize, _maximumSize)) {
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

#else // RCT_FIT_RM_OLD_RUNTIME

@implementation RCTSurfaceRootShadowView
- (void)setMinimumSize:(CGSize)size maximumSize:(CGSize)maximumSize
{
}

- (void)layoutWithAffectedShadowViews:(NSPointerArray *)affectedShadowViews
{
}

@end

#endif // RCT_FIT_RM_OLD_RUNTIME

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootShadowView.h"

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import "RCTI18nUtil.h"
#import "RCTShadowView+Layout.h"

@implementation RCTRootShadowView

- (instancetype)init
{
  if (self = [super init]) {
    _baseDirection = [[RCTI18nUtil sharedInstance] isRTL] ? YGDirectionRTL : YGDirectionLTR;
    _minimumSize = CGSizeZero;
    _availableSize = CGSizeMake(INFINITY, INFINITY);
  }

  return self;
}

- (void)layoutWithAffectedShadowViews:(NSPointerArray *)affectedShadowViews
{
  NSHashTable<NSString *> *other = [NSHashTable new];

  RCTLayoutContext layoutContext = {};
  layoutContext.absolutePosition = CGPointZero;
  layoutContext.affectedShadowViews = affectedShadowViews;
  layoutContext.other = other;

  [self layoutWithMinimumSize:_minimumSize
                  maximumSize:_availableSize
              layoutDirection:RCTUIKitLayoutDirectionFromYogaLayoutDirection(_baseDirection)
                layoutContext:layoutContext];
}

@end

#else // RCT_FIT_RM_OLD_COMPONENT

@implementation RCTRootShadowView
- (void)layoutWithAffectedShadowViews:(NSPointerArray *)affectedShadowViews
{
}
@end

#endif // RCT_FIT_RM_OLD_COMPONENT

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowRawText.h"
#import "RCTShadowText.h"
#import "RCTSparseArray.h"
#import "RCTText.h"
#import "UIView+React.h"

@implementation RCTTextManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTText alloc] init];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowText alloc] init];
}

#pragma mark - Shadow properties

RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
RCT_EXPORT_SHADOW_PROPERTY(shadowOffset, CGSize)
RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, RCTTextDecorationLineType)
RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry
{
  for (RCTShadowView *rootView in shadowViewRegistry.allObjects) {
    if (![rootView isReactRootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < [queue count]; i++) {
      RCTShadowView *shadowView = queue[i];
      RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[RCTShadowText class]]) {
        [(RCTShadowText *)shadowView recomputeText];
      } else if ([shadowView isKindOfClass:[RCTShadowRawText class]]) {
        RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(RCTShadowRawText *)shadowView text]);
      } else {
        for (RCTShadowView *child in [shadowView reactSubviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }
  }

  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {};
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowText *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTText *text = viewRegistry[reactTag];
    text.contentInset = padding;
  };
}

@end

// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTextManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTSparseArray.h"
#import "UIView+ReactKit.h"

#import "RCTShadowRawText.h"
#import "RCTShadowText.h"

@implementation RCTTextManager

- (UIView *)viewWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  UILabel *label = [[UILabel alloc] init];
  label.numberOfLines = 0;
  return label;
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowText alloc] init];
}

RCT_REMAP_VIEW_PROPERTY(containerBackgroundColor, backgroundColor)
RCT_REMAP_VIEW_PROPERTY(textAlign, textAlignment);

- (void)set_numberOfLines:(id)json
                  forView:(UILabel *)view
          withDefaultView:(UILabel *)defaultView
{
  NSLineBreakMode truncationMode = NSLineBreakByClipping;
  view.numberOfLines = json ? [RCTConvert NSInteger:json] : defaultView.numberOfLines;
  if (view.numberOfLines > 0) {
    truncationMode = NSLineBreakByTruncatingTail;
  }
  view.lineBreakMode = truncationMode;
}

- (void)set_numberOfLines:(id)json
            forShadowView:(RCTShadowText *)shadowView
          withDefaultView:(RCTShadowText *)defaultView
{
  NSLineBreakMode truncationMode = NSLineBreakByClipping;
  shadowView.maxNumberOfLines = json ? [RCTConvert NSInteger:json] : defaultView.maxNumberOfLines;
  if (shadowView.maxNumberOfLines > 0) {
    truncationMode = NSLineBreakByTruncatingTail;
  }
  shadowView.truncationMode = truncationMode;
}

- (void)set_backgroundColor:(id)json
              forShadowView:(RCTShadowText *)shadowView
            withDefaultView:(RCTShadowText *)defaultView
{
  shadowView.textBackgroundColor = json ? [RCTConvert UIColor:json] : defaultView.textBackgroundColor;
}

- (void)set_containerBackgroundColor:(id)json
                       forShadowView:(RCTShadowText *)shadowView
                     withDefaultView:(RCTShadowText *)defaultView
{
  shadowView.backgroundColor = json ? [RCTConvert UIColor:json] : defaultView.backgroundColor;
  shadowView.isBGColorExplicitlySet = json ? YES : defaultView.isBGColorExplicitlySet;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry
{
  NSMutableArray *shadowBlocks = [NSMutableArray new];

  // TODO: are modules global, or specific to a given rootView?
  for (RCTShadowView *rootView in shadowViewRegistry.allObjects) {
    
    if (![rootView isReactRootView]) {
      // This isn't a host view
      continue;
    }
    
    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    // TODO: this is a slightly weird way to do this - a recursive approach would be cleaner
    RCTSparseArray *attributedStringForTag = [[RCTSparseArray alloc] init];
    NSMutableArray *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < [queue count]; i++) {
      RCTShadowView *shadowView = queue[i];
      RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[RCTShadowText class]]) {
        RCTShadowText *shadowText = (RCTShadowText *)shadowView;
        NSNumber *reactTag = shadowText.reactTag;
        attributedStringForTag[reactTag] = [shadowText attributedString];
      } else if ([shadowView isKindOfClass:[RCTShadowRawText class]]) {
        RCTShadowRawText *shadowRawText = (RCTShadowRawText *)shadowView;
        RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'", [shadowRawText text]);
      } else {
        for (RCTShadowView *child in [shadowView reactSubviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }

    [shadowBlocks addObject:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
      [attributedStringForTag enumerateObjectsUsingBlock:^(NSAttributedString *attributedString, NSNumber *reactTag, BOOL *stop) {
        UILabel *textView = viewRegistry[reactTag];
        [textView setAttributedText:attributedString];
      }];
    }];
  }

  return ^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    for (RCTViewManagerUIBlock shadowBlock in shadowBlocks) {
      shadowBlock(viewManager, viewRegistry);
    }
  };
}

@end

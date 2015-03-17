// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTextManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowRawText.h"
#import "RCTShadowText.h"
#import "RCTSparseArray.h"
#import "RCTText.h"
#import "UIView+ReactKit.h"

@implementation RCTTextManager

- (UIView *)view
{
  return [[RCTText alloc] init];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowText alloc] init];
}

#pragma mark - View properties

RCT_REMAP_VIEW_PROPERTY(containerBackgroundColor, backgroundColor)
RCT_CUSTOM_VIEW_PROPERTY(numberOfLines, RCTText)
{
  NSLineBreakMode truncationMode = NSLineBreakByClipping;
  view.numberOfLines = json ? [RCTConvert NSInteger:json] : defaultView.numberOfLines;
  if (view.numberOfLines > 0) {
    truncationMode = NSLineBreakByTruncatingTail;
  }
  view.lineBreakMode = truncationMode;
}

#pragma mark - Shadow properties

RCT_CUSTOM_SHADOW_PROPERTY(backgroundColor, RCTShadowText)
{
  view.textBackgroundColor = json ? [RCTConvert UIColor:json] : defaultView.textBackgroundColor;
}
RCT_CUSTOM_SHADOW_PROPERTY(containerBackgroundColor, RCTShadowText)
{
  view.backgroundColor = json ? [RCTConvert UIColor:json] : defaultView.backgroundColor;
  view.isBGColorExplicitlySet = json ? YES : defaultView.isBGColorExplicitlySet;
}
RCT_CUSTOM_SHADOW_PROPERTY(numberOfLines, RCTShadowText)
{
  NSLineBreakMode truncationMode = NSLineBreakByClipping;
  view.maxNumberOfLines = json ? [RCTConvert NSInteger:json] : defaultView.maxNumberOfLines;
  if (view.maxNumberOfLines > 0) {
    truncationMode = NSLineBreakByTruncatingTail;
  }
  view.truncationMode = truncationMode;
}
RCT_CUSTOM_SHADOW_PROPERTY(textAlign, RCTShadowText)
{
  view.textAlign = json ? [RCTConvert NSTextAlignment:json] : defaultView.textAlign;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowText *)shadowView
{
  //TODO: This could be a cleaner replacement for uiBlockToAmendWithShadowViewRegistry
  return nil;
}

// TODO: the purpose of this block is effectively just to copy properties from the shadow views
// to their equivalent UIViews. In this case, the property being copied is the attributed text,
// but the same principle could be used to copy any property. The implementation is really ugly tho
// because the RCTViewManager doesn't retain a reference to the views that it manages, so it basically
// has to search the entire view hierarchy for relevant views. Not awesome. This seems like something
// where we could introduce a generic solution - perhaps a method on RCTShadowView that is called after
// layout to copy its properties across?
- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry
{
  NSMutableArray *uiBlocks = [NSMutableArray new];

  // TODO: are modules global, or specific to a given rootView?
  for (RCTShadowView *rootView in shadowViewRegistry.allObjects) {
    if (![rootView isReactRootView]) {
      // This isn't a root view
      continue;
    }
    
    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    // TODO: this is a slightly weird way to do this - a recursive approach would be cleaner
    RCTSparseArray *reactTaggedAttributedStrings = [[RCTSparseArray alloc] init];
    NSMutableArray *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < [queue count]; i++) {
      RCTShadowView *shadowView = queue[i];
      RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[RCTShadowText class]]) {
        RCTShadowText *shadowText = (RCTShadowText *)shadowView;
        reactTaggedAttributedStrings[shadowText.reactTag] = [shadowText attributedString];
      } else if ([shadowView isKindOfClass:[RCTShadowRawText class]]) {
        RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'", [(RCTShadowRawText *)shadowView text]);
      } else {
        for (RCTShadowView *child in [shadowView reactSubviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }

    [uiBlocks addObject:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
      [reactTaggedAttributedStrings enumerateObjectsUsingBlock:^(NSAttributedString *attributedString, NSNumber *reactTag, BOOL *stop) {
        RCTText *text = viewRegistry[reactTag];
        text.attributedText = attributedString;
      }];
    }];
  }

  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (RCTViewManagerUIBlock shadowBlock in uiBlocks) {
      shadowBlock(uiManager, viewRegistry);
    }
  };
}

@end

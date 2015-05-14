/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextViewManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTTextView.h"
#import "RCTShadowText.h"

#import "RCTShadowTextView.h"

@implementation RCTTextViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowTextView alloc] init];
}

// Data string properties
RCT_EXPORT_SHADOW_PROPERTY(placeholder, NSString)
RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
RCT_CUSTOM_SHADOW_PROPERTY(textUpdate, NSString, RCTShadowTextView)
{
  [view setText:json[@"text"] updateTextView:json[@"updateText"]? json[@"updateText"]: false ];
}

// UITextView specific properties
RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
RCT_REMAP_VIEW_PROPERTY(scrollEnabled, textView.scrollEnabled, BOOL )
RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)

// Shadow View properties
RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
RCT_REMAP_SHADOW_PROPERTY(color, textColor, UIColor )
RCT_EXPORT_SHADOW_PROPERTY(placeholderTextColor, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
RCT_REMAP_SHADOW_PROPERTY(backgroundColor, textBackgroundColor, UIColor)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry
{
  NSMutableArray *uiBlocks = [NSMutableArray new];
  
  for (RCTShadowView *rootView in shadowViewRegistry.allObjects) {
    if (![rootView isReactRootView]) {
      // This isn't a root view
      continue;
    }
    
    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }
    
    RCTSparseArray *reactTaggedAttributedStrings = [[RCTSparseArray alloc] init];
    [self _processReactSubview:rootView toTaggedAttributedStrings:reactTaggedAttributedStrings];
    
    [uiBlocks addObject:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
      [reactTaggedAttributedStrings enumerateObjectsUsingBlock:^(NSDictionary *attributedStringDic, NSNumber *reactTag, BOOL *stop) {
        RCTTextView *text = viewRegistry[reactTag];
        text.attributedText = attributedStringDic[@"attributedText"];
        text.attributedPlaceholderText = attributedStringDic[@"attributedPlaceholderText"];
      }];
    }];
  }
  
  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (RCTViewManagerUIBlock shadowBlock in uiBlocks) {
      shadowBlock(uiManager, viewRegistry);
    }
  };
}

- (BOOL)_processReactSubview:(RCTShadowView *)shadowView toTaggedAttributedStrings:(RCTSparseArray *)reactTaggedAttributedStrings
{
  BOOL textComputed = true;
  RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");
  
  if ([shadowView isKindOfClass:[RCTShadowTextView class]]) {
    RCTShadowTextView *shadowTextView = (RCTShadowTextView *)shadowView;
    reactTaggedAttributedStrings[shadowTextView.reactTag] = @{
                                                              @"attributedText": [shadowTextView attributedString],
                                                              @"attributedPlaceholderText": [shadowTextView attributedPlaceholderString]
                                                              };
  
  } else if ([shadowView isKindOfClass:[RCTShadowText class]]) {
    // not all text has been computed because a RCTShadowText has not been handled yet.
    textComputed = false;
  } else {
    for (RCTShadowView *child in [shadowView reactSubviews]) {
      if ([child isTextDirty]) {
        BOOL textComputedResult = [self _processReactSubview:child toTaggedAttributedStrings:reactTaggedAttributedStrings];
        if( !textComputedResult ) {
          textComputed = false;
        }
      }
    }
  }
  if (textComputed) {
    [shadowView setTextComputed];
  }
  return textComputed;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowTextView *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTTextView *textView = viewRegistry[reactTag];
    textView.contentInset = padding;
  };
}

@end

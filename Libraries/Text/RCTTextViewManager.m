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

@implementation RCTTextViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTTextView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
RCT_REMAP_VIEW_PROPERTY(editable, textView.editable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(text, NSString)
RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
RCT_REMAP_VIEW_PROPERTY(keyboardType, textView.keyboardType, UIKeyboardType)
RCT_REMAP_VIEW_PROPERTY(returnKeyType, textView.returnKeyType, UIReturnKeyType)
RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textView.enablesReturnKeyAutomatically, BOOL)
RCT_REMAP_VIEW_PROPERTY(color, textColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textView.autocapitalizationType, UITextAutocapitalizationType)
RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, RCTTextView)
{
  view.font = [RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, RCTTextView)
{
  view.font = [RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, RCTTextView)
{
  view.font = [RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, RCTTextView)
{
  view.font = [RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    ((RCTTextView *)viewRegistry[reactTag]).contentInset = padding;
  };
}

@end

// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTextFieldManager.h"

#import "RCTConvert.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTTextField.h"

@implementation RCTTextFieldManager

- (UIView *)view
{
  return [[RCTTextField alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(caretHidden)
RCT_EXPORT_VIEW_PROPERTY(autoCorrect)
RCT_REMAP_VIEW_PROPERTY(autoCapitalize, autocapitalizationType)
RCT_EXPORT_VIEW_PROPERTY(enabled)
RCT_EXPORT_VIEW_PROPERTY(placeholder)
RCT_EXPORT_VIEW_PROPERTY(text)
RCT_EXPORT_VIEW_PROPERTY(clearButtonMode)
RCT_EXPORT_VIEW_PROPERTY(keyboardType)
RCT_REMAP_VIEW_PROPERTY(color, textColor)
RCT_CUSTOM_VIEW_PROPERTY(fontSize, RCTTextField *)
{
  view.font = [RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, RCTTextField *)
{
  view.font = [RCTConvert UIFont:view.font withWeight:json]; // TODO
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, RCTTextField *)
{
  view.font = [RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    ((RCTTextField *)viewRegistry[reactTag]).paddingEdgeInsets = padding;
  };
}

@end

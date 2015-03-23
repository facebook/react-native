/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextFieldManager.h"

#import "RCTBridge.h"
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
RCT_EXPORT_VIEW_PROPERTY(enabled)
RCT_EXPORT_VIEW_PROPERTY(placeholder)
RCT_EXPORT_VIEW_PROPERTY(text)
RCT_EXPORT_VIEW_PROPERTY(clearButtonMode)
RCT_EXPORT_VIEW_PROPERTY(keyboardType)
RCT_REMAP_VIEW_PROPERTY(color, textColor)
RCT_CUSTOM_VIEW_PROPERTY(autoCapitalize, RCTTextField)
{
  view.autocapitalizationType = json ? [RCTConvert UITextAutocapitalizationType:json]
                                     : defaultView.autocapitalizationType;
}
RCT_CUSTOM_VIEW_PROPERTY(fontSize, RCTTextField)
{
  view.font = [RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, RCTTextField)
{
  view.font = [RCTConvert UIFont:view.font withWeight:json]; // TODO: default value
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, RCTTextField)
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

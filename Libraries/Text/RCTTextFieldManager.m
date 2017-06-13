/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextFieldManager.h"

#import <React/RCTBridge.h>
#import <React/RCTFont.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTShadowView.h>

#import "RCTConvert+Text.h"
#import "RCTShadowTextField.h"
#import "RCTTextField.h"
#import "RCTUITextField.h"

@implementation RCTTextFieldManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [RCTShadowTextField new];
}

- (UIView *)view
{
  return [[RCTTextField alloc] initWithBridge:self.bridge];
}

RCT_REMAP_VIEW_PROPERTY(caretHidden, textField.caretHidden, BOOL)
RCT_REMAP_VIEW_PROPERTY(autoCorrect, textField.autocorrectionType, UITextAutocorrectionType)
RCT_REMAP_VIEW_PROPERTY(spellCheck, textField.spellCheckingType, UITextSpellCheckingType)
RCT_REMAP_VIEW_PROPERTY(editable, textField.enabled, BOOL)
RCT_REMAP_VIEW_PROPERTY(placeholder, textField.placeholder, NSString)
RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, textField.placeholderColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(selection, RCTTextSelection)
RCT_EXPORT_VIEW_PROPERTY(text, NSString)
RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
RCT_REMAP_VIEW_PROPERTY(clearButtonMode, textField.clearButtonMode, UITextFieldViewMode)
RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, textField.clearsOnBeginEditing, BOOL)
RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
RCT_REMAP_VIEW_PROPERTY(keyboardType, textField.keyboardType, UIKeyboardType)
RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, textField.keyboardAppearance, UIKeyboardAppearance)
RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(returnKeyType, textField.returnKeyType, UIReturnKeyType)
RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, textField.enablesReturnKeyAutomatically, BOOL)
RCT_REMAP_VIEW_PROPERTY(secureTextEntry, textField.secureTextEntry, BOOL)
RCT_REMAP_VIEW_PROPERTY(password, textField.secureTextEntry, BOOL) // backwards compatibility
RCT_REMAP_VIEW_PROPERTY(color, textField.textColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(autoCapitalize, textField.autocapitalizationType, UITextAutocapitalizationType)
RCT_REMAP_VIEW_PROPERTY(textAlign, textField.textAlignment, NSTextAlignment)
RCT_REMAP_VIEW_PROPERTY(selectionColor, textField.tintColor, UIColor)
RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, RCTTextField)
{
  view.textField.font = [RCTFont updateFont:view.textField.font withSize:json ?: @(defaultView.textField.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused RCTTextField)
{
  view.textField.font = [RCTFont updateFont:view.textField.font withWeight:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused RCTTextField)
{
  view.textField.font = [RCTFont updateFont:view.textField.font withStyle:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, RCTTextField)
{
  view.textField.font = [RCTFont updateFont:view.textField.font withFamily:json ?: defaultView.textField.font.familyName];
}
RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets paddingAsInsets = shadowView.paddingAsInsets;
  UIEdgeInsets borderAsInsets = shadowView.borderAsInsets;
  return ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTTextField *> *viewRegistry) {
    RCTTextField *textField = viewRegistry[reactTag];
    textField.reactPaddingInsets = paddingAsInsets;
    textField.reactBorderInsets = borderAsInsets;
  };
}

@end

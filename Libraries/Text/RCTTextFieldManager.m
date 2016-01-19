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
#import "RCTShadowView.h"
#import "RCTTextField.h"

@interface RCTTextFieldManager() <UITextFieldDelegate>

@end

@implementation RCTTextFieldManager

RCT_EXPORT_MODULE()

static NSUInteger RCTApparentLengthOfText(NSString *text)
{
  NSUInteger length = 0;
  for (NSUInteger i = 0, textLength = text.length; i < textLength; length++) {
    NSRange range = [text rangeOfComposedCharacterSequenceAtIndex:i];
    i = NSMaxRange(range);
  }
  
  return length;
}

static void RCTPlaceCaretAtOffset(id<UITextInput> textInput, NSUInteger offset)
{
  UITextPosition *insertEnd = [textInput positionFromPosition:textInput.beginningOfDocument
                                                       offset:offset];
  textInput.selectedTextRange = [textInput textRangeFromPosition:insertEnd toPosition:insertEnd];
}

static NSRange RCTLimitedRangeOfText(NSString *text, NSUInteger allowedLength)
{
  NSUInteger i = 0;
  for (; allowedLength > 0; allowedLength--) {
    NSRange range = [text rangeOfComposedCharacterSequenceAtIndex:i];
    i = NSMaxRange(range);
  }
  return NSMakeRange(0, i);
}

- (UIView *)view
{
  RCTTextField *textField = [[RCTTextField alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
  textField.delegate = self;
  return textField;
}

- (BOOL)textField:(RCTTextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  // Only allow single keypresses for onKeyPress, pasted text will not be sent.
  if (textField.textWasPasted) {
    textField.textWasPasted = NO;
  } else {
    [textField sendKeyValueForString:string];
  }

  
  // "Marked text, which is part of multistage text input represents
  // provisionally inserted text the user has yet to confirm".
  // So it may be not appropriate to count them up until they have
  // been confirmed by user.
  if (textField.maxLength == nil ||
      textField.markedTextRange ||
      [string isEqualToString:@"\n"]) {  // Make sure forms can be submitted via return
    return YES;
  }
  
  NSUInteger allowedLength = textField.maxLength.integerValue - RCTApparentLengthOfText(textField.text) + RCTApparentLengthOfText([textField.text substringWithRange:range]);
  NSUInteger replacementTextLength = RCTApparentLengthOfText(string);
  
  if (replacementTextLength > allowedLength) {
    if (allowedLength > 0) {
      // Truncate the input string so the result is exactly maxLength
      NSRange allowedRange = RCTLimitedRangeOfText(string, allowedLength);
      NSString *limitedString = [string substringWithRange:allowedRange];
      NSMutableString *newString = textField.text.mutableCopy;
      [newString replaceCharactersInRange:range withString:limitedString];
      textField.text = newString;
      // Collapse selection at end of insert to match normal paste behavior
      RCTPlaceCaretAtOffset(textField, range.location + allowedRange.length);
      [textField textFieldDidChange];
    }
    return NO;
  }
  return YES;
}

// This method allows us to detect a `Backspace` keyPress
// even when there is no more text in the TextField
- (BOOL)keyboardInputShouldDelete:(RCTTextField *)textField
{
  [self textField:textField shouldChangeCharactersInRange:NSMakeRange(0, 0) replacementString:@""];
  return YES;
}

- (BOOL)textFieldShouldEndEditing:(RCTTextField *)textField
{
  return [textField textFieldShouldEndEditing:textField];
}

RCT_EXPORT_VIEW_PROPERTY(caretHidden, BOOL)
RCT_EXPORT_VIEW_PROPERTY(autoCorrect, BOOL)
RCT_REMAP_VIEW_PROPERTY(editable, enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
RCT_EXPORT_VIEW_PROPERTY(placeholderTextColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(text, NSString)
RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(clearButtonMode, UITextFieldViewMode)
RCT_REMAP_VIEW_PROPERTY(clearTextOnFocus, clearsOnBeginEditing, BOOL)
RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
RCT_EXPORT_VIEW_PROPERTY(keyboardAppearance, UIKeyboardAppearance)
RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(returnKeyType, UIReturnKeyType)
RCT_EXPORT_VIEW_PROPERTY(enablesReturnKeyAutomatically, BOOL)
RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
RCT_REMAP_VIEW_PROPERTY(password, secureTextEntry, BOOL) // backwards compatibility
RCT_REMAP_VIEW_PROPERTY(color, textColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(autoCapitalize, autocapitalizationType, UITextAutocapitalizationType)
RCT_REMAP_VIEW_PROPERTY(textAlign, textAlignment, NSTextAlignment)
RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, RCTTextField)
{
  view.font = [RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused RCTTextField)
{
  view.font = [RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused RCTTextField)
{
  view.font = [RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, RCTTextField)
{
  view.font = [RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}
RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;
  return ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTTextField *> *viewRegistry) {
    viewRegistry[reactTag].contentInset = padding;
  };
}

@end

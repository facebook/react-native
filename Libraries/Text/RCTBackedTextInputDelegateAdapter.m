/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBackedTextInputDelegateAdapter.h"

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

static void *TextFieldSelectionObservingContext = &TextFieldSelectionObservingContext;

@interface RCTBackedTextFieldDelegateAdapter () <UITextFieldDelegate>
@end

@implementation RCTBackedTextFieldDelegateAdapter {
  __weak UITextField<RCTBackedTextInputViewProtocol> *_backedTextInput;
  BOOL _textDidChangeIsComing;
  UITextRange *_previousSelectedTextRange;
}

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInput
{
  if (self = [super init]) {
    _backedTextInput = backedTextInput;
    backedTextInput.delegate = self;

    [_backedTextInput addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [_backedTextInput addTarget:self action:@selector(textFieldDidEndEditingOnExit) forControlEvents:UIControlEventEditingDidEndOnExit];
  }

  return self;
}

- (void)dealloc
{
  [_backedTextInput removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInput removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
}

#pragma mark - UITextFieldDelegate

- (BOOL)textFieldShouldBeginEditing:(__unused UITextField *)textField
{
  return [_backedTextInput.textInputDelegate textInputShouldBeginEditing];
}

- (void)textFieldDidBeginEditing:(__unused UITextField *)textField
{
  [_backedTextInput.textInputDelegate textInputDidBeginEditing];
}

- (BOOL)textFieldShouldEndEditing:(__unused UITextField *)textField
{
  return [_backedTextInput.textInputDelegate textInputShouldEndEditing];
}

- (void)textFieldDidEndEditing:(__unused UITextField *)textField
{
  if (_textDidChangeIsComing) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by losing focus. So, we call it manually.
    _textDidChangeIsComing = NO;
    [_backedTextInput.textInputDelegate textInputDidChange];
  }

  [_backedTextInput.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textField:(__unused UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  BOOL result = [_backedTextInput.textInputDelegate textInputShouldChangeTextInRange:range replacementText:string];
  if (result) {
    _textDidChangeIsComing = YES;
  }
  return result;
}

- (BOOL)textFieldShouldReturn:(__unused UITextField *)textField
{
  return [_backedTextInput.textInputDelegate textInputShouldReturn];
}

#pragma mark - UIControlEventEditing* Family Events

- (void)textFieldDidChange
{
  _textDidChangeIsComing = NO;
  [_backedTextInput.textInputDelegate textInputDidChange];

  // `selectedTextRangeWasSet` isn't triggered during typing.
  [self textFieldProbablyDidChangeSelection];
}

- (void)textFieldDidEndEditingOnExit
{
  [_backedTextInput.textInputDelegate textInputDidReturn];
}

#pragma mark - UIKeyboardInput (private UIKit protocol)

// This method allows us to detect a [Backspace] `keyPress`
// even when there is no more text in the `UITextField`.
- (BOOL)keyboardInputShouldDelete:(__unused UITextField *)textField
{
  [_backedTextInput.textInputDelegate textInputShouldChangeTextInRange:NSMakeRange(0, 0) replacementText:@""];
  return YES;
}

#pragma mark - Public Interface

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
{
  _previousSelectedTextRange = textRange;
}

- (void)selectedTextRangeWasSet
{
  [self textFieldProbablyDidChangeSelection];
}

#pragma mark - Generalization

- (void)textFieldProbablyDidChangeSelection
{
  if ([_backedTextInput.selectedTextRange isEqual:_previousSelectedTextRange]) {
    return;
  }

  _previousSelectedTextRange = _backedTextInput.selectedTextRange;
  [_backedTextInput.textInputDelegate textInputDidChangeSelection];
}

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation RCTBackedTextViewDelegateAdapter {
  __weak UITextView<RCTBackedTextInputViewProtocol> *_backedTextInput;
  BOOL _textDidChangeIsComing;
  UITextRange *_previousSelectedTextRange;
}

- (instancetype)initWithTextView:(UITextView<RCTBackedTextInputViewProtocol> *)backedTextInput
{
  if (self = [super init]) {
    _backedTextInput = backedTextInput;
    backedTextInput.delegate = self;
  }

  return self;
}

#pragma mark - UITextViewDelegate

- (BOOL)textViewShouldBeginEditing:(__unused UITextView *)textView
{
  return [_backedTextInput.textInputDelegate textInputShouldBeginEditing];
}

- (void)textViewDidBeginEditing:(__unused UITextView *)textView
{
  [_backedTextInput.textInputDelegate textInputDidBeginEditing];
}

- (BOOL)textViewShouldEndEditing:(__unused UITextView *)textView
{
  return [_backedTextInput.textInputDelegate textInputShouldEndEditing];
}

- (void)textViewDidEndEditing:(__unused UITextView *)textView
{
  if (_textDidChangeIsComing) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by losing focus. So, we call it manually.
    _textDidChangeIsComing = NO;
    [_backedTextInput.textInputDelegate textInputDidChange];
  }

  [_backedTextInput.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textView:(__unused UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  // Custom implementation of `textInputShouldReturn` and `textInputDidReturn` pair for `UITextView`.
  if (!_backedTextInput.textWasPasted && [text isEqualToString:@"\n"]) {
    if ([_backedTextInput.textInputDelegate textInputShouldReturn]) {
      [_backedTextInput.textInputDelegate textInputDidReturn];
      [_backedTextInput endEditing:NO];
      return NO;
    }
  }

  BOOL result = [_backedTextInput.textInputDelegate textInputShouldChangeTextInRange:range replacementText:text];
  if (result) {
    _textDidChangeIsComing = YES;
  }
  return result;
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  _textDidChangeIsComing = NO;
  [_backedTextInput.textInputDelegate textInputDidChange];
}

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  [self textViewProbablyDidChangeSelection];
}

#pragma mark - Public Interface

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
{
  _previousSelectedTextRange = textRange;
}

#pragma mark - Generalization

- (void)textViewProbablyDidChangeSelection
{
  if ([_backedTextInput.selectedTextRange isEqual:_previousSelectedTextRange]) {
    return;
  }

  _previousSelectedTextRange = _backedTextInput.selectedTextRange;
  [_backedTextInput.textInputDelegate textInputDidChangeSelection];
}

@end

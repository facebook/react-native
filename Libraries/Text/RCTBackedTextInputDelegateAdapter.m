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
  __unsafe_unretained UITextField<RCTBackedTextInputViewProtocol> *_unsafeBackedTextInput;
}

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInput
{
  if (self = [super init]) {
    _backedTextInput = backedTextInput;
    _unsafeBackedTextInput = backedTextInput;
    backedTextInput.delegate = self;

    [_backedTextInput addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [_backedTextInput addTarget:self action:@selector(textFieldDidEndEditingOnExit) forControlEvents:UIControlEventEditingDidEndOnExit];

    // We have to use `unsafe_unretained` pointer to `backedTextInput` for subscribing (and especially unsubscribing) for it
    // because `weak` pointers do not KVO complient, unfortunately.
    [_unsafeBackedTextInput addObserver:self forKeyPath:@"selectedTextRange" options:0 context:TextFieldSelectionObservingContext];
  }

  return self;
}

- (void)dealloc
{
  [_backedTextInput removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInput removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
  [_unsafeBackedTextInput removeObserver:self forKeyPath:@"selectedTextRange" context:TextFieldSelectionObservingContext];
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
  [_backedTextInput.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textField:(__unused UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  return [_backedTextInput.textInputDelegate textInputShouldChangeTextInRange:range replacementText:string];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
  return [_backedTextInput.textInputDelegate textInputShouldReturn];
}

#pragma mark - Key Value Observing

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(nullable id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if (context == TextFieldSelectionObservingContext) {
    if ([keyPath isEqualToString:@"selectedTextRange"]) {
      [_backedTextInput.textInputDelegate textInputDidChangeSelection];
    }

    return;
  }

  [super observeValueForKeyPath:keyPath
                       ofObject:object
                         change:change
                        context:context];
}

#pragma mark - UIControlEventEditing* Family Events

- (void)textFieldDidChange
{
  [_backedTextInput.textInputDelegate textInputDidChange];
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

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation RCTBackedTextViewDelegateAdapter {
  __weak UITextView<RCTBackedTextInputViewProtocol> *_backedTextInput;
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

  return [_backedTextInput.textInputDelegate textInputShouldChangeTextInRange:range replacementText:text];
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  [_backedTextInput.textInputDelegate textInputDidChange];
}

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  [_backedTextInput.textInputDelegate textInputDidChangeSelection];
}

@end

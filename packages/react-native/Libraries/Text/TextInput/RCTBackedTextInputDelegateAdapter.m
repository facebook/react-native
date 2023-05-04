/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputDelegateAdapter.h>

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

static void *TextFieldSelectionObservingContext = &TextFieldSelectionObservingContext;

@interface RCTBackedTextFieldDelegateAdapter () <UITextFieldDelegate>
@end

@implementation RCTBackedTextFieldDelegateAdapter {
  __weak UITextField<RCTBackedTextInputViewProtocol> *_backedTextInputView;
  BOOL _textDidChangeIsComing;
  UITextRange *_previousSelectedTextRange;
}

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;

    [_backedTextInputView addTarget:self
                             action:@selector(textFieldDidChange)
                   forControlEvents:UIControlEventEditingChanged];
    [_backedTextInputView addTarget:self
                             action:@selector(textFieldDidEndEditingOnExit)
                   forControlEvents:UIControlEventEditingDidEndOnExit];
  }

  return self;
}

- (void)dealloc
{
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
}

#pragma mark - UITextFieldDelegate

- (BOOL)textFieldShouldBeginEditing:(__unused UITextField *)textField
{
  return [_backedTextInputView.textInputDelegate textInputShouldBeginEditing];
}

- (void)textFieldDidBeginEditing:(__unused UITextField *)textField
{
  [_backedTextInputView.textInputDelegate textInputDidBeginEditing];
}

- (BOOL)textFieldShouldEndEditing:(__unused UITextField *)textField
{
  return [_backedTextInputView.textInputDelegate textInputShouldEndEditing];
}

- (void)textFieldDidEndEditing:(__unused UITextField *)textField
{
  if (_textDidChangeIsComing) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by losing focus. So, we call it manually.
    _textDidChangeIsComing = NO;
    [_backedTextInputView.textInputDelegate textInputDidChange];
  }

  [_backedTextInputView.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textField:(__unused UITextField *)textField
    shouldChangeCharactersInRange:(NSRange)range
                replacementString:(NSString *)string
{
  NSString *newText = [_backedTextInputView.textInputDelegate textInputShouldChangeText:string inRange:range];

  if (newText == nil) {
    return NO;
  }

  if ([newText isEqualToString:string]) {
    _textDidChangeIsComing = YES;
    return YES;
  }

  NSMutableAttributedString *attributedString = [_backedTextInputView.attributedText mutableCopy];
  [attributedString replaceCharactersInRange:range withString:newText];
  [_backedTextInputView setAttributedText:[attributedString copy]];

  // Setting selection to the end of the replaced text.
  UITextPosition *position = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                 offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];

  [self textFieldDidChange];

  return NO;
}

- (BOOL)textFieldShouldReturn:(__unused UITextField *)textField
{
  // Ignore the value of whether we submitted; just make sure the submit event is called if necessary.
  [_backedTextInputView.textInputDelegate textInputShouldSubmitOnReturn];
  return [_backedTextInputView.textInputDelegate textInputShouldReturn];
}

#pragma mark - UIControlEventEditing* Family Events

- (void)textFieldDidChange
{
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];

  // `selectedTextRangeWasSet` isn't triggered during typing.
  [self textFieldProbablyDidChangeSelection];
}

- (void)textFieldDidEndEditingOnExit
{
  [_backedTextInputView.textInputDelegate textInputDidReturn];
}

#pragma mark - UIKeyboardInput (private UIKit protocol)

// This method allows us to detect a [Backspace] `keyPress`
// even when there is no more text in the `UITextField`.
- (BOOL)keyboardInputShouldDelete:(__unused UITextField *)textField
{
  [_backedTextInputView.textInputDelegate textInputShouldChangeText:@"" inRange:NSMakeRange(0, 0)];
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
  if ([_backedTextInputView.selectedTextRange isEqual:_previousSelectedTextRange]) {
    return;
  }

  _previousSelectedTextRange = _backedTextInputView.selectedTextRange;
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation RCTBackedTextViewDelegateAdapter {
  __weak UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
  NSAttributedString *_lastStringStateWasUpdatedWith;
  BOOL _ignoreNextTextInputCall;
  BOOL _textDidChangeIsComing;
  UITextRange *_previousSelectedTextRange;
}

- (instancetype)initWithTextView:(UITextView<RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;
  }

  return self;
}

#pragma mark - UITextViewDelegate

- (BOOL)textViewShouldBeginEditing:(__unused UITextView *)textView
{
  return [_backedTextInputView.textInputDelegate textInputShouldBeginEditing];
}

- (void)textViewDidBeginEditing:(__unused UITextView *)textView
{
  [_backedTextInputView.textInputDelegate textInputDidBeginEditing];
}

- (BOOL)textViewShouldEndEditing:(__unused UITextView *)textView
{
  return [_backedTextInputView.textInputDelegate textInputShouldEndEditing];
}

- (void)textViewDidEndEditing:(__unused UITextView *)textView
{
  if (_textDidChangeIsComing) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by losing focus. So, we call it manually.
    _textDidChangeIsComing = NO;
    [_backedTextInputView.textInputDelegate textInputDidChange];
  }

  [_backedTextInputView.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textView:(__unused UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  // Custom implementation of `textInputShouldReturn` and `textInputDidReturn` pair for `UITextView`.
  if (!_backedTextInputView.textWasPasted && [text isEqualToString:@"\n"]) {
    const BOOL shouldSubmit = [_backedTextInputView.textInputDelegate textInputShouldSubmitOnReturn];
    const BOOL shouldReturn = [_backedTextInputView.textInputDelegate textInputShouldReturn];
    if (shouldReturn) {
      [_backedTextInputView.textInputDelegate textInputDidReturn];
      [_backedTextInputView endEditing:NO];
      return NO;
    } else if (shouldSubmit) {
      return NO;
    }
  }

  NSString *newText = [_backedTextInputView.textInputDelegate textInputShouldChangeText:text inRange:range];

  if (newText == nil) {
    return NO;
  }

  if ([newText isEqualToString:text]) {
    _textDidChangeIsComing = YES;
    return YES;
  }

  NSMutableAttributedString *attributedString = [_backedTextInputView.attributedText mutableCopy];
  [attributedString replaceCharactersInRange:range withString:newText];
  [_backedTextInputView setAttributedText:[attributedString copy]];

  // Setting selection to the end of the replaced text.
  UITextPosition *position = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                 offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];

  [self textViewDidChange:_backedTextInputView];

  return NO;
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  if (_ignoreNextTextInputCall) {
    _ignoreNextTextInputCall = NO;
    return;
  }
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];
}

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  if (_lastStringStateWasUpdatedWith && ![_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    [self textViewDidChange:_backedTextInputView];
    _ignoreNextTextInputCall = YES;
  }
  _lastStringStateWasUpdatedWith = _backedTextInputView.attributedText;
  [self textViewProbablyDidChangeSelection];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if ([_backedTextInputView.textInputDelegate respondsToSelector:@selector(scrollViewDidScroll:)]) {
    [_backedTextInputView.textInputDelegate scrollViewDidScroll:scrollView];
  }
}

#pragma mark - Public Interface

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
{
  _previousSelectedTextRange = textRange;
}

#pragma mark - Generalization

- (void)textViewProbablyDidChangeSelection
{
  if ([_backedTextInputView.selectedTextRange isEqual:_previousSelectedTextRange]) {
    return;
  }

  _previousSelectedTextRange = _backedTextInputView.selectedTextRange;
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end

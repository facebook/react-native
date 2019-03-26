/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackedTextInputDelegateAdapter.h"

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

static void *TextFieldSelectionObservingContext = &TextFieldSelectionObservingContext;

@interface RCTBackedTextFieldDelegateAdapter ()
#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
<UITextFieldDelegate>
#else
<RCTUITextFieldDelegate>
#endif // ]TODO(macOS ISS#2323203)

@end

@implementation RCTBackedTextFieldDelegateAdapter {
  __weak UITextField<RCTBackedTextInputViewProtocol> *_backedTextInputView;
  BOOL _textDidChangeIsComing;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UITextRange *_previousSelectedTextRange;
#else // [TODO(macOS ISS#2323203)
  NSRange _previousSelectedTextRange;
#endif // ]TODO(macOS ISS#2323203)
}

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    [_backedTextInputView addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [_backedTextInputView addTarget:self action:@selector(textFieldDidEndEditingOnExit) forControlEvents:UIControlEventEditingDidEndOnExit];
#endif // TODO(macOS ISS#2323203)
  }

  return self;
}

- (void)dealloc
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
#endif // TODO(macOS ISS#2323203)
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

- (BOOL)textField:(__unused UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  BOOL result = [_backedTextInputView.textInputDelegate textInputShouldChangeTextInRange:range replacementText:string];
  if (result) {
    _textDidChangeIsComing = YES;
  }
  return result;
}

- (BOOL)textFieldShouldReturn:(__unused UITextField *)textField
{
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
  [_backedTextInputView.textInputDelegate textInputShouldChangeTextInRange:NSMakeRange(0, 0) replacementText:@""];
  return YES;
}

#pragma mark - Public Interface

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
#else // [TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange
#endif // ]TODO(macOS ISS#2323203)
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
  if (RCTTextSelectionEqual([_backedTextInputView selectedTextRange], _previousSelectedTextRange)) { // TODO(macOS ISS#2323203)
    return;
  }

  _previousSelectedTextRange = [_backedTextInputView selectedTextRange]; // TODO(OSS Candidate ISS#2710739) setter not defined for mac
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

#if TARGET_OS_OSX // TODO(macOS ISS#2323203)

#pragma mark - NSTextFieldDelegate

- (BOOL)control:(NSControl *)control textShouldEndEditing:(NSText *)fieldEditor
{
  return [self textFieldShouldEndEditing:_backedTextInputView];
}

- (BOOL)control:(NSControl *)control textView:(NSTextView *)fieldEditor doCommandBySelector:(SEL)commandSelector
{
  BOOL commandHandled = NO;
  // enter/return
  if (commandSelector == @selector(insertNewline:) || commandSelector == @selector(insertNewlineIgnoringFieldEditor:)) {
    [self textFieldDidEndEditingOnExit];
    commandHandled = YES;
    //backspace
  } else if (commandSelector == @selector(deleteBackward:)) {
    id<RCTBackedTextInputDelegate> textInputDelegate = [_backedTextInputView textInputDelegate];
    if (textInputDelegate != nil && ![textInputDelegate textInputShouldHandleDeleteBackward:_backedTextInputView]) {
      commandHandled = YES;
    } else {
      [self keyboardInputShouldDelete:_backedTextInputView];
    }
    //deleteForward
  } else if (commandSelector == @selector(deleteForward:)) {
    id<RCTBackedTextInputDelegate> textInputDelegate = [_backedTextInputView textInputDelegate];
    if (textInputDelegate != nil && ![textInputDelegate textInputShouldHandleDeleteForward:_backedTextInputView]) {
      commandHandled = YES;
    } else {
      [self keyboardInputShouldDelete:_backedTextInputView];
    }
    //paste
  } else if (commandSelector == @selector(paste:)) {
    _backedTextInputView.textWasPasted = YES;
  }
  return commandHandled;
}

- (void)textFieldBeginEditing:(NSTextField *)textField
{
  [self textFieldDidBeginEditing:_backedTextInputView];
}

- (void)textFieldDidChange:(NSTextField *)textField
{
  [self textFieldDidChange];
}

- (void)textFieldEndEditing:(NSTextField *)textField
{
  [self textFieldDidEndEditing:_backedTextInputView];
}

- (void)textFieldDidChangeSelection:(NSTextField *)textField
{
  [self selectedTextRangeWasSet];
}
#endif // ]TODO(macOS ISS#2323203)

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation RCTBackedTextViewDelegateAdapter {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  __weak UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#else // TODO(macOS ISS#2323203)
  __unsafe_unretained UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#endif // ]TODO(macOS ISS#2323203)
  BOOL _textDidChangeIsComing;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UITextRange *_previousSelectedTextRange;
#else // [TODO(macOS ISS#2323203)
  NSRange _previousSelectedTextRange;
#endif // ]TODO(macOS ISS#2323203)
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
    if ([_backedTextInputView.textInputDelegate textInputShouldReturn]) {
      [_backedTextInputView.textInputDelegate textInputDidReturn];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
      [_backedTextInputView endEditing:NO];
#else // [TODO(macOS ISS#2323203)
      [[_backedTextInputView window] endEditingFor:nil];
#endif // ]TODO(macOS ISS#2323203)
      return NO;
    }
  }

  BOOL result = [_backedTextInputView.textInputDelegate textInputShouldChangeTextInRange:range replacementText:text];
  if (result) {
    _textDidChangeIsComing = YES;
  }
  return result;
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  [self textViewProbablyDidChangeSelection];
}

#endif // [TODO(macOS ISS#2323203)

#if TARGET_OS_OSX

#pragma mark - NSTextViewDelegate

- (BOOL)textView:(NSTextView *)textView shouldChangeTextInRange:(NSRange)affectedCharRange replacementString:(nullable NSString *)replacementString
{
  return [self textView:textView shouldChangeTextInRange:affectedCharRange replacementText:replacementString];
}

- (void)textViewDidChangeSelection:(NSNotification *)notification
{
  [self textViewProbablyDidChangeSelection];
}

- (void)textDidBeginEditing:(NSNotification *)notification
{
  [self textViewDidBeginEditing:_backedTextInputView];
}

- (void)textDidChange:(NSNotification *)notification
{
  [self textViewDidChange:_backedTextInputView];
}

- (void)textDidEndEditing:(NSNotification *)notification
{
  [self textViewDidEndEditing:_backedTextInputView];
}

- (BOOL)textView:(NSTextView *)textView doCommandBySelector:(SEL)commandSelector
{
  BOOL commandHandled = NO;
  id<RCTBackedTextInputDelegate> textInputDelegate = [_backedTextInputView textInputDelegate];
  // enter/return
  if (textInputDelegate.textInputShouldReturn && (commandSelector == @selector(insertNewline:) || commandSelector == @selector(insertNewlineIgnoringFieldEditor:))) {
    [_backedTextInputView.window makeFirstResponder:nil];
    commandHandled = YES;
    //backspace
  } else if (commandSelector == @selector(deleteBackward:)) {
    commandHandled = textInputDelegate != nil && ![textInputDelegate textInputShouldHandleDeleteBackward:_backedTextInputView];
    //deleteForward
  } else if (commandSelector == @selector(deleteForward:)) {
    commandHandled = textInputDelegate != nil && ![textInputDelegate textInputShouldHandleDeleteForward:_backedTextInputView];
  }

  return commandHandled;
}

#endif // ]TODO(macOS ISS#2323203)

#pragma mark - Public Interface

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
#else // [TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange
#endif // ]TODO(macOS ISS#2323203)
{
  _previousSelectedTextRange = textRange;
}

#pragma mark - Generalization

- (void)textViewProbablyDidChangeSelection
{
  if (RCTTextSelectionEqual([_backedTextInputView selectedTextRange], _previousSelectedTextRange)) { // TODO(macOS ISS#2323203)
    return;
  }

  _previousSelectedTextRange = [_backedTextInputView selectedTextRange]; // TODO(OSS Candidate ISS#2710739) setter not defined for mac
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end

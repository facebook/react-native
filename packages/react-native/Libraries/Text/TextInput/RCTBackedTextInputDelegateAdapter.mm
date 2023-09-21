/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import "RCTBackedTextInputViewProtocol.h" // [macOS
#import "RCTBackedTextInputDelegate.h"
#import "../RCTTextUIKit.h" // macOS]

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

static void *TextFieldSelectionObservingContext = &TextFieldSelectionObservingContext;

@interface RCTBackedTextFieldDelegateAdapter ()
#if !TARGET_OS_OSX // [macOS]
<UITextFieldDelegate>
#else // [macOS
<RCTUITextFieldDelegate>
#endif // macOS]

@end

@implementation RCTBackedTextFieldDelegateAdapter {
  __weak UITextField<RCTBackedTextInputViewProtocol> *_backedTextInputView;
  BOOL _textDidChangeIsComing;
#if !TARGET_OS_OSX // [macOS]
  UITextRange *_previousSelectedTextRange;
#else // [macOS
  NSRange _previousSelectedTextRange;
#endif // macOS]
}

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;

#if !TARGET_OS_OSX // [macOS]
    [_backedTextInputView addTarget:self
                             action:@selector(textFieldDidChange)
                   forControlEvents:UIControlEventEditingChanged];
    [_backedTextInputView addTarget:self
                             action:@selector(textFieldDidEndEditingOnExit)
                   forControlEvents:UIControlEventEditingDidEndOnExit];
#endif // [macOS]
  }

  return self;
}

- (void)dealloc
{
#if !TARGET_OS_OSX // [macOS]
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
#endif // [macOS]
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

#if !TARGET_OS_OSX // [macOS]
  // Setting selection to the end of the replaced text.
  UITextPosition *position = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                 offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];

#endif // [macOS]
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

#if !TARGET_OS_OSX // [macOS]
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
#else // [macOS
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange
#endif // macOS]
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
  if (RCTTextSelectionEqual([_backedTextInputView selectedTextRange], _previousSelectedTextRange)) { // [macOS]
    return;
  }

  _previousSelectedTextRange = [_backedTextInputView selectedTextRange]; // [macOS] setter not defined for mac
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

#if TARGET_OS_OSX // [macOS

#pragma mark - NSTextFieldDelegate

- (BOOL)control:(NSControl *)control textShouldEndEditing:(NSText *)fieldEditor
{
  return [self textFieldShouldEndEditing:_backedTextInputView];
}

- (BOOL)control:(NSControl *)control textView:(NSTextView *)fieldEditor doCommandBySelector:(SEL)commandSelector
{
  id<RCTBackedTextInputDelegate> textInputDelegate = [_backedTextInputView textInputDelegate];
  BOOL commandHandled = NO;
  // enter/return
  if (commandSelector == @selector(insertNewline:) || commandSelector == @selector(insertNewlineIgnoringFieldEditor:)) {
    [self textFieldDidEndEditingOnExit];
    if ([textInputDelegate textInputShouldSubmitOnReturn]) {
      [[_backedTextInputView window] makeFirstResponder:nil];
    }
    commandHandled = YES;
    //backspace
  } else if (commandSelector == @selector(deleteBackward:)) {
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
    id<RCTBackedTextInputDelegate> textInputDelegate = [_backedTextInputView textInputDelegate];
    if (textInputDelegate != nil && ![textInputDelegate textInputShouldHandlePaste:_backedTextInputView]) {
      commandHandled = YES;
    } else {
      _backedTextInputView.textWasPasted = YES;
    }
    //escape
  } else if (commandSelector == @selector(cancelOperation:)) {
    [textInputDelegate textInputDidCancel];
    if (![textInputDelegate hasValidKeyDownOrValidKeyUp:@"Escape"]) {
      [[_backedTextInputView window] makeFirstResponder:nil];
    }
    commandHandled = YES;
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
#endif // macOS]

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation RCTBackedTextViewDelegateAdapter {
#if !TARGET_OS_OSX // [macOS]
  __weak UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#else // [macOS
  __unsafe_unretained UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#endif // macOS]
  NSAttributedString *_lastStringStateWasUpdatedWith;
  BOOL _ignoreNextTextInputCall;
  BOOL _textDidChangeIsComing;
#if !TARGET_OS_OSX // [macOS]
  UITextRange *_previousSelectedTextRange;
#else // [macOS
  NSRange _previousSelectedTextRange;
  NSUndoManager *_undoManager;
#endif // macOS]
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
#if !TARGET_OS_OSX // [macOS]
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
#endif // [macOS]

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

#if !TARGET_OS_OSX // [macOS]
  // Setting selection to the end of the replaced text.
  UITextPosition *position = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                 offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];
#endif // [macOS]

  [self textViewDidChange:_backedTextInputView];

  return NO;
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  if (_ignoreNextTextInputCall && [_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    _ignoreNextTextInputCall = NO;
    return;
  }
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];
}

#if !TARGET_OS_OSX // [macOS]

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  if (_lastStringStateWasUpdatedWith && ![_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    [self textViewDidChange:_backedTextInputView];

    if (![_backedTextInputView isGhostTextChanging]) { // [macOS]
      _ignoreNextTextInputCall = YES;
    } // [macOS]
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

#endif // [macOS]

#if TARGET_OS_OSX // [macOS

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
  if ((commandSelector == @selector(insertNewline:) || commandSelector == @selector(insertNewlineIgnoringFieldEditor:))) {
    if ([textInputDelegate textInputShouldSubmitOnReturn]) {
      [_backedTextInputView.window makeFirstResponder:nil];
      commandHandled = YES;
    }
    //backspace
  } else if (commandSelector == @selector(deleteBackward:)) {
    commandHandled = textInputDelegate != nil && ![textInputDelegate textInputShouldHandleDeleteBackward:_backedTextInputView];
    //deleteForward
  } else if (commandSelector == @selector(deleteForward:)) {
    commandHandled = textInputDelegate != nil && ![textInputDelegate textInputShouldHandleDeleteForward:_backedTextInputView];
    //escape
  } else if (commandSelector == @selector(cancelOperation:)) {
    [textInputDelegate textInputDidCancel];
    if (![textInputDelegate hasValidKeyDownOrValidKeyUp:@"Escape"]) {
      [[_backedTextInputView window] makeFirstResponder:nil];
    }
    commandHandled = YES;
    
  }

  return commandHandled;
}

- (NSUndoManager *)undoManagerForTextView:(NSTextView *)textView {
  if (!_undoManager) {
    _undoManager = [NSUndoManager new];
  }
  return _undoManager;
}

#endif // macOS]

#pragma mark - Public Interface

#if !TARGET_OS_OSX // [macOS]
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
#else // [macOS
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange
#endif // macOS]
{
  _previousSelectedTextRange = textRange;
}

#pragma mark - Generalization

- (void)textViewProbablyDidChangeSelection
{
  if (RCTTextSelectionEqual([_backedTextInputView selectedTextRange], _previousSelectedTextRange)) { // [macOS]
    return;
  }

  _previousSelectedTextRange = [_backedTextInputView selectedTextRange]; // [macOS]
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end

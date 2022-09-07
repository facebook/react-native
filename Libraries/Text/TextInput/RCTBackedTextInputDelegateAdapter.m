/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import "RCTBackedTextInputViewProtocol.h" // TODO(OSS Candidate ISS#2710739)
#import "RCTBackedTextInputDelegate.h" // TODO(OSS Candidate ISS#2710739)
#import "../RCTTextUIKit.h" // TODO(macOS GH#774)

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

static void *TextFieldSelectionObservingContext = &TextFieldSelectionObservingContext;

@interface RCTBackedTextFieldDelegateAdapter ()
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
<UITextFieldDelegate>
#else
<RCTUITextFieldDelegate>
#endif // ]TODO(macOS GH#774)

@end

@implementation RCTBackedTextFieldDelegateAdapter {
  __weak UITextField<RCTBackedTextInputViewProtocol> *_backedTextInputView;
  BOOL _textDidChangeIsComing;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UITextRange *_previousSelectedTextRange;
#else // [TODO(macOS GH#774)
  NSRange _previousSelectedTextRange;
#endif // ]TODO(macOS GH#774)
}

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
    [_backedTextInputView addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [_backedTextInputView addTarget:self action:@selector(textFieldDidEndEditingOnExit) forControlEvents:UIControlEventEditingDidEndOnExit];
#endif // TODO(macOS GH#774)
  }

  return self;
}

- (void)dealloc
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
#endif // TODO(macOS GH#774)
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
  NSString *newText =
    [_backedTextInputView.textInputDelegate textInputShouldChangeText:string inRange:range];

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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  // Setting selection to the end of the replaced text.
  UITextPosition *position =
    [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                        offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];

#endif // TODO(macOS GH#774)
  [self textFieldDidChange];

  return NO;
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
  [_backedTextInputView.textInputDelegate textInputShouldChangeText:@"" inRange:NSMakeRange(0, 0)];
  return YES;
}

#pragma mark - Public Interface

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
#else // [TODO(macOS GH#774)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange
#endif // ]TODO(macOS GH#774)
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
  if (RCTTextSelectionEqual([_backedTextInputView selectedTextRange], _previousSelectedTextRange)) { // TODO(macOS GH#774)
    return;
  }

  _previousSelectedTextRange = [_backedTextInputView selectedTextRange]; // TODO(OSS Candidate ISS#2710739) setter not defined for mac
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

#if TARGET_OS_OSX // TODO(macOS GH#774)

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
    if ([textInputDelegate textInputShouldReturn]) {
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
    _backedTextInputView.textWasPasted = YES;
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
#endif // ]TODO(macOS GH#774)

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation RCTBackedTextViewDelegateAdapter {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  __weak UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#else // TODO(macOS GH#774)
  __unsafe_unretained UITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#endif // ]TODO(macOS GH#774)
  BOOL _textDidChangeIsComing;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UITextRange *_previousSelectedTextRange;
#else // [TODO(macOS GH#774)
  NSRange _previousSelectedTextRange;
  NSUndoManager *_undoManager;
#endif // ]TODO(macOS GH#774)
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
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  // Custom implementation of `textInputShouldReturn` and `textInputDidReturn` pair for `UITextView`.
  if (!_backedTextInputView.textWasPasted && [text isEqualToString:@"\n"]) {
    if ([_backedTextInputView.textInputDelegate textInputShouldReturn]) {
      [_backedTextInputView.textInputDelegate textInputDidReturn];
      [_backedTextInputView endEditing:NO];
      return NO;
    }
  }
#endif // ]TODO(macOS GH#774)

  NSString *newText =
    [_backedTextInputView.textInputDelegate textInputShouldChangeText:text inRange:range];

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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  // Setting selection to the end of the replaced text.
  UITextPosition *position =
    [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                        offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];
#endif // TODO(macOS GH#774)

  [self textViewDidChange:_backedTextInputView];

  return NO;
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  [self textViewProbablyDidChangeSelection];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if ([_backedTextInputView.textInputDelegate respondsToSelector:@selector(scrollViewDidScroll:)]) {
    [_backedTextInputView.textInputDelegate scrollViewDidScroll:scrollView];
  }
}

#endif // [TODO(macOS GH#774)

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
  if ((commandSelector == @selector(insertNewline:) || commandSelector == @selector(insertNewlineIgnoringFieldEditor:))) {
    if (textInputDelegate.textInputShouldReturn) {
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

#endif // ]TODO(macOS GH#774)

#pragma mark - Public Interface

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
#else // [TODO(macOS GH#774)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange
#endif // ]TODO(macOS GH#774)
{
  _previousSelectedTextRange = textRange;
}

#pragma mark - Generalization

- (void)textViewProbablyDidChangeSelection
{
  if (RCTTextSelectionEqual([_backedTextInputView selectedTextRange], _previousSelectedTextRange)) { // TODO(macOS GH#774)
    return;
  }

  _previousSelectedTextRange = [_backedTextInputView selectedTextRange]; // TODO(OSS Candidate ISS#2710739) setter not defined for mac
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end

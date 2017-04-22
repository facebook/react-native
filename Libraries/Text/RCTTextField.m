/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextField.h"

#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import "RCTTextSelection.h"

@interface RCTTextField()

- (BOOL)shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string;
- (BOOL)keyboardInputShouldDelete;
- (BOOL)textFieldShouldEndEditing;

@end

@interface RCTTextFieldDelegateProxy: NSObject <UITextFieldDelegate>
@end

@implementation RCTTextFieldDelegateProxy

- (BOOL)textField:(RCTTextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  return [textField shouldChangeCharactersInRange:range replacementString:string];
}

- (BOOL)keyboardInputShouldDelete:(RCTTextField *)textField
{
  return [textField keyboardInputShouldDelete];
}

- (BOOL)textFieldShouldEndEditing:(RCTTextField *)textField {
  return [textField textFieldShouldEndEditing];
}

@end

@implementation RCTTextField
{
  RCTEventDispatcher *_eventDispatcher;
  NSInteger _nativeEventCount;
  BOOL _submitted;
  UITextRange *_previousSelectionRange;
  BOOL _textWasPasted;
  NSString *_finalText;
  RCTTextFieldDelegateProxy *_delegateProxy;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    RCTAssert(eventDispatcher, @"eventDispatcher is a required parameter");
    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [self addTarget:self action:@selector(textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    [self addObserver:self forKeyPath:@"selectedTextRange" options:0 context:nil];
    _blurOnSubmit = YES;

    // We cannot use `self.delegate = self;` here because `UITextField` implements some of these delegate methods itself,
    // so if we implement this delegate on self, we will override some of its behaviours.
    _delegateProxy = [RCTTextFieldDelegateProxy new];
    self.delegate = _delegateProxy;
  }
  return self;
}

- (void)dealloc
{
  [self removeObserver:self forKeyPath:@"selectedTextRange"];
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)sendKeyValueForString:(NSString *)string
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeKeyPress
                                 reactTag:self.reactTag
                                     text:nil
                                      key:string
                               eventCount:_nativeEventCount];
}

// This method is overridden for `onKeyPress`. The manager
// will not send a keyPress for text that was pasted.
- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}

- (void)setSelection:(RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  UITextRange *currentSelection = self.selectedTextRange;
  UITextPosition *start = [self positionFromPosition:self.beginningOfDocument offset:selection.start];
  UITextPosition *end = [self positionFromPosition:self.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [self textRangeFromPosition:start toPosition:end];

  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![currentSelection isEqual:selectedTextRange]) {
    _previousSelectionRange = selectedTextRange;
    self.selectedTextRange = selectedTextRange;
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:self.text]) {
    UITextRange *selection = self.selectedTextRange;
    NSInteger oldTextLength = self.text.length;

    super.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger offsetStart = [self offsetFromPosition:self.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [self positionFromPosition:self.beginningOfDocument offset:newOffset];
      self.selectedTextRange = [self textRangeFromPosition:position toPosition:position];
    }
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

static void RCTUpdatePlaceholder(RCTTextField *self)
{
  if (self.placeholder.length > 0 && self.placeholderTextColor) {
    self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder
                                                                 attributes:@{
                                                                              NSForegroundColorAttributeName : self.placeholderTextColor
                                                                              }];
  } else if (self.placeholder.length) {
    self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder];
  }
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  _placeholderTextColor = placeholderTextColor;
  RCTUpdatePlaceholder(self);
}

- (void)setPlaceholder:(NSString *)placeholder
{
  super.placeholder = placeholder;
  RCTUpdatePlaceholder(self);
}

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }
  return [super caretRectForPosition:position];
}

- (CGRect)textRectForBounds:(CGRect)bounds
{
  CGRect rect = [super textRectForBounds:bounds];
  return UIEdgeInsetsInsetRect(rect, _contentInset);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

- (void)textFieldDidChange
{
  _nativeEventCount++;
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeChange
                                 reactTag:self.reactTag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];

  // selectedTextRange observer isn't triggered when you type even though the
  // cursor position moves, so we send event again here.
  [self sendSelectionEvent];
}

- (void)textFieldEndEditing
{
  if (![_finalText isEqualToString:self.text]) {
    _finalText = nil;
    // iOS does't send event `UIControlEventEditingChanged` if the change was happened because of autocorrection
    // which was triggered by loosing focus. We assume that if `text` was changed in the middle of loosing focus process,
    // we did not receive that event. So, we call `textFieldDidChange` manually.
    [self textFieldDidChange];
  }

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textFieldSubmitEditing
{
  _submitted = YES;
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeSubmit
                                 reactTag:self.reactTag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textFieldBeginEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_selectTextOnFocus) {
      [self selectAll:nil];
    }

    [self sendSelectionEvent];
  });
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(RCTTextField *)textField
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if ([keyPath isEqualToString:@"selectedTextRange"]) {
    [self sendSelectionEvent];
  }
}

- (void)sendSelectionEvent
{
  if (_onSelectionChange &&
      self.selectedTextRange != _previousSelectionRange &&
      ![self.selectedTextRange isEqual:_previousSelectionRange]) {

    _previousSelectionRange = self.selectedTextRange;

    UITextRange *selection = self.selectedTextRange;
    NSInteger start = [self offsetFromPosition:[self beginningOfDocument] toPosition:selection.start];
    NSInteger end = [self offsetFromPosition:[self beginningOfDocument] toPosition:selection.end];
    _onSelectionChange(@{
      @"selection": @{
        @"start": @(start),
        @"end": @(end),
      },
    });
  }
}

- (BOOL)resignFirstResponder
{
  BOOL result = [super resignFirstResponder];
  if (result)
  {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                   reactTag:self.reactTag
                                       text:self.text
                                        key:nil
                                 eventCount:_nativeEventCount];
  }
  return result;
}

- (void)didMoveToWindow
{
  [self reactFocusIfNeeded];
}

#pragma mark - UITextFieldDelegate (Proxied)

- (BOOL)shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  // Only allow single keypresses for `onKeyPress`, pasted text will not be sent.
  if (_textWasPasted) {
    _textWasPasted = NO;
  } else {
    [self sendKeyValueForString:string];
  }

  if (_maxLength != nil && ![string isEqualToString:@"\n"]) { // Make sure forms can be submitted via return.
    NSUInteger allowedLength = _maxLength.integerValue - MIN(_maxLength.integerValue, self.text.length) + range.length;
    if (string.length > allowedLength) {
      if (string.length > 1) {
        // Truncate the input string so the result is exactly `maxLength`.
        NSString *limitedString = [string substringToIndex:allowedLength];
        NSMutableString *newString = self.text.mutableCopy;
        [newString replaceCharactersInRange:range withString:limitedString];
        self.text = newString;

        // Collapse selection at end of insert to match normal paste behavior.
        UITextPosition *insertEnd = [self positionFromPosition:self.beginningOfDocument
                                                        offset:(range.location + allowedLength)];
        self.selectedTextRange = [self textRangeFromPosition:insertEnd toPosition:insertEnd];
        [self textFieldDidChange];
      }
      return NO;
    }
  }

  return YES;
}

// This method allows us to detect a `Backspace` keyPress
// even when there is no more text in the TextField.
- (BOOL)keyboardInputShouldDelete
{
  [self shouldChangeCharactersInRange:NSMakeRange(0, 0) replacementString:@""];
  return YES;
}

- (BOOL)textFieldShouldEndEditing
{
  _finalText = self.text;

  if (_submitted) {
    _submitted = NO;
    return _blurOnSubmit;
  }

  return YES;
}

@end

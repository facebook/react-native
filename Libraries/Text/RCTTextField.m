/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextField.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import "RCTBackedTextInputDelegate.h"
#import "RCTTextSelection.h"
#import "RCTUITextField.h"

@interface RCTTextField () <RCTBackedTextInputDelegate>

@end

@implementation RCTTextField
{
  RCTUITextField *_backedTextInput;
  BOOL _submitted;
  NSString *_finalText;
  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    RCTAssertParam(bridge);

    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    _blurOnSubmit = YES;

    _backedTextInput = [[RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInput.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInput.textInputDelegate = self;

    [self addSubview:_backedTextInput];
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInput;
}

- (void)sendKeyValueForString:(NSString *)string
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeKeyPress
                                 reactTag:self.reactTag
                                     text:nil
                                      key:string
                               eventCount:_nativeEventCount];
}

#pragma mark - Properties

- (NSString *)text
{
  return _backedTextInput.text;
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:self.text]) {
    UITextRange *selection = _backedTextInput.selectedTextRange;
    NSInteger oldTextLength = _backedTextInput.text.length;

    _backedTextInput.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger offsetStart = [_backedTextInput offsetFromPosition:_backedTextInput.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument offset:newOffset];
      _backedTextInput.selectedTextRange = [_backedTextInput textRangeFromPosition:position toPosition:position];
    }
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", _backedTextInput.text, eventLag);
  }
}

#pragma mark - Events

- (void)sendSelectionEvent
{
  if (_onSelectionChange &&
      _backedTextInput.selectedTextRange != _previousSelectionRange &&
      ![_backedTextInput.selectedTextRange isEqual:_previousSelectionRange]) {

    _previousSelectionRange = _backedTextInput.selectedTextRange;

    UITextRange *selection = _backedTextInput.selectedTextRange;
    NSInteger start = [_backedTextInput offsetFromPosition:[_backedTextInput beginningOfDocument] toPosition:selection.start];
    NSInteger end = [_backedTextInput offsetFromPosition:[_backedTextInput beginningOfDocument] toPosition:selection.end];
    _onSelectionChange(@{
      @"selection": @{
        @"start": @(start),
        @"end": @(end),
      },
    });
  }
}

#pragma mark - RCTBackedTextInputDelegate

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)string
{
  // Only allow single keypresses for `onKeyPress`, pasted text will not be sent.
  if (!_backedTextInput.textWasPasted) {
    [self sendKeyValueForString:string];
  }

  if (_maxLength != nil && ![string isEqualToString:@"\n"]) { // Make sure forms can be submitted via return.
    NSUInteger allowedLength = _maxLength.integerValue - MIN(_maxLength.integerValue, _backedTextInput.text.length) + range.length;
    if (string.length > allowedLength) {
      if (string.length > 1) {
        // Truncate the input string so the result is exactly `maxLength`.
        NSString *limitedString = [string substringToIndex:allowedLength];
        NSMutableString *newString = _backedTextInput.text.mutableCopy;
        [newString replaceCharactersInRange:range withString:limitedString];
        _backedTextInput.text = newString;

        // Collapse selection at end of insert to match normal paste behavior.
        UITextPosition *insertEnd = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument
                                                              offset:(range.location + allowedLength)];
        _backedTextInput.selectedTextRange = [_backedTextInput textRangeFromPosition:insertEnd toPosition:insertEnd];
        [self textInputDidChange];
      }
      return NO;
    }
  }

  return YES;
}

- (void)textInputDidChange
{
  _nativeEventCount++;
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeChange
                                 reactTag:self.reactTag
                                     text:_backedTextInput.text
                                      key:nil
                               eventCount:_nativeEventCount];

  // selectedTextRange observer isn't triggered when you type even though the
  // cursor position moves, so we send event again here.
  [self sendSelectionEvent];
}

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:_backedTextInput.text
                                      key:nil
                               eventCount:_nativeEventCount];

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_selectTextOnFocus) {
      [self->_backedTextInput selectAll:nil];
    }

    [self sendSelectionEvent];
  });
}

- (BOOL)textInputShouldEndEditing
{
  _finalText = _backedTextInput.text;

  if (_submitted) {
    _submitted = NO;
    return _blurOnSubmit;
  }

  return YES;
}

- (void)textInputDidEndEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                 reactTag:self.reactTag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];

  if (![_finalText isEqualToString:_backedTextInput.text]) {
    _finalText = nil;
    // iOS does't send event `UIControlEventEditingChanged` if the change was happened because of autocorrection
    // which was triggered by loosing focus. We assume that if `text` was changed in the middle of loosing focus process,
    // we did not receive that event. So, we call `textFieldDidChange` manually.
    [self textInputDidChange];
  }

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:_backedTextInput.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textInputDidEndEditingOnExit
{
  _submitted = YES;
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeSubmit
                                 reactTag:self.reactTag
                                     text:_backedTextInput.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textInputDidChangeSelection
{
  [self sendSelectionEvent];
}

@end

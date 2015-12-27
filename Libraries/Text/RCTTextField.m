/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextField.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTTextField
{
  RCTEventDispatcher *_eventDispatcher;
  NSMutableArray<UIView *> *_reactSubviews;
  BOOL _jsRequestingFirstResponder;
  NSInteger _nativeEventCount;
  BOOL _submitted;
  UITextRange *_previousSelectionRange;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    RCTAssert(eventDispatcher, @"eventDispatcher is a required parameter");
    _eventDispatcher = eventDispatcher;
    _previousSelectionRange = self.selectedTextRange;
    [self addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [self addTarget:self action:@selector(textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    [self addObserver:self forKeyPath:@"selectedTextRange" options:0 context:nil];
    _reactSubviews = [NSMutableArray new];
    _blurOnSubmit = YES;
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

- (NSArray<UIView *> *)reactSubviews
{
  // TODO: do we support subviews of textfield in React?
  // In any case, we should have a better approach than manually
  // maintaining array in each view subclass like this
  return _reactSubviews;
}

- (void)removeReactSubview:(UIView *)subview
{
  // TODO: this is a bit broken - if the TextField inserts any of
  // its own views below or between React's, the indices won't match
  [_reactSubviews removeObject:subview];
  [subview removeFromSuperview];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // TODO: this is a bit broken - if the TextField inserts any of
  // its own views below or between React's, the indices won't match
  [_reactSubviews insertObject:view atIndex:atIndex];
  [super insertSubview:view atIndex:atIndex];
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

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  self.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return self.autocorrectionType == UITextAutocorrectionTypeYes;
}

- (void)textFieldDidChange
{
  // Code in `-textField:shouldChangeCharactersInRange:replacementString` could handle most of
  // cases. But there are exceptions. For instance, multistage input like Hanzi(Chinese),
  // won't trigger `-textField:shouldChangeCharactersInRange:replacementString` when users
  // confirm the marked text they have input by tapping the candidate bar of the keyboard. In
  // these cases, truncating input string should happen in `-textFieldDidChange`.
  // As we have done in `-textField:shouldChangeCharactersInRange:replacementString`, we won't
  // do anything when `markedTextRange` is not nil, which means users have not confirmed
  // what text to input.
  if (!self.markedTextRange) {
    UITextRange *selectedRange = self.selectedTextRange;
    // It seems that it's impossible to have a textField which has some text selected after
    // its text have just changed, unless we set it programmatically.
    if (self.maxLength && selectedRange && selectedRange.isEmpty) {
      __block NSInteger exceededLength = [self _apparentLengthOfText:self.text] - self.maxLength.integerValue;
      if (exceededLength > 0) {
        UITextRange *textRange = [self textRangeFromPosition:self.beginningOfDocument toPosition:selectedRange.end];
        NSString *text = [self textInRange:textRange];
        __block NSRange rangeToRemove;
        [text enumerateSubstringsInRange:NSMakeRange(0, text.length) options:NSStringEnumerationByComposedCharacterSequences|NSStringEnumerationReverse usingBlock:^(NSString *substring, NSRange substringRange, NSRange enclosingRange, BOOL *stop) {
          exceededLength--;
          if (exceededLength == 0) {
            rangeToRemove.location = substringRange.location;
            rangeToRemove.length = text.length - substringRange.location;
            *stop = YES;
          }
        }];
        
        NSMutableString *newString = [self.text mutableCopy];
        [newString replaceCharactersInRange:rangeToRemove withString:@""];
        
        // It's a workaround to set text without considering the event lag. Because when multistage input
        // has been confirmed, `-textFieldDidChange` will be triggered serveral times in succession,
        // with the same text. The only difference is that the `markedTextRange` is nil the last
        // time. `-setText:` will fail because the native event count will increase 2 or more instantaneously
        // and JS code cannot catch up. So we have to resort to call super's `-setText:`.
        super.text = newString;
        [self _textInput:self placeCaretAtOffset:rangeToRemove.location];
      }
    }
    
  }

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
  if (_selectTextOnFocus) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self selectAll:nil];
    });
  }
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (BOOL)textFieldShouldEndEditing:(RCTTextField *)textField
{
  if (_submitted) {
    _submitted = NO;
    return _blurOnSubmit;
  }
  return YES;
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

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (void)reactWillMakeFirstResponder
{
  _jsRequestingFirstResponder = YES;
}

- (void)reactDidMakeFirstResponder
{
  _jsRequestingFirstResponder = NO;
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

- (void)_textInput:(id<UITextInput>)textInput placeCaretAtOffset:(NSUInteger)offset
{
  UITextPosition *insertEnd = [textInput positionFromPosition:textInput.beginningOfDocument
                                                       offset:offset];
  textInput.selectedTextRange = [textInput textRangeFromPosition:insertEnd toPosition:insertEnd];
}

- (NSUInteger)_apparentLengthOfText:(NSString *)text
{
  // Composed character sequences like surrogate-pair('é'), emoiji('😛'), etc., are treated
  // as one symbol, as we human would count.
  __block NSUInteger length = 0;
  [text enumerateSubstringsInRange:NSMakeRange(0, text.length) options:NSStringEnumerationByComposedCharacterSequences usingBlock:^(NSString *substring, NSRange substringRange, NSRange enclosingRange, BOOL *stop) {
    length++;
  }];
  return length;
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextView.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTTextView
{
  RCTEventDispatcher *_eventDispatcher;
  BOOL _jsRequestingFirstResponder;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {

    _eventDispatcher = eventDispatcher;

    [self.notificationCenter addObserver:self
                                selector:@selector(_textViewBeginEditing)
                                    name:UITextViewTextDidBeginEditingNotification
                                  object:self];

    [self.notificationCenter addObserver:self
                                selector:@selector(_textViewDidChange)
                                   name:UITextViewTextDidChangeNotification
                                 object:self];

    [self.notificationCenter addObserver:self
                                selector:@selector(_textViewEndEditing)
                                    name:UITextViewTextDidEndEditingNotification
                                  object:self];
  }
  return self;
}

- (void)setText:(NSString *)text
{
  if (![text isEqualToString:self.text]) {
    [super setText:text];
  }
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  self.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return self.autocorrectionType == UITextAutocorrectionTypeYes;
}

#define RCT_TEXT_EVENT_HANDLER(delegateMethod, eventName) \
- (void)delegateMethod                                    \
{                                                         \
  [_eventDispatcher sendTextEventWithType:eventName       \
                                 reactTag:self.reactTag   \
                                     text:self.text];     \
}

RCT_TEXT_EVENT_HANDLER(_textViewDidChange, RCTTextEventTypeChange)
RCT_TEXT_EVENT_HANDLER(_textViewEndEditing, RCTTextEventTypeEnd)

- (void)_textViewBeginEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:self.text];
}

- (BOOL)becomeFirstResponder
{
  _jsRequestingFirstResponder = YES;
  BOOL result = [super becomeFirstResponder];
  _jsRequestingFirstResponder = NO;
  return result;
}

- (BOOL)resignFirstResponder
{
  BOOL result = [super resignFirstResponder];
  if (result)
  {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                   reactTag:self.reactTag
                                       text:self.text];
  }
  return result;
}

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (NSNotificationCenter *)notificationCenter
{
  return [NSNotificationCenter defaultCenter];
}

- (void)dealloc
{
  [self.notificationCenter removeObserver:self];
}

@end

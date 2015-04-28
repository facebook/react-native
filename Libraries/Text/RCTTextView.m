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
  NSString *_placeholder;
  UITextView *_placeholderView;
  UITextView *_textView;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _contentInset = UIEdgeInsetsZero;
    _eventDispatcher = eventDispatcher;
    _placeholderTextColor = [self defaultPlaceholderTextColor];

    _textView = [[UITextView alloc] initWithFrame:self.bounds];
    _textView.backgroundColor = [UIColor clearColor];
    [self addSubview:_textView];
    [self subscribeToTextViewChanges];
  }

  return self;
}

- (void)subscribeToTextViewChanges
{
  [self.notificationCenter addObserver:self
                              selector:@selector(_textViewBeginEditing)
                                  name:UITextViewTextDidBeginEditingNotification
                                object:_textView];

  [self.notificationCenter addObserver:self
                              selector:@selector(_textViewDidChange)
                                 name:UITextViewTextDidChangeNotification
                               object:_textView];

  [self.notificationCenter addObserver:self
                              selector:@selector(_textViewEndEditing)
                                  name:UITextViewTextDidEndEditingNotification
                                object:_textView];
}

- (void)updateFrames
{
  // Adjust the insets so that they are as close as possible to single-line
  // RCTTextField defaults
  UIEdgeInsets adjustedInset = UIEdgeInsetsMake(_contentInset.top - 5, _contentInset.left - 4,
                                                _contentInset.bottom, _contentInset.right);

  [_textView setFrame:UIEdgeInsetsInsetRect(self.bounds, adjustedInset)];
  [_placeholderView setFrame:UIEdgeInsetsInsetRect(self.bounds, adjustedInset)];
}

- (void)setFont:(UIFont *)font
{
  _font = font;
  _textView.font = _font;
  [self _setupPlaceholder];
}

- (void)setTextColor:(UIColor *)textColor
{
  _textView.textColor = textColor;
}

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
  [self _setupPlaceholder];
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  if (placeholderTextColor) {
    _placeholderTextColor = placeholderTextColor;
  } else {
    _placeholderTextColor = [self defaultPlaceholderTextColor];
  }

  [self _setupPlaceholder];
}

- (void)_setupPlaceholder
{
  [_placeholderView removeFromSuperview];
  _placeholderView = nil;

  if (_placeholder) {
    _placeholderView = [[UITextView alloc] initWithFrame:self.bounds];
    _placeholderView.backgroundColor = [UIColor clearColor];
    _placeholderView.scrollEnabled = false;
    _placeholderView.attributedText = [[NSAttributedString alloc] initWithString:_placeholder
      attributes:@{ NSFontAttributeName : (_textView.font ? _textView.font : [self defaultPlaceholderFont]),
                    NSForegroundColorAttributeName : _placeholderTextColor }];
    [self insertSubview:_placeholderView belowSubview:_textView];
    [self _setPlaceholderVisibility];
  }
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [self updateFrames];
}

- (void)setText:(NSString *)text
{
  if (![text isEqualToString:_textView.text]) {
    [_textView setText:text];
    [self _setPlaceholderVisibility];
  }
}

- (void)_setPlaceholderVisibility
{
  if (_textView.text.length > 0) {
    [_placeholderView setHidden:YES];
  } else {
    [_placeholderView setHidden:NO];
  }
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  _textView.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return _textView.autocorrectionType == UITextAutocorrectionTypeYes;
}

- (void)_textViewDidChange
{
  [self _setPlaceholderVisibility];
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeChange
                                 reactTag:self.reactTag
                                     text:_textView.text];

}

- (void)_textViewEndEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:_textView.text];
}

- (void)_textViewBeginEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:_textView.text];
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
  if (result) {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                   reactTag:self.reactTag
                                       text:_textView.text];
  }

  return result;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateFrames];
}


- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (NSNotificationCenter *)notificationCenter
{
  return [NSNotificationCenter defaultCenter];
}

- (UIFont*)defaultPlaceholderFont
{
  return [UIFont fontWithName:@"Helvetica" size:17];
}

- (UIColor*)defaultPlaceholderTextColor
{
  return [UIColor colorWithRed:0.0/255.0 green:0.0/255.0 blue:0.098/255.0 alpha:0.22];
}

- (void)dealloc
{
  [self.notificationCenter removeObserver:self];
}

@end

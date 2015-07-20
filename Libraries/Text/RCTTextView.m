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
  RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    _contentInset = UIEdgeInsetsZero;
    _eventDispatcher = eventDispatcher;
    _placeholderTextColor = [self defaultPlaceholderTextColor];

    _textView = [[UITextView alloc] initWithFrame:self.bounds];
    _textView.backgroundColor = [UIColor clearColor];
    _textView.delegate = self;
    [self addSubview:_textView];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(-initWithCoder:(NSCoder *)aDecoder)

- (void)updateFrames
{
  // Adjust the insets so that they are as close as possible to single-line
  // RCTTextField defaults
  UIEdgeInsets adjustedInset = (UIEdgeInsets){
    _contentInset.top - 5, _contentInset.left - 4,
    _contentInset.bottom, _contentInset.right
  };

  [_textView setFrame:UIEdgeInsetsInsetRect(self.bounds, adjustedInset)];
  [_placeholderView setFrame:UIEdgeInsetsInsetRect(self.bounds, adjustedInset)];
}

- (void)updatePlaceholder
{
  [_placeholderView removeFromSuperview];
  _placeholderView = nil;

  if (_placeholder) {
    _placeholderView = [[UITextView alloc] initWithFrame:self.bounds];
    _placeholderView.backgroundColor = [UIColor clearColor];
    _placeholderView.scrollEnabled = false;
    _placeholderView.attributedText =
    [[NSAttributedString alloc] initWithString:_placeholder attributes:@{
      NSFontAttributeName : (_textView.font ? _textView.font : [self defaultPlaceholderFont]),
      NSForegroundColorAttributeName : _placeholderTextColor
    }];

    [self insertSubview:_placeholderView belowSubview:_textView];
    [self _setPlaceholderVisibility];
  }
}

- (UIFont *)font
{
  return _textView.font;
}

- (void)setFont:(UIFont *)font
{
  _textView.font = font;
  [self updatePlaceholder];
}

- (UIColor *)textColor
{
  return _textView.textColor;
}

- (void)setTextColor:(UIColor *)textColor
{
  _textView.textColor = textColor;
}

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
  [self updatePlaceholder];
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  if (placeholderTextColor) {
    _placeholderTextColor = placeholderTextColor;
  } else {
    _placeholderTextColor = [self defaultPlaceholderTextColor];
  }
  [self updatePlaceholder];
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [self updateFrames];
}

- (NSString *)text
{
  return _textView.text;
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

- (BOOL)textViewShouldBeginEditing:(UITextView *)textView
{
  if (_selectTextOnFocus) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [textView selectAll:nil];
    });
  }
  return YES;
}

- (void)textViewDidBeginEditing:(UITextView *)textView
{
  if (_clearTextOnFocus) {
    _textView.text = @"";
    [self _setPlaceholderVisibility];
  }

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:textView.text];
}

- (void)textViewDidChange:(UITextView *)textView
{
  [self _setPlaceholderVisibility];
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeChange
                                 reactTag:self.reactTag
                                     text:textView.text];

}

- (void)textViewDidEndEditing:(UITextView *)textView
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:textView.text];
}

- (BOOL)becomeFirstResponder
{
  _jsRequestingFirstResponder = YES;
  BOOL result = [_textView becomeFirstResponder];
  _jsRequestingFirstResponder = NO;
  return result;
}

- (BOOL)resignFirstResponder
{
  [super resignFirstResponder];
  BOOL result = [_textView resignFirstResponder];
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

- (UIFont *)defaultPlaceholderFont
{
  return [UIFont systemFontOfSize:17];
}

- (UIColor *)defaultPlaceholderTextColor
{
  return [UIColor colorWithRed:0.0/255.0 green:0.0/255.0 blue:0.098/255.0 alpha:0.22];
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextView.h"
#import "NSAttributedString+EmptyStringWithAttributes.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTTextView
{
  RCTEventDispatcher *_eventDispatcher;
  BOOL _jsRequestingFirstResponder;
  NSAttributedString *_attributedPlacerholderText;
  UITextView *_placeholderView;
  UITextView *_textView;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _contentInset = UIEdgeInsetsZero;
    _eventDispatcher = eventDispatcher;

    _textView = [[UITextView alloc] initWithFrame:self.bounds];
    _textView.textContainer.lineFragmentPadding = 0.0;
    _textView.textContainerInset = UIEdgeInsetsMake(0, 0, 0, 0 );
    _textView.backgroundColor = [UIColor clearColor];
    _textView.delegate = self;
    [self addSubview:_textView];
  }

  return self;
}

- (NSAttributedString *)attributedText
{
  return [_textView.attributedText copy];
}

- (NSAttributedString *)attributedPlaceholderText
{
  return _attributedPlacerholderText;
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  // save the cursors current location and disable scrolling -> otherwise UITextView will jump around.
  BOOL oldScrollEnabled = _textView.scrollEnabled;
  _textView.scrollEnabled = NO;
  UITextRange *range = _textView.selectedTextRange;
  
  // Check if we should really display the NSAttributedString's value or this is in fact an empty string.
  if (attributedText.isEmptyStringWithAttributes) {
    NSRange range = NSMakeRange(0, 1);
    _textView.typingAttributes = [attributedText attributesAtIndex:0 effectiveRange:&range];
    _textView.attributedText = [[NSAttributedString alloc]init];
  } else {
    _textView.attributedText = attributedText;
  }
  
  _textView.scrollEnabled = oldScrollEnabled;
  _textView.selectedTextRange = range;//you keep before

  [self updatePlaceholder];
  [self setNeedsDisplay];
}

- (void)setAttributedPlaceholderText:(NSAttributedString *)attributedPlaceholderText
{
  _attributedPlacerholderText = attributedPlaceholderText;
  [self updatePlaceholder];
  [self setNeedsDisplay];
}

- (void)updateFrames
{
  // Adjust the insets so that they are as close as possible to single-line
  // RCTTextField defaults
  UIEdgeInsets adjustedInset = (UIEdgeInsets){
    _contentInset.top, _contentInset.left,
    _contentInset.bottom, _contentInset.right
  };
  
  [_textView setFrame:UIEdgeInsetsInsetRect(self.bounds, adjustedInset)];
  [_placeholderView setFrame:UIEdgeInsetsInsetRect(self.bounds, adjustedInset)];
}

- (void)updatePlaceholder
{
  [_placeholderView removeFromSuperview];
  _placeholderView = nil;

  if (_attributedPlacerholderText) {
    _placeholderView = [[UITextView alloc] initWithFrame:self.bounds];
    _placeholderView.textContainer.lineFragmentPadding = 0.0;
    _placeholderView.textContainerInset = UIEdgeInsetsMake(0, 0, 0, 0 );
    _placeholderView.backgroundColor = [UIColor clearColor];
    _placeholderView.scrollEnabled = false;
    _placeholderView.attributedText = [self attributedPlaceholderText];
    
    [self insertSubview:_placeholderView belowSubview:_textView];
    [self _setPlaceholderVisibility];
  }
}


- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [self updateFrames];
}

- (void)_setPlaceholderVisibility
{
  BOOL _placeholderViewWasHidden = _placeholderView.isHidden;
  if (_textView.attributedText.length > 0) {
    [_placeholderView setHidden:YES];
  } else {
    [_placeholderView setHidden:NO];
  }
  
  if (_placeholderViewWasHidden != _placeholderView.isHidden) {
    [self setNeedsDisplay];
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

- (void)setTruncationMode:(NSLineBreakMode)truncationMode
{
  _textView.textContainer.lineBreakMode = truncationMode;
  if (_placeholderView) {
    _textView.textContainer.lineBreakMode = truncationMode;
  }
}

- (void)setMaximumNumberOfLines:(NSUInteger)maximumNumberOfLines
{
  if (maximumNumberOfLines < 1) {
    maximumNumberOfLines = 1;
  }

  [self setTruncationMode:NSLineBreakByTruncatingTail];
  _textView.textContainer.maximumNumberOfLines = maximumNumberOfLines;
  if (_placeholderView) {
    _placeholderView.textContainer.maximumNumberOfLines = maximumNumberOfLines;
  }
}

- (NSUInteger)maximumNumberOfLines
{
  return _textView.textContainer.maximumNumberOfLines;
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
    _textView.attributedText = [_textView.attributedText attributedSubstringFromRange:NSMakeRange(0, 0)];
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


@end

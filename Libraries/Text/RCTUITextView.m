/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUITextView.h"

#import <React/RCTUtils.h>
#import <React/UIView+React.h>

@implementation RCTUITextView
{
  UILabel *_placeholderView;
  UITextView *_detachedTextView;
}

static UIFont *defaultPlaceholderFont()
{
  return [UIFont systemFontOfSize:17];
}

static UIColor *defaultPlaceholderTextColor()
{
  // Default placeholder color from UITextField.
  return [UIColor colorWithRed:0 green:0 blue:0.0980392 alpha:0.22];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(textDidChange)
                                                 name:UITextViewTextDidChangeNotification
                                               object:self];

    _placeholderView = [[UILabel alloc] initWithFrame:self.bounds];
    _placeholderView.isAccessibilityElement = NO;
    _placeholderView.numberOfLines = 0;
    _placeholderView.textColor = defaultPlaceholderTextColor();
    [self addSubview:_placeholderView];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSString *)accessibilityLabel
{
  NSMutableString *accessibilityLabel = [NSMutableString new];
  
  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel.length > 0) {
    [accessibilityLabel appendString:superAccessibilityLabel];
  }
  
  if (self.placeholderText.length > 0 && self.text.length == 0) {
    if (accessibilityLabel.length > 0) {
      [accessibilityLabel appendString:@" "];
    }
    [accessibilityLabel appendString:self.placeholderText];
  }
  
  return accessibilityLabel;
}

#pragma mark - Properties

- (void)setPlaceholderText:(NSString *)placeholderText
{
  _placeholderText = placeholderText;
  _placeholderView.text = _placeholderText;
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  _placeholderTextColor = placeholderTextColor;
  _placeholderView.textColor = _placeholderTextColor ?: defaultPlaceholderTextColor();
}

- (void)textDidChange
{
  _textWasPasted = NO;
  [self invalidatePlaceholderVisibility];
}

#pragma mark - Overrides

- (void)setFont:(UIFont *)font
{
  [super setFont:font];
  _placeholderView.font = font ?: defaultPlaceholderFont();
}

- (void)setTextAlignment:(NSTextAlignment)textAlignment
{
  [super setTextAlignment:textAlignment];
  _placeholderView.textAlignment = textAlignment;
}

- (void)setText:(NSString *)text
{
  [super setText:text];
  [self textDidChange];
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  [super setAttributedText:attributedText];
  [self textDidChange];
}

- (void)paste:(id)sender
{
  [super paste:sender];
  _textWasPasted = YES;
}

- (void)setContentOffset:(CGPoint)contentOffset animated:(__unused BOOL)animated
{
  // Turning off scroll animation.
  // This fixes the problem also known as "flaky scrolling".
  [super setContentOffset:contentOffset animated:NO];
}

#pragma mark - Layout

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, self.textContainerInset);
  CGFloat placeholderHeight = [_placeholderView sizeThatFits:textFrame.size].height;
  textFrame.size.height = MIN(placeholderHeight, textFrame.size.height);
  _placeholderView.frame = textFrame;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // Returned fitting size depends on text size and placeholder size.
  CGSize textSize = [self fixedSizeThatFits:size];

  UIEdgeInsets padddingInsets = self.textContainerInset;
  NSString *placeholderText = self.placeholderText ?: @"";
  CGSize placeholderSize = [placeholderText sizeWithAttributes:@{NSFontAttributeName: self.font ?: defaultPlaceholderFont()}];
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width), RCTCeilPixelValue(placeholderSize.height));
  placeholderSize.width += padddingInsets.left + padddingInsets.right;
  placeholderSize.height += padddingInsets.top + padddingInsets.bottom;

  return CGSizeMake(MAX(textSize.width, placeholderSize.width), MAX(textSize.height, placeholderSize.height));
}

- (CGSize)fixedSizeThatFits:(CGSize)size
{
  // UITextView on iOS 8 has a bug that automatically scrolls to the top
  // when calling `sizeThatFits:`. Use a copy so that self is not screwed up.
  static BOOL useCustomImplementation = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    useCustomImplementation = ![[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion:(NSOperatingSystemVersion){9,0,0}];
  });

  if (!useCustomImplementation) {
    return [super sizeThatFits:size];
  }

  if (!_detachedTextView) {
    _detachedTextView = [UITextView new];
  }

  _detachedTextView.attributedText = self.attributedText;
  _detachedTextView.font = self.font;
  _detachedTextView.textContainerInset = self.textContainerInset;

  return [_detachedTextView sizeThatFits:size];
}

#pragma mark - Placeholder

- (void)invalidatePlaceholderVisibility
{
  BOOL isVisible = _placeholderText.length != 0 && self.text.length == 0;
  _placeholderView.hidden = !isVisible;
}

@end

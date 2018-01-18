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

#import "RCTBackedTextInputDelegateAdapter.h"

@implementation RCTUITextView
{
  UILabel *_placeholderView;
  UITextView *_detachedTextView;
  RCTBackedTextViewDelegateAdapter *_textInputDelegateAdapter;
}

static UIFont *defaultPlaceholderFont()
{
  return [UIFont systemFontOfSize:17];
}

static UIColor *defaultPlaceholderColor()
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
    _placeholderView.textColor = defaultPlaceholderColor();
    [self addSubview:_placeholderView];

    _textInputDelegateAdapter = [[RCTBackedTextViewDelegateAdapter alloc] initWithTextView:self];
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
  
  if (self.placeholder.length > 0 && self.text.length == 0) {
    if (accessibilityLabel.length > 0) {
      [accessibilityLabel appendString:@" "];
    }
    [accessibilityLabel appendString:self.placeholder];
  }
  
  return accessibilityLabel;
}

#pragma mark - Properties

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
  _placeholderView.text = _placeholder;
}

- (void)setPlaceholderColor:(UIColor *)placeholderColor
{
  _placeholderColor = placeholderColor;
  _placeholderView.textColor = _placeholderColor ?: defaultPlaceholderColor();
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

#pragma mark - Overrides

- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

  [super setSelectedTextRange:selectedTextRange];
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

- (CGFloat)preferredMaxLayoutWidth
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return _preferredMaxLayoutWidth ?: self.placeholderSize.width;
}

- (CGSize)placeholderSize
{
  UIEdgeInsets textContainerInset = self.textContainerInset;
  NSString *placeholder = self.placeholder ?: @"";
  CGSize placeholderSize = [placeholder sizeWithAttributes:@{NSFontAttributeName: self.font ?: defaultPlaceholderFont()}];
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width), RCTCeilPixelValue(placeholderSize.height));
  placeholderSize.width += textContainerInset.left + textContainerInset.right;
  placeholderSize.height += textContainerInset.top + textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`; as `sizeThatFits:` does).
  return placeholderSize;
}

- (CGSize)contentSize
{
  CGSize contentSize = super.contentSize;
  CGSize placeholderSize = self.placeholderSize;
  // When a text input is empty, it actually displays a placehoder.
  // So, we have to consider `placeholderSize` as a minimum `contentSize`.
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(
    MAX(contentSize.width, placeholderSize.width),
    MAX(contentSize.height, placeholderSize.height));
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, self.textContainerInset);
  CGFloat placeholderHeight = [_placeholderView sizeThatFits:textFrame.size].height;
  textFrame.size.height = MIN(placeholderHeight, textFrame.size.height);
  _placeholderView.frame = textFrame;
}

- (CGSize)intrinsicContentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return [self sizeThatFits:CGSizeMake(self.preferredMaxLayoutWidth, INFINITY)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // Returned fitting size depends on text size and placeholder size.
  CGSize textSize = [self fixedSizeThatFits:size];
  CGSize placeholderSize = self.placeholderSize;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
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
  BOOL isVisible = _placeholder.length != 0 && self.text.length == 0;
  _placeholderView.hidden = !isVisible;
}

@end

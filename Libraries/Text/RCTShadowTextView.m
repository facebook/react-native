/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowTextView.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

static css_dim_t RCTMeasure(void *context, float width)
{
  RCTShadowTextView *shadowTextView = (__bridge RCTShadowTextView *)context;
  
  NSAttributedString *attributedString = [shadowTextView attributedString];
  if (attributedString.length == 0) {
    // if the text is empty the height is defined by the placeholder string.
    attributedString = [shadowTextView attributedPlaceholderString];
  }
  NSTextStorage *textStorage = [[NSTextStorage alloc]initWithAttributedString:attributedString];
  
  NSTextStorage *previousTextStorage = shadowTextView.layoutManager.textStorage;
  if (previousTextStorage) {
    [previousTextStorage removeLayoutManager:shadowTextView.layoutManager];
  }
  [textStorage addLayoutManager:shadowTextView.layoutManager];
  
  shadowTextView.textContainer.size = CGSizeMake(isnan(width) ? CGFLOAT_MAX :width, CGFLOAT_MAX);
  [shadowTextView.layoutManager ensureLayoutForTextContainer:shadowTextView.textContainer];
  
  CGSize computedSize = [shadowTextView.layoutManager usedRectForTextContainer:shadowTextView.textContainer].size;
  
  [textStorage removeLayoutManager:shadowTextView.layoutManager];
  if (previousTextStorage) {
    [previousTextStorage addLayoutManager:shadowTextView.layoutManager];
  }
  
  css_dim_t result;
  result.dimensions[CSS_WIDTH] = RCTCeilPixelValue(computedSize.width);
  result.dimensions[CSS_HEIGHT] = RCTCeilPixelValue(computedSize.height);
  return result;
}


@implementation RCTShadowTextView {
  NSLayoutManager *_layoutManager;
  NSTextContainer *_textContainer;
  UIFont *_font;

  RCTAttributedStringHandler *_stringHandler;
  RCTAttributedStringHandler *_placeholderStringHandler;
  BOOL _textHasBeenSetOnce;
}


- (instancetype)init
{
  if ((self = [super init])) {    
    _textContainer = [[NSTextContainer alloc] init];
    _textContainer.lineBreakMode = NSLineBreakByTruncatingTail;
    _textContainer.lineFragmentPadding = 0.0;
    
    _layoutManager = [[NSLayoutManager alloc] init];
    [_layoutManager addTextContainer:_textContainer];
    
    _stringHandler = [[RCTAttributedStringHandler alloc] initWithShadowView:self];
    _placeholderStringHandler = [[RCTAttributedStringHandler alloc] initWithShadowView:self];
    _placeholderStringHandler.textColor = [UIColor colorWithRed:0.0/255.0 green:0.0/255.0 blue:0.098/255.0 alpha:0.22];
    _textHasBeenSetOnce = false;
  }
  
  return self;
}

- (NSAttributedString *)attributedString
{
  if ( !([self isTextDirty] || [self isLayoutDirty])  && _stringHandler.cachedAttributedString) {
    return _stringHandler.cachedAttributedString;
  }
  NSAttributedString *attributedString = [_stringHandler attributedString:_text];
  [self dirtyLayout];
  
  return attributedString;
}

- (NSAttributedString *)attributedPlaceholderString
{
  if (![self isTextDirty] && _placeholderStringHandler.cachedAttributedString) {
    return _placeholderStringHandler.cachedAttributedString;
  }
  NSAttributedString *attributedString = [_placeholderStringHandler attributedString:_placeholder];
  [self dirtyLayout];
  
  return attributedString;
}


- (void)fillCSSNode:(css_node_t *)node
{
  [super fillCSSNode:node];
  node->measure = RCTMeasure;
}

#define RCT_TEXT_PROPERTY(setProp, ivar, type) \
- (void)set##setProp:(type)value;              \
{                                              \
ivar=value;                                \
[self dirtyText];                            \
}


#define RCT_ATTR_STRING_PROPERTY(setProp, attrName, type) \
- (void)set##setProp:(type)value;                    \
{ \
  _stringHandler.attrName = value;\
  _placeholderStringHandler.attrName = value; \
  [self dirtyText];   \
}     \
- (type)attrName  \
{   \
return _stringHandler.attrName;  \
}


RCT_TEXT_PROPERTY(TextColor, _stringHandler.textColor, UIColor *);
- (UIColor *)textColor
{
  return _stringHandler.textColor;
}
RCT_TEXT_PROPERTY(PlaceholderTextColor, _placeholderStringHandler.textColor, UIColor *);
- (UIColor *)placeholderTextColor
{
  return _placeholderStringHandler.textColor;
}

RCT_ATTR_STRING_PROPERTY(TextBackgroundColor, textBackgroundColor, UIColor *);
RCT_ATTR_STRING_PROPERTY(FontFamily, fontFamily, NSString *);
RCT_ATTR_STRING_PROPERTY(FontSize, fontSize, CGFloat);
RCT_ATTR_STRING_PROPERTY(FontWeight, fontWeight, NSString *);
RCT_ATTR_STRING_PROPERTY(FontStyle, fontStyle, NSString *);
RCT_ATTR_STRING_PROPERTY(LineHeight, lineHeight, CGFloat );
RCT_ATTR_STRING_PROPERTY(TextAlign, textAlign, NSTextAlignment );
RCT_ATTR_STRING_PROPERTY(IsHighlighted, isHighlighted, BOOL );
RCT_ATTR_STRING_PROPERTY(WritingDirection, writingDirection, NSWritingDirection);


- (void)setText:(NSString *)text
{
  if (![_text isEqualToString:text ]) {
    _text = [text copy];
    [self dirtyLayout];
    [self dirtyText];
  }
}

- (void)setPlaceholder:(NSString *)placeholder
{
  if (![_placeholder isEqualToString:placeholder]) {
    _placeholder = [placeholder copy];
    [self dirtyLayout];
    [self dirtyText];
  }
}

- (void)setText:(NSString *)text updateTextView:(BOOL)updateTextView
{
  if (!_textHasBeenSetOnce) {
    updateTextView = true;
    _textHasBeenSetOnce = true;
  }
  if (![_text isEqualToString:text ]) {
    _text = [text copy];
    [self dirtyLayout];
    if (updateTextView) {
      [self dirtyText];
    }
  }
}

@end


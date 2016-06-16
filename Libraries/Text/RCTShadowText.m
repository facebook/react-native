/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowText.h"

#import "RCTAccessibilityManager.h"
#import "RCTUIManager.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowRawText.h"
#import "RCTText.h"
#import "RCTUtils.h"
#import "RCTConvert.h"

NSString *const RCTShadowViewAttributeName = @"RCTShadowViewAttributeName";
NSString *const RCTIsHighlightedAttributeName = @"IsHighlightedAttributeName";
NSString *const RCTReactTagAttributeName = @"ReactTagAttributeName";

@implementation RCTShadowText
{
  NSTextStorage *_cachedTextStorage;
  CGFloat _cachedTextStorageWidth;
  CGFloat _cachedTextStorageWidthMode;
  NSAttributedString *_cachedAttributedString;
  CGFloat _effectiveLetterSpacing;
}

static css_dim_t RCTMeasure(void *context, float width, css_measure_mode_t widthMode, float height, css_measure_mode_t heightMode)
{
  RCTShadowText *shadowText = (__bridge RCTShadowText *)context;
  NSTextStorage *textStorage = [shadowText buildTextStorageForWidth:width widthMode:widthMode];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  CGSize computedSize = [layoutManager usedRectForTextContainer:textContainer].size;

  css_dim_t result;
  result.dimensions[CSS_WIDTH] = RCTCeilPixelValue(computedSize.width);
  if (shadowText->_effectiveLetterSpacing < 0) {
    result.dimensions[CSS_WIDTH] -= shadowText->_effectiveLetterSpacing;
  }
  result.dimensions[CSS_HEIGHT] = RCTCeilPixelValue(computedSize.height);
  return result;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _fontSize = NAN;
    _letterSpacing = NAN;
    _isHighlighted = NO;
    _textDecorationStyle = NSUnderlineStyleSingle;
    _opacity = 1.0;
    _cachedTextStorageWidth = -1;
    _cachedTextStorageWidthMode = -1;
    _fontSizeMultiplier = 1.0;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentSizeMultiplierDidChange:)
                                                 name:RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  return [[superDescription substringToIndex:superDescription.length - 1] stringByAppendingFormat:@"; text: %@>", [self attributedString].string];
}

- (void)contentSizeMultiplierDidChange:(NSNotification *)note
{
  [self dirtyLayout];
  [self dirtyText];
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  if ([[self reactSuperview] isKindOfClass:[RCTShadowText class]]) {
    return parentProperties;
  }

  parentProperties = [super processUpdatedProperties:applierBlocks
                                    parentProperties:parentProperties];

  UIEdgeInsets padding = self.paddingAsInsets;
  CGFloat width = self.frame.size.width - (padding.left + padding.right);

  NSTextStorage *textStorage = [self buildTextStorageForWidth:width widthMode:CSS_MEASURE_MODE_EXACTLY];
  [applierBlocks addObject:^(NSDictionary<NSNumber *, RCTText *> *viewRegistry) {
    RCTText *view = viewRegistry[self.reactTag];
    view.textStorage = textStorage;
  }];

  return parentProperties;
}

- (void)applyLayoutNode:(css_node_t *)node
      viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  [super applyLayoutNode:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
  [self dirtyPropagation];
}

- (void)applyLayoutToChildren:(css_node_t *)node
            viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  // Run layout on subviews.
  NSTextStorage *textStorage = [self buildTextStorageForWidth:self.frame.size.width widthMode:CSS_MEASURE_MODE_EXACTLY];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];
  [layoutManager.textStorage enumerateAttribute:RCTShadowViewAttributeName inRange:characterRange options:0 usingBlock:^(RCTShadowView *child, NSRange range, BOOL *_) {
    if (child) {
      css_node_t *childNode = child.cssNode;
      float width = childNode->style.dimensions[CSS_WIDTH];
      float height = childNode->style.dimensions[CSS_HEIGHT];
      if (isUndefined(width) || isUndefined(height)) {
        RCTLogError(@"Views nested within a <Text> must have a width and height");
      }
      UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];
      CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];
      CGRect childFrame = {{
        RCTRoundPixelValue(glyphRect.origin.x),
        RCTRoundPixelValue(glyphRect.origin.y + glyphRect.size.height - height + font.descender)
      }, {
        RCTRoundPixelValue(width),
        RCTRoundPixelValue(height)
      }};

      NSRange truncatedGlyphRange = [layoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:range.location];
      BOOL childIsTruncated = NSIntersectionRange(range, truncatedGlyphRange).length != 0;

      [child collectUpdatedFrames:viewsWithNewFrame
                        withFrame:childFrame
                           hidden:childIsTruncated
                 absolutePosition:absolutePosition];
    }
  }];
}

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(css_measure_mode_t)widthMode
{
  if (_cachedTextStorage && width == _cachedTextStorageWidth && widthMode == _cachedTextStorageWidthMode) {
    return _cachedTextStorage;
  }

  NSLayoutManager *layoutManager = [NSLayoutManager new];

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:self.attributedString];
  [textStorage addLayoutManager:layoutManager];

  NSTextContainer *textContainer = [NSTextContainer new];
  textContainer.lineFragmentPadding = 0.0;
  
  if (_numberOfLines > 0) {
    textContainer.lineBreakMode = _lineBreakMode;
  } else {
    textContainer.lineBreakMode = NSLineBreakByClipping;
  }
  
  textContainer.maximumNumberOfLines = _numberOfLines;
  textContainer.size = (CGSize){widthMode == CSS_MEASURE_MODE_UNDEFINED ? CGFLOAT_MAX : width, CGFLOAT_MAX};

  [layoutManager addTextContainer:textContainer];
  [layoutManager ensureLayoutForTextContainer:textContainer];

  _cachedTextStorageWidth = width;
  _cachedTextStorageWidthMode = widthMode;
  _cachedTextStorage = textStorage;

  return textStorage;
}

- (void)dirtyText
{
  [super dirtyText];
  _cachedTextStorage = nil;
}

- (void)recomputeText
{
  [self attributedString];
  [self setTextComputed];
  [self dirtyPropagation];
}

- (NSAttributedString *)attributedString
{
  return [self _attributedStringWithFontFamily:nil
                                      fontSize:nil
                                    fontWeight:nil
                                     fontStyle:nil
                                 letterSpacing:nil
                            useBackgroundColor:NO
                               foregroundColor:self.color ?: [UIColor blackColor]
                               backgroundColor:self.backgroundColor
                                       opacity:self.opacity];
}

- (NSAttributedString *)_attributedStringWithFontFamily:(NSString *)fontFamily
                                               fontSize:(NSNumber *)fontSize
                                             fontWeight:(NSString *)fontWeight
                                              fontStyle:(NSString *)fontStyle
                                          letterSpacing:(NSNumber *)letterSpacing
                                     useBackgroundColor:(BOOL)useBackgroundColor
                                        foregroundColor:(UIColor *)foregroundColor
                                        backgroundColor:(UIColor *)backgroundColor
                                                opacity:(CGFloat)opacity
{
  if (![self isTextDirty] && _cachedAttributedString) {
    return _cachedAttributedString;
  }

  if (_fontSize && !isnan(_fontSize)) {
    fontSize = @(_fontSize);
  }
  if (_fontWeight) {
    fontWeight = _fontWeight;
  }
  if (_fontStyle) {
    fontStyle = _fontStyle;
  }
  if (_fontFamily) {
    fontFamily = _fontFamily;
  }
  if (!isnan(_letterSpacing)) {
    letterSpacing = @(_letterSpacing);
  }

  _effectiveLetterSpacing = letterSpacing.doubleValue;

  UIFont *font = [RCTConvert UIFont:nil withFamily:fontFamily
                               size:fontSize weight:fontWeight style:fontStyle
                    scaleMultiplier:_allowFontScaling ? _fontSizeMultiplier : 1.0];

  CGFloat heightOfTallestSubview = 0.0;
  NSMutableAttributedString *attributedString = [NSMutableAttributedString new];
  for (RCTShadowView *child in [self reactSubviews]) {
    if ([child isKindOfClass:[RCTShadowText class]]) {
      RCTShadowText *shadowText = (RCTShadowText *)child;
      [attributedString appendAttributedString:
       [shadowText _attributedStringWithFontFamily:fontFamily
                                          fontSize:fontSize
                                        fontWeight:fontWeight
                                         fontStyle:fontStyle
                                     letterSpacing:letterSpacing
                                useBackgroundColor:YES
                                   foregroundColor:shadowText.color ?: foregroundColor
                                   backgroundColor:shadowText.backgroundColor ?: backgroundColor
                                           opacity:opacity * shadowText.opacity]];
      [child setTextComputed];
    } else if ([child isKindOfClass:[RCTShadowRawText class]]) {
      RCTShadowRawText *shadowRawText = (RCTShadowRawText *)child;
      [attributedString appendAttributedString:[[NSAttributedString alloc] initWithString:shadowRawText.text ?: @""]];
      [child setTextComputed];
    } else {
      float width = child.cssNode->style.dimensions[CSS_WIDTH];
      float height = child.cssNode->style.dimensions[CSS_HEIGHT];
      if (isUndefined(width) || isUndefined(height)) {
        RCTLogError(@"Views nested within a <Text> must have a width and height");
      }
      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.bounds = (CGRect){CGPointZero, {width, height}};
      NSMutableAttributedString *attachmentString = [NSMutableAttributedString new];
      [attachmentString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
      [attachmentString addAttribute:RCTShadowViewAttributeName value:child range:(NSRange){0, attachmentString.length}];
      [attributedString appendAttributedString:attachmentString];
      if (height > heightOfTallestSubview) {
        heightOfTallestSubview = height;
      }
      // Don't call setTextComputed on this child. RCTTextManager takes care of
      // processing inline UIViews.
    }
  }

  [self _addAttribute:NSForegroundColorAttributeName
            withValue:[foregroundColor colorWithAlphaComponent:CGColorGetAlpha(foregroundColor.CGColor) * opacity]
   toAttributedString:attributedString];

  if (_isHighlighted) {
    [self _addAttribute:RCTIsHighlightedAttributeName withValue:@YES toAttributedString:attributedString];
  }
  if (useBackgroundColor && backgroundColor) {
    [self _addAttribute:NSBackgroundColorAttributeName
              withValue:[backgroundColor colorWithAlphaComponent:CGColorGetAlpha(backgroundColor.CGColor) * opacity]
     toAttributedString:attributedString];
  }

  [self _addAttribute:NSFontAttributeName withValue:font toAttributedString:attributedString];
  [self _addAttribute:NSKernAttributeName withValue:letterSpacing toAttributedString:attributedString];
  [self _addAttribute:RCTReactTagAttributeName withValue:self.reactTag toAttributedString:attributedString];
  [self _setParagraphStyleOnAttributedString:attributedString heightOfTallestSubview:heightOfTallestSubview];

  // create a non-mutable attributedString for use by the Text system which avoids copies down the line
  _cachedAttributedString = [[NSAttributedString alloc] initWithAttributedString:attributedString];
  [self dirtyLayout];

  return _cachedAttributedString;
}

- (void)_addAttribute:(NSString *)attribute withValue:(id)attributeValue toAttributedString:(NSMutableAttributedString *)attributedString
{
  [attributedString enumerateAttribute:attribute inRange:NSMakeRange(0, attributedString.length) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (!value && attributeValue) {
      [attributedString addAttribute:attribute value:attributeValue range:range];
    }
  }];
}

/*
 * LineHeight works the same way line-height works in the web: if children and self have
 * varying lineHeights, we simply take the max.
 */
- (void)_setParagraphStyleOnAttributedString:(NSMutableAttributedString *)attributedString
                      heightOfTallestSubview:(CGFloat)heightOfTallestSubview
{
  // check if we have lineHeight set on self
  __block BOOL hasParagraphStyle = NO;
  if (_lineHeight || _textAlign) {
    hasParagraphStyle = YES;
  }

  __block float newLineHeight = _lineHeight ?: 0.0;

  CGFloat fontSizeMultiplier = _allowFontScaling ? _fontSizeMultiplier : 1.0;

  // check for lineHeight on each of our children, update the max as we go (in self.lineHeight)
  [attributedString enumerateAttribute:NSParagraphStyleAttributeName inRange:(NSRange){0, attributedString.length} options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (value) {
      NSParagraphStyle *paragraphStyle = (NSParagraphStyle *)value;
      CGFloat maximumLineHeight = round(paragraphStyle.maximumLineHeight / fontSizeMultiplier);
      if (maximumLineHeight > newLineHeight) {
        newLineHeight = maximumLineHeight;
      }
      hasParagraphStyle = YES;
    }
  }];

  if (self.lineHeight != newLineHeight) {
    self.lineHeight = newLineHeight;
  }

  NSTextAlignment newTextAlign = _textAlign ?: NSTextAlignmentNatural;
  if (self.textAlign != newTextAlign) {
    self.textAlign = newTextAlign;
  }
  NSWritingDirection newWritingDirection = _writingDirection ?: NSWritingDirectionNatural;
  if (self.writingDirection != newWritingDirection) {
    self.writingDirection = newWritingDirection;
  }

  // if we found anything, set it :D
  if (hasParagraphStyle) {
    NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
    paragraphStyle.alignment = _textAlign;
    paragraphStyle.baseWritingDirection = _writingDirection;
    CGFloat lineHeight = round(_lineHeight * fontSizeMultiplier);
    if (heightOfTallestSubview > lineHeight) {
      lineHeight = ceilf(heightOfTallestSubview);
    }
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    [attributedString addAttribute:NSParagraphStyleAttributeName
                             value:paragraphStyle
                             range:(NSRange){0, attributedString.length}];
  }

  // Text decoration
  if (_textDecorationLine == RCTTextDecorationLineTypeUnderline ||
      _textDecorationLine == RCTTextDecorationLineTypeUnderlineStrikethrough) {
    [self _addAttribute:NSUnderlineStyleAttributeName withValue:@(_textDecorationStyle)
     toAttributedString:attributedString];
  }
  if (_textDecorationLine == RCTTextDecorationLineTypeStrikethrough ||
      _textDecorationLine == RCTTextDecorationLineTypeUnderlineStrikethrough){
    [self _addAttribute:NSStrikethroughStyleAttributeName withValue:@(_textDecorationStyle)
     toAttributedString:attributedString];
  }
  if (_textDecorationColor) {
    [self _addAttribute:NSStrikethroughColorAttributeName withValue:_textDecorationColor
     toAttributedString:attributedString];
    [self _addAttribute:NSUnderlineColorAttributeName withValue:_textDecorationColor
     toAttributedString:attributedString];
  }

  // Text shadow
  if (!CGSizeEqualToSize(_textShadowOffset, CGSizeZero)) {
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = _textShadowOffset;
    shadow.shadowBlurRadius = _textShadowRadius;
    shadow.shadowColor = _textShadowColor;
    [self _addAttribute:NSShadowAttributeName withValue:shadow toAttributedString:attributedString];
  }
}

- (void)fillCSSNode:(css_node_t *)node
{
  [super fillCSSNode:node];
  node->measure = RCTMeasure;
  node->children_count = 0;
}

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  self.cssNode->children_count = 0;
}

- (void)removeReactSubview:(RCTShadowView *)subview
{
  [super removeReactSubview:subview];
  self.cssNode->children_count = 0;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  super.backgroundColor = backgroundColor;
  [self dirtyText];
}

#define RCT_TEXT_PROPERTY(setProp, ivar, type) \
- (void)set##setProp:(type)value;              \
{                                              \
  ivar = value;                                \
  [self dirtyText];                            \
}

RCT_TEXT_PROPERTY(Color, _color, UIColor *)
RCT_TEXT_PROPERTY(FontFamily, _fontFamily, NSString *)
RCT_TEXT_PROPERTY(FontSize, _fontSize, CGFloat)
RCT_TEXT_PROPERTY(FontWeight, _fontWeight, NSString *)
RCT_TEXT_PROPERTY(FontStyle, _fontStyle, NSString *)
RCT_TEXT_PROPERTY(IsHighlighted, _isHighlighted, BOOL)
RCT_TEXT_PROPERTY(LetterSpacing, _letterSpacing, CGFloat)
RCT_TEXT_PROPERTY(LineHeight, _lineHeight, CGFloat)
RCT_TEXT_PROPERTY(NumberOfLines, _numberOfLines, NSUInteger)
RCT_TEXT_PROPERTY(LineBreakMode, _lineBreakMode, NSLineBreakMode)
RCT_TEXT_PROPERTY(TextAlign, _textAlign, NSTextAlignment)
RCT_TEXT_PROPERTY(TextDecorationColor, _textDecorationColor, UIColor *);
RCT_TEXT_PROPERTY(TextDecorationLine, _textDecorationLine, RCTTextDecorationLineType);
RCT_TEXT_PROPERTY(TextDecorationStyle, _textDecorationStyle, NSUnderlineStyle);
RCT_TEXT_PROPERTY(WritingDirection, _writingDirection, NSWritingDirection)
RCT_TEXT_PROPERTY(Opacity, _opacity, CGFloat)
RCT_TEXT_PROPERTY(TextShadowOffset, _textShadowOffset, CGSize);
RCT_TEXT_PROPERTY(TextShadowRadius, _textShadowRadius, CGFloat);
RCT_TEXT_PROPERTY(TextShadowColor, _textShadowColor, UIColor *);

- (void)setAllowFontScaling:(BOOL)allowFontScaling
{
  _allowFontScaling = allowFontScaling;
  for (RCTShadowView *child in [self reactSubviews]) {
    if ([child isKindOfClass:[RCTShadowText class]]) {
      ((RCTShadowText *)child).allowFontScaling = allowFontScaling;
    }
  }
  [self dirtyText];
}

- (void)setFontSizeMultiplier:(CGFloat)fontSizeMultiplier
{
  _fontSizeMultiplier = fontSizeMultiplier;
  if (_fontSizeMultiplier == 0) {
    RCTLogError(@"fontSizeMultiplier value must be > zero.");
    _fontSizeMultiplier = 1.0;
  }
  for (RCTShadowView *child in [self reactSubviews]) {
    if ([child isKindOfClass:[RCTShadowText class]]) {
      ((RCTShadowText *)child).fontSizeMultiplier = fontSizeMultiplier;
    }
  }
  [self dirtyText];
}

@end

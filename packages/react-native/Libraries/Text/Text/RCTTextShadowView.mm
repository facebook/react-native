/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextShadowView.h>

#import <React/RCTBridge.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTUIManager.h>
#import <yoga/Yoga.h>

#import <React/RCTTextView.h>
#import "NSTextStorage+FontScaling.h"
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUtils.h>

// Empirical vertical offset for inline views/attachments to achieve better visual centering.
static const CGFloat kAttachmentVerticalOffsetPoints = 2.0;

@implementation RCTTextShadowView {
  __weak RCTBridge *_bridge;
  BOOL _needsUpdateView;
  NSMapTable<id, NSTextStorage *> *_cachedTextStorages;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _cachedTextStorages = [NSMapTable strongToStrongObjectsMapTable];
    _needsUpdateView = YES;
    YGNodeSetMeasureFunc(self.yogaNode, RCTTextShadowViewMeasure);
    YGNodeSetBaselineFunc(self.yogaNode, RCTTextShadowViewBaseline);
  }

  return self;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];

  // When applying a semi-transparent background color to Text component
  // we must set the root text nodes text attribute background color to nil
  // because the background color is drawn on the RCTTextView itself, as well
  // as on the glphy background draw step. By setting this to nil, we allow
  // the RCTTextView backgroundColor to be used, without affecting nested Text
  // components.
  self.textAttributes.backgroundColor = nil;
  self.textAttributes.opacity = NAN;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  YGNodeMarkDirty(self.yogaNode);
  [self invalidateCache];
}

- (void)invalidateCache
{
  [_cachedTextStorages removeAllObjects];
  _needsUpdateView = YES;
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformMounting
{
  if (YGNodeIsDirty(self.yogaNode)) {
    return;
  }

  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;

  CGRect contentFrame = self.contentFrame;
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:self.contentFrame.size
                                                          exclusiveOwnership:YES];

  NSNumber *tag = self.reactTag;
  NSMutableArray<NSNumber *> *descendantViewTags = [NSMutableArray new];
  [textStorage enumerateAttribute:RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                          inRange:NSMakeRange(0, textStorage.length)
                          options:0
                       usingBlock:^(RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
                         if (!shadowView) {
                           return;
                         }

                         [descendantViewTags addObject:shadowView.reactTag];
                       }];

  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    RCTTextView *textView = (RCTTextView *)viewRegistry[tag];
    if (!textView) {
      return;
    }

    NSMutableArray<UIView *> *descendantViews = [NSMutableArray arrayWithCapacity:descendantViewTags.count];
    [descendantViewTags
        enumerateObjectsUsingBlock:^(NSNumber *_Nonnull descendantViewTag, NSUInteger index, BOOL *_Nonnull stop) {
          UIView *descendantView = viewRegistry[descendantViewTag];
          if (!descendantView) {
            return;
          }

          [descendantViews addObject:descendantView];
        }];

    // Removing all references to Shadow Views to avoid unnecessary retaining.
    [textStorage removeAttribute:RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                           range:NSMakeRange(0, textStorage.length)];

    [textView setTextStorage:textStorage contentFrame:contentFrame descendantViews:descendantViews];
  }];
}

- (void)postprocessAttributedText:(NSMutableAttributedString *)attributedText
{
  // First, determine if any explicit lineHeight is set on any part of the attributed string.
  // This comes from the `lineHeight` style in JavaScript.
  __block CGFloat overallMaximumLineHeight = 0;
  __block BOOL hasExplicitLineHeight = NO;

  [attributedText enumerateAttribute:NSParagraphStyleAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:0 // Check all ranges, not just the longest effective one initially
                          usingBlock:^(NSParagraphStyle *_Nullable paragraphStyle, NSRange range, BOOL *_Nonnull stop) {
                            if (paragraphStyle && paragraphStyle.maximumLineHeight > 0) {
                              hasExplicitLineHeight = YES;
                              // Use the maximum of any specified lineHeights
                              overallMaximumLineHeight = MAX(paragraphStyle.maximumLineHeight, overallMaximumLineHeight);
                            }
                          }];

  if (!hasExplicitLineHeight) {
    // No explicit 'lineHeight' was found in any part of the attributed string.
    // Return early to preserve any existing complex attributed string styling.
    return;
  }

  // An explicit lineHeight was specified. Proceed to calculate natural text metrics
  // and apply consistent paragraph style and baseline offset for vertical centering.
  __block CGFloat maximumAscender = -CGFLOAT_MAX;
  __block CGFloat maximumDescender = CGFLOAT_MAX;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(UIFont *font, NSRange range, __unused BOOL *stop) {
                            if (!font) {
                              return;
                            }
                            maximumAscender = MAX(font.ascender, maximumAscender);
                            maximumDescender = MIN(font.descender, maximumDescender);
                          }];

  CGFloat naturalLineHeight = maximumAscender - maximumDescender;

  if (naturalLineHeight <= 0 || overallMaximumLineHeight <= 0) {
    // Avoid division by zero or invalid calculations if heights are zero/negative.
    // If overallMaximumLineHeight is 0 here, it means it was set to 0 explicitly,
    // which might imply hiding text or specific layout; let system handle default.
    return;
  }
  
  // Create a new paragraph style to apply consistently.
  NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
  paragraphStyle.minimumLineHeight = overallMaximumLineHeight;
  paragraphStyle.maximumLineHeight = overallMaximumLineHeight;
  
  // Calculate baseline offset to center text (naturalLineHeight) vertically within overallMaximumLineHeight.
  CGFloat baselineOffset = (overallMaximumLineHeight - naturalLineHeight) / 2.0;
  [attributedText addAttribute:NSBaselineOffsetAttributeName
                         value:@(baselineOffset)
                         range:NSMakeRange(0, attributedText.length)];
  
  // Apply the new paragraph style to the entire string.
  // This ensures consistent line height as specified by the maximum 'lineHeight' prop found.
  [attributedText addAttribute:NSParagraphStyleAttributeName
                         value:paragraphStyle
                         range:NSMakeRange(0, attributedText.length)];
}

- (NSAttributedString *)attributedTextWithMeasuredAttachmentsThatFitSize:(CGSize)size
{
  static UIImage *placeholderImage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    placeholderImage = [UIImage new];
  });

  NSMutableAttributedString *attributedText =
      [[NSMutableAttributedString alloc] initWithAttributedString:[self attributedTextWithBaseTextAttributes:nil]];

  [attributedText beginEditing];

  [attributedText enumerateAttribute:RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:0
                          usingBlock:^(RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
                            if (!shadowView) {
                              return;
                            }

                            CGSize fittingSize = [shadowView sizeThatFitsMinimumSize:CGSizeZero maximumSize:size];
                            NSTextAttachment *attachment = [NSTextAttachment new];
                            attachment.bounds = (CGRect){CGPointZero, fittingSize};
                            attachment.image = placeholderImage;
                            [attributedText addAttribute:NSAttachmentAttributeName value:attachment range:range];
                          }];

  [attributedText endEditing];

  return [attributedText copy];
}

- (NSTextStorage *)textStorageAndLayoutManagerThatFitsSize:(CGSize)size exclusiveOwnership:(BOOL)exclusiveOwnership
{
  NSValue *key = [NSValue valueWithCGSize:size];
  NSTextStorage *cachedTextStorage = [_cachedTextStorages objectForKey:key];

  if (cachedTextStorage) {
    if (exclusiveOwnership) {
      [_cachedTextStorages removeObjectForKey:key];
    }

    return cachedTextStorage;
  }

  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode = _maximumNumberOfLines > 0 ? _lineBreakMode : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = _maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  layoutManager.usesFontLeading = NO;
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage =
      [[NSTextStorage alloc] initWithAttributedString:[self attributedTextWithMeasuredAttachmentsThatFitSize:size]];

  [self postprocessAttributedText:textStorage];

  [textStorage addLayoutManager:layoutManager];

  if (_adjustsFontSizeToFit) {
    CGFloat minimumFontSize = MAX(_minimumFontScale * (self.textAttributes.effectiveFont.pointSize), 4.0);
    [textStorage scaleFontSizeToFitSize:size
                        minimumFontSize:minimumFontSize
                        maximumFontSize:self.textAttributes.effectiveFont.pointSize];
  }

  [self processTruncatedAttributedText:textStorage textContainer:textContainer layoutManager:layoutManager];

  if (!exclusiveOwnership) {
    [_cachedTextStorages setObject:textStorage forKey:key];
  }

  return textStorage;
}

- (void)processTruncatedAttributedText:(NSTextStorage *)textStorage
                         textContainer:(NSTextContainer *)textContainer
                         layoutManager:(NSLayoutManager *)layoutManager
{
  if (_maximumNumberOfLines > 0) {
    [layoutManager ensureLayoutForTextContainer:textContainer];
    NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
    __block int line = 0;
    [layoutManager
        enumerateLineFragmentsForGlyphRange:glyphRange
                                 usingBlock:^(
                                     CGRect rect,
                                     CGRect usedRect,
                                     NSTextContainer *_Nonnull _,
                                     NSRange lineGlyphRange,
                                     BOOL *_Nonnull stop) {
                                   if (line == textContainer.maximumNumberOfLines - 1) {
                                     NSRange truncatedRange = [layoutManager
                                         truncatedGlyphRangeInLineFragmentForGlyphAtIndex:lineGlyphRange.location];

                                     if (truncatedRange.location != NSNotFound) {
                                       NSRange characterRange =
                                           [layoutManager characterRangeForGlyphRange:truncatedRange
                                                                     actualGlyphRange:nil];
                                       if (characterRange.location > 0 && characterRange.length > 0) {
                                         // Remove color attributes for truncated range
                                         for (NSAttributedStringKey key in
                                              @[ NSForegroundColorAttributeName, NSBackgroundColorAttributeName ]) {
                                           [textStorage removeAttribute:key range:characterRange];
                                           id attribute = [textStorage attribute:key
                                                                         atIndex:characterRange.location - 1
                                                                  effectiveRange:nil];
                                           if (attribute) {
                                             [textStorage addAttribute:key value:attribute range:characterRange];
                                           }
                                         }
                                       }
                                     }
                                   }
                                   line++;
                                 }];
  }
}

- (void)layoutWithMetrics:(RCTLayoutMetrics)layoutMetrics layoutContext:(RCTLayoutContext)layoutContext
{
  // If the view got new `contentFrame`, we have to redraw it because
  // and sizes of embedded views may change.
  if (!CGRectEqualToRect(self.layoutMetrics.contentFrame, layoutMetrics.contentFrame)) {
    _needsUpdateView = YES;
  }

  if (self.textAttributes.layoutDirection != layoutMetrics.layoutDirection) {
    self.textAttributes.layoutDirection = layoutMetrics.layoutDirection;
    [self invalidateCache];
  }

  [super layoutWithMetrics:layoutMetrics layoutContext:layoutContext];
}

- (void)layoutSubviewsWithContext:(RCTLayoutContext)layoutContext
{
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:self.availableSize exclusiveOwnership:NO];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

  [textStorage
      enumerateAttribute:RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                 inRange:characterRange
                 options:0
              usingBlock:^(RCTShadowView *shadowView, NSRange range, BOOL *stop) {
                if (!shadowView) {
                  return;
                }

                CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];

                NSTextAttachment *attachment = [textStorage attribute:NSAttachmentAttributeName
                                                              atIndex:range.location
                                                       effectiveRange:nil];

                CGSize attachmentSize = attachment.bounds.size;

                UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];

                // Calculate the center of the text line
                CGFloat textLineCenter = glyphRect.origin.y + (glyphRect.size.height / 2.0);
                // Calculate the center of the attachment, then apply a small empirical vertical offset for better visual balance.
                CGFloat attachmentCenter = textLineCenter - (attachmentSize.height / 2.0) + kAttachmentVerticalOffsetPoints;

                CGRect frame = {
                    {RCTRoundPixelValue(glyphRect.origin.x),
                     RCTRoundPixelValue(attachmentCenter)},
                    {RCTRoundPixelValue(attachmentSize.width), RCTRoundPixelValue(attachmentSize.height)}};

                NSRange truncatedGlyphRange =
                    [layoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:range.location];
                BOOL viewIsTruncated = NSIntersectionRange(range, truncatedGlyphRange).length != 0;

                RCTLayoutContext localLayoutContext = layoutContext;
                localLayoutContext.absolutePosition.x += frame.origin.x;
                localLayoutContext.absolutePosition.y += frame.origin.y;

                [shadowView layoutWithMinimumSize:{shadowView.minWidth.value, shadowView.minHeight.value}
                                      maximumSize:frame.size
                                  layoutDirection:self.layoutMetrics.layoutDirection
                                    layoutContext:localLayoutContext];

                RCTLayoutMetrics localLayoutMetrics = shadowView.layoutMetrics;
                localLayoutMetrics.frame.origin =
                    frame.origin; // Reinforcing a proper frame origin for the Shadow View.
                if (viewIsTruncated) {
                  localLayoutMetrics.displayType = RCTDisplayTypeNone;
                }
                [shadowView layoutWithMetrics:localLayoutMetrics layoutContext:localLayoutContext];
              }];

  if (_onTextLayout) {
    NSMutableArray *lineData = [NSMutableArray new];
    [layoutManager enumerateLineFragmentsForGlyphRange:glyphRange
                                            usingBlock:^(
                                                CGRect overallRect,
                                                CGRect usedRect,
                                                NSTextContainer *_Nonnull usedTextContainer,
                                                NSRange lineGlyphRange,
                                                BOOL *_Nonnull stop) {
                                              NSRange range = [layoutManager characterRangeForGlyphRange:lineGlyphRange
                                                                                        actualGlyphRange:nil];
                                              NSString *renderedString = [textStorage.string substringWithRange:range];
                                              UIFont *font = [[textStorage attributedSubstringFromRange:range]
                                                       attribute:NSFontAttributeName
                                                         atIndex:0
                                                  effectiveRange:nil];
                                              [lineData addObject:@{
                                                @"text" : renderedString,
                                                @"x" : @(usedRect.origin.x),
                                                @"y" : @(usedRect.origin.y),
                                                @"width" : @(usedRect.size.width),
                                                @"height" : @(usedRect.size.height),
                                                @"descender" : @(-font.descender),
                                                @"capHeight" : @(font.capHeight),
                                                @"ascender" : @(font.ascender),
                                                @"xHeight" : @(font.xHeight),
                                              }];
                                            }];
    NSDictionary *payload = @{
      @"lines" : lineData,
    };
    _onTextLayout(payload);
  }
}

- (CGFloat)lastBaselineForSize:(CGSize)size
{
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:size exclusiveOwnership:NO];
  if (textStorage.length == 0) {
    return 0; // No text, no baseline.
  }

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  
  [layoutManager ensureLayoutForTextContainer:textContainer];
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  
  if (glyphRange.location == NSNotFound || glyphRange.length == 0) {
    return 0; // No glyphs laid out.
  }

  __block CGFloat lastLineMinY = 0.0;
  __block CGFloat lastAscender = 0.0;
  
  // Enumerate line fragments. The block is called for each line.
  // We stop after the first call because it enumerates from the end of the text backwards
  // when determining the last line for baseline purposes.
  // However, standard enumeration is from start to end. We need the *last* line.
  // The most reliable way to get the last line's metrics is to get the full range of lines
  // and then query the last one. Or, iterate and keep the last values.

  NSRange lastLineGlyphRange = [layoutManager glyphRangeForCharacterRange:NSMakeRange(textStorage.length - 1, 1) actualCharacterRange:NULL];
  if (lastLineGlyphRange.location == NSNotFound) { // Should not happen if textStorage.length > 0
      lastLineGlyphRange = glyphRange; // Fallback to overall glyph range if last char range fails
  }
  
  // Find the line fragment rect for the last line
  CGRect lastLineUsedRect = [layoutManager lineFragmentUsedRectForGlyphAtIndex:lastLineGlyphRange.location effectiveRange:NULL];
  lastLineMinY = CGRectGetMinY(lastLineUsedRect);

  // Get the font for the last line to find its ascender
  NSRange lastCharacterRange = [layoutManager characterRangeForGlyphRange:lastLineGlyphRange actualGlyphRange:nil];
  if (lastCharacterRange.location != NSNotFound && lastCharacterRange.length > 0) {
      UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:lastCharacterRange.location effectiveRange:nil];
      if (font) {
        lastAscender = font.ascender;
      }
  }
  
  // The baseline for Yoga is the distance from the top of the view to the typographic baseline of the last line.
  // This is lastLineMinY (top of the last line's usedRect) + lastAscender (font's ascent from its baseline).
  CGFloat calculatedBaseline = lastLineMinY + lastAscender;
  
  // Ensure baseline is not negative, and not outside the view's bounds (size.height) if size is non-zero.
  // Yoga expects the baseline relative to the component's top edge.
  calculatedBaseline = MAX(0, calculatedBaseline);
  if (size.height > 0) {
      // While the baseline can be theoretically anywhere, practically it should be within or near the view height.
      // This check might be too restrictive if text is aligned strangely, but often a safeguard.
      // For now, let's rely on the raw calculation unless it's negative.
      // calculatedBaseline = MIN(calculatedBaseline, size.height);
  }
  return calculatedBaseline;
}

static YGSize RCTTextShadowViewMeasure(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode)
{
  CGSize maximumSize = (CGSize){
      widthMode == YGMeasureModeUndefined ? CGFLOAT_MAX : RCTCoreGraphicsFloatFromYogaFloat(width),
      heightMode == YGMeasureModeUndefined ? CGFLOAT_MAX : RCTCoreGraphicsFloatFromYogaFloat(height),
  };

  RCTTextShadowView *shadowTextView = (__bridge RCTTextShadowView *)YGNodeGetContext(node);

  NSTextStorage *textStorage = [shadowTextView textStorageAndLayoutManagerThatFitsSize:maximumSize
                                                                    exclusiveOwnership:NO];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];
  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  CGFloat letterSpacing = shadowTextView.textAttributes.letterSpacing;
  if (!isnan(letterSpacing) && letterSpacing < 0) {
    size.width -= letterSpacing;
  }

  size = (CGSize){
      MIN(RCTCeilPixelValue(size.width), maximumSize.width), MIN(RCTCeilPixelValue(size.height), maximumSize.height)};

  // Adding epsilon value illuminates problems with converting values from
  // `double` to `float`, and then rounding them to pixel grid in Yoga.
  CGFloat epsilon = 0.001;
  return (YGSize){
      RCTYogaFloatFromCoreGraphicsFloat(size.width + epsilon),
      RCTYogaFloatFromCoreGraphicsFloat(size.height + epsilon)};
}

static float RCTTextShadowViewBaseline(YGNodeConstRef node, const float width, const float height)
{
  RCTTextShadowView *shadowTextView = (__bridge RCTTextShadowView *)YGNodeGetContext(node);
  CGSize size = (CGSize){RCTCoreGraphicsFloatFromYogaFloat(width), RCTCoreGraphicsFloatFromYogaFloat(height)};
  
  CGFloat lastBaseline = [shadowTextView lastBaselineForSize:size];
  
  // Yoga expects the baseline value as a float, positive, from the top of the component.
  return RCTYogaFloatFromCoreGraphicsFloat(MAX(0, lastBaseline));
}

@end

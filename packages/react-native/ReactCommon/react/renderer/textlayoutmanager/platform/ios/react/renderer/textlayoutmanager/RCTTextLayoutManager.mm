/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextLayoutManager.h"

#import "RCTAttributedTextUtils.h"

#import <React/NSTextStorage+FontScaling.h>
#import <React/RCTUtils.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <react/utils/SimpleThreadSafeCache.h>

using namespace facebook::react;

@implementation RCTTextLayoutManager {
  SimpleThreadSafeCache<AttributedString, std::shared_ptr<void>, 256> _cache;
}

static NSLineBreakMode RCTNSLineBreakModeFromEllipsizeMode(EllipsizeMode ellipsizeMode)
{
  switch (ellipsizeMode) {
    case EllipsizeMode::Clip:
      return NSLineBreakByClipping;
    case EllipsizeMode::Head:
      return NSLineBreakByTruncatingHead;
    case EllipsizeMode::Tail:
      return NSLineBreakByTruncatingTail;
    case EllipsizeMode::Middle:
      return NSLineBreakByTruncatingMiddle;
  }
}

- (TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                           layoutConstraints:(LayoutConstraints)layoutConstraints
{
  if (attributedString.length == 0) {
    // This is not really an optimization because that should be checked much earlier on the call stack.
    // Sometimes, very irregularly, measuring an empty string crashes/freezes iOS internal text infrastructure.
    // This is our last line of defense.
    return {};
  }

  CGSize maximumSize = CGSize{layoutConstraints.maximumSize.width, CGFLOAT_MAX};

  NSTextStorage *textStorage = [self _textStorageAndLayoutManagerWithAttributesString:attributedString
                                                                  paragraphAttributes:paragraphAttributes
                                                                                 size:maximumSize];

  return [self _measureTextStorage:textStorage];
}

- (TextMeasurement)measureAttributedString:(AttributedString)attributedString
                       paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                         layoutConstraints:(LayoutConstraints)layoutConstraints
{
  return [self measureNSAttributedString:[self _nsAttributedStringFromAttributedString:attributedString]
                     paragraphAttributes:paragraphAttributes
                       layoutConstraints:layoutConstraints];
}

- (void)drawAttributedString:(AttributedString)attributedString
         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
           drawHighlightPath:(void (^_Nullable)(UIBezierPath *highlightPath))block
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

#if TARGET_OS_MACCATALYST
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSaveGState(context);
  CGContextSetShouldSmoothFonts(context, NO);
#endif

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  [self processTruncatedAttributedText:textStorage textContainer:textContainer layoutManager:layoutManager];

  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:frame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:frame.origin];

#if TARGET_OS_MACCATALYST
  CGContextRestoreGState(context);
#endif

  if (block != nil) {
    __block UIBezierPath *highlightPath = nil;
    NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

    [textStorage
        enumerateAttribute:RCTAttributedStringIsHighlightedAttributeName
                   inRange:characterRange
                   options:0
                usingBlock:^(NSNumber *value, NSRange range, __unused BOOL *stop) {
                  if (!value.boolValue) {
                    return;
                  }

                  [layoutManager
                      enumerateEnclosingRectsForGlyphRange:range
                                  withinSelectedGlyphRange:range
                                           inTextContainer:textContainer
                                                usingBlock:^(CGRect enclosingRect, __unused BOOL *anotherStop) {
                                                  UIBezierPath *path = [UIBezierPath
                                                      bezierPathWithRoundedRect:CGRectInset(enclosingRect, -2, -2)
                                                                   cornerRadius:2];
                                                  if (highlightPath) {
                                                    [highlightPath appendPath:path];
                                                  } else {
                                                    highlightPath = path;
                                                  }
                                                }];
                }];

    block(highlightPath);
  }
}

- (void)processTruncatedAttributedText:(NSTextStorage *)textStorage
                         textContainer:(NSTextContainer *)textContainer
                         layoutManager:(NSLayoutManager *)layoutManager
{
  if (textContainer.maximumNumberOfLines > 0) {
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

- (LinesMeasurements)getLinesForAttributedString:(facebook::react::AttributedString)attributedString
                             paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                            size:(CGSize)size
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  std::vector<LineMeasurement> paragraphLines{};
  auto blockParagraphLines = &paragraphLines;

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
                                            auto rect = facebook::react::Rect{
                                                facebook::react::Point{usedRect.origin.x, usedRect.origin.y},
                                                facebook::react::Size{usedRect.size.width, usedRect.size.height}};

                                            CGFloat baseline = [layoutManager locationForGlyphAtIndex:range.location].y;
                                            auto line = LineMeasurement{
                                                std::string([renderedString UTF8String]),
                                                rect,
                                                overallRect.size.height - baseline,
                                                font.capHeight,
                                                baseline,
                                                font.xHeight};
                                            blockParagraphLines->push_back(line);
                                          }];
  return paragraphLines;
}

- (NSTextStorage *)_textStorageAndLayoutManagerWithAttributesString:(NSAttributedString *)attributedString
                                                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                               size:(CGSize)size
{
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode = paragraphAttributes.maximumNumberOfLines > 0
      ? RCTNSLineBreakModeFromEllipsizeMode(paragraphAttributes.ellipsizeMode)
      : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  layoutManager.usesFontLeading = NO;
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedString];

  RCTApplyBaselineOffset(textStorage);

  [textStorage addLayoutManager:layoutManager];

  if (paragraphAttributes.adjustsFontSizeToFit) {
    CGFloat minimumFontSize = !isnan(paragraphAttributes.minimumFontSize) ? paragraphAttributes.minimumFontSize : 4.0;
    CGFloat maximumFontSize = !isnan(paragraphAttributes.maximumFontSize) ? paragraphAttributes.maximumFontSize : 96.0;
    [textStorage scaleFontSizeToFitSize:size minimumFontSize:minimumFontSize maximumFontSize:maximumFontSize];
  }

  return textStorage;
}

- (SharedEventEmitter)getEventEmitterWithAttributeString:(AttributedString)attributedString
                                     paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                   frame:(CGRect)frame
                                                 atPoint:(CGPoint)point
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  CGFloat fraction;
  NSUInteger characterIndex = [layoutManager characterIndexForPoint:point
                                                    inTextContainer:textContainer
                           fractionOfDistanceBetweenInsertionPoints:&fraction];

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (textStorage.length > 0 && (fraction > 0 || characterIndex > 0) &&
      (fraction < 1 || characterIndex < textStorage.length - 1)) {
    NSData *eventEmitterWrapper = (NSData *)[textStorage attribute:RCTAttributedStringEventEmitterKey
                                                           atIndex:characterIndex
                                                    effectiveRange:NULL];
    return RCTUnwrapEventEmitter(eventEmitterWrapper);
  }

  return nil;
}

- (void)getRectWithAttributedString:(AttributedString)attributedString
                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(RCTTextLayoutFragmentEnumerationBlock)block
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

  [textStorage enumerateAttribute:enumerateAttribute
                          inRange:characterRange
                          options:0
                       usingBlock:^(NSString *value, NSRange range, BOOL *pause) {
                         if (!value) {
                           return;
                         }

                         [layoutManager
                             enumerateEnclosingRectsForGlyphRange:range
                                         withinSelectedGlyphRange:range
                                                  inTextContainer:textContainer
                                                       usingBlock:^(CGRect enclosingRect, BOOL *_Nonnull stop) {
                                                         block(
                                                             enclosingRect,
                                                             [textStorage attributedSubstringFromRange:range].string,
                                                             value);
                                                         *stop = YES;
                                                       }];
                       }];
}

#pragma mark - Private

- (NSAttributedString *)_nsAttributedStringFromAttributedString:(AttributedString)attributedString
{
  auto sharedNSAttributedString = _cache.get(attributedString, [](AttributedString attributedString) {
    return wrapManagedObject(RCTNSAttributedStringFromAttributedString(attributedString));
  });

  return unwrapManagedObject(sharedNSAttributedString);
}

- (TextMeasurement)_measureTextStorage:(NSTextStorage *)textStorage
{
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  __block BOOL textDidWrap = NO;
  [layoutManager
      enumerateLineFragmentsForGlyphRange:glyphRange
                               usingBlock:^(
                                   CGRect overallRect,
                                   CGRect usedRect,
                                   NSTextContainer *_Nonnull usedTextContainer,
                                   NSRange lineGlyphRange,
                                   BOOL *_Nonnull stop) {
                                 NSRange range = [layoutManager characterRangeForGlyphRange:lineGlyphRange
                                                                           actualGlyphRange:nil];
                                 NSUInteger lastCharacterIndex = range.location + range.length - 1;
                                 BOOL endsWithNewLine =
                                     [textStorage.string characterAtIndex:lastCharacterIndex] == '\n';
                                 if (!endsWithNewLine && textStorage.string.length > lastCharacterIndex + 1) {
                                   textDidWrap = YES;
                                   *stop = YES;
                                 }
                               }];

  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  if (textDidWrap) {
    size.width = textContainer.size.width;
  }

  size = (CGSize){RCTCeilPixelValue(size.width), RCTCeilPixelValue(size.height)};

  __block auto attachments = TextMeasurement::Attachments{};

  [textStorage
      enumerateAttribute:NSAttachmentAttributeName
                 inRange:NSMakeRange(0, textStorage.length)
                 options:0
              usingBlock:^(NSTextAttachment *attachment, NSRange range, BOOL *stop) {
                if (!attachment) {
                  return;
                }

                CGSize attachmentSize = attachment.bounds.size;
                CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];

                CGRect frame;
                CGFloat baseline = [layoutManager locationForGlyphAtIndex:range.location].y;

                frame = {{glyphRect.origin.x, glyphRect.origin.y + baseline - attachmentSize.height}, attachmentSize};

                auto rect = facebook::react::Rect{
                    facebook::react::Point{frame.origin.x, frame.origin.y},
                    facebook::react::Size{frame.size.width, frame.size.height}};

                attachments.push_back(TextMeasurement::Attachment{rect, false});
              }];

  return TextMeasurement{{size.width, size.height}, attachments};
}

@end

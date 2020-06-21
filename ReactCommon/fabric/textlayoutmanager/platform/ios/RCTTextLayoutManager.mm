/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextLayoutManager.h"

#import "NSTextStorage+FontScaling.h"
#import "RCTAttributedTextUtils.h"

#import <React/RCTUtils.h>
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

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

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

                UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];

                CGRect frame = {{glyphRect.origin.x,
                                 glyphRect.origin.y + glyphRect.size.height - attachmentSize.height + font.descender},
                                attachmentSize};

                auto rect = facebook::react::Rect{facebook::react::Point{frame.origin.x, frame.origin.y},
                                                  facebook::react::Size{frame.size.width, frame.size.height}};

                attachments.push_back(TextMeasurement::Attachment{rect, false});
              }];

  return TextMeasurement{{size.width, size.height}, attachments};
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
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:frame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:frame.origin];
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
    RCTWeakEventEmitterWrapper *eventEmitterWrapper =
        (RCTWeakEventEmitterWrapper *)[textStorage attribute:RCTAttributedStringEventEmitterKey
                                                     atIndex:characterIndex
                                              effectiveRange:NULL];
    return eventEmitterWrapper.eventEmitter;
  }

  return nil;
}

- (NSAttributedString *)_nsAttributedStringFromAttributedString:(AttributedString)attributedString
{
  auto sharedNSAttributedString = _cache.get(attributedString, [](AttributedString attributedString) {
    return wrapManagedObject(RCTNSAttributedStringFromAttributedString(attributedString));
  });

  return unwrapManagedObject(sharedNSAttributedString);
}

@end

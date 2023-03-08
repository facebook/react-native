/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/renderer/attributedstring/AttributedString.h>
#import <react/renderer/attributedstring/ParagraphAttributes.h>
#import <react/renderer/core/LayoutConstraints.h>
#import <react/renderer/textlayoutmanager/TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 @abstract Enumeration block for text fragments.
*/

using RCTTextLayoutFragmentEnumerationBlock =
    void (^)(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value);

/**
 * iOS-specific TextLayoutManager
 */
@interface RCTTextLayoutManager : NSObject

- (facebook::react::TextMeasurement)measureAttributedString:(facebook::react::AttributedString)attributedString
                                        paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                          layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                                                textStorage:(NSTextStorage *_Nullable)textStorage;

- (facebook::react::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                            layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                                                  textStorage:(NSTextStorage *_Nullable)textStorage;

- (NSTextStorage *)textStorageForAttributesString:(facebook::react::AttributedString)attributedString
                              paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                             size:(CGSize)size;

- (void)drawAttributedString:(facebook::react::AttributedString)attributedString
         paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
                 textStorage:(NSTextStorage *_Nullable)textStorage;

- (facebook::react::LinesMeasurements)getLinesForAttributedString:(facebook::react::AttributedString)attributedString
                                              paragraphAttributes:
                                                  (facebook::react::ParagraphAttributes)paragraphAttributes
                                                             size:(CGSize)size;

- (facebook::react::SharedEventEmitter)
    getEventEmitterWithAttributeString:(facebook::react::AttributedString)attributedString
                   paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

- (void)getRectWithAttributedString:(facebook::react::AttributedString)attributedString
                paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(RCTTextLayoutFragmentEnumerationBlock)block;

@end

NS_ASSUME_NONNULL_END

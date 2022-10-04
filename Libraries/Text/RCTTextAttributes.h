/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTTextDecorationLineType.h>
#import <React/RCTDynamicTypeRamp.h>
#import <React/RCTFontSmoothing.h> // TODO(OSS Candidate ISS#2710739)

#import "RCTTextTransform.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const RCTTextAttributesIsHighlightedAttributeName;
extern NSString *const RCTTextAttributesFontSmoothingAttributeName;  // TODO(OSS Candidate ISS#2710739)
extern NSString *const RCTTextAttributesTagAttributeName;

/**
 * Represents knowledge about all supported *text* attributes
 * assigned to some text component such as <Text>, <VirtualText>,
 * and <TextInput>.
 */
@interface RCTTextAttributes : NSObject <NSCopying>

// Color
@property (nonatomic, strong, nullable) RCTUIColor *foregroundColor; // TODO(OSS Candidate ISS#2710739)
@property (nonatomic, strong, nullable) RCTUIColor *backgroundColor; // TODO(OSS Candidate ISS#2710739)
@property (nonatomic, assign) CGFloat opacity;
// Font
@property (nonatomic, copy, nullable) NSString *fontFamily;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, assign) CGFloat fontSizeMultiplier;
@property (nonatomic, assign) CGFloat maxFontSizeMultiplier;
@property (nonatomic, copy, nullable) NSString *fontWeight;
@property (nonatomic, copy, nullable) NSString *fontStyle;
@property (nonatomic, copy, nullable) NSArray<NSString *> *fontVariant;
@property (nonatomic, assign) BOOL allowFontScaling;
@property (nonatomic, assign) RCTDynamicTypeRamp dynamicTypeRamp;
@property (nonatomic, assign) CGFloat letterSpacing;
@property (nonatomic, assign) RCTFontSmoothing fontSmoothing; // TODO(OSS Candidate ISS#2710739)
@property (class, nonatomic, assign) RCTFontSmoothing fontSmoothingDefault; // TODO(OSS Candidate ISS#2710739)
// Paragraph Styles
@property (nonatomic, assign) CGFloat lineHeight;
@property (nonatomic, assign) NSTextAlignment alignment;
@property (nonatomic, assign) NSWritingDirection baseWritingDirection;
// Decoration
@property (nonatomic, strong, nullable) RCTUIColor *textDecorationColor; // TODO(OSS Candidate ISS#2710739)
@property (nonatomic, assign) NSUnderlineStyle textDecorationStyle;
@property (nonatomic, assign) RCTTextDecorationLineType textDecorationLine;
// Shadow
@property (nonatomic, assign) CGSize textShadowOffset;
@property (nonatomic, assign) CGFloat textShadowRadius;
@property (nonatomic, strong, nullable) RCTUIColor *textShadowColor; // TODO(OSS Candidate ISS#2710739)
// Special
@property (nonatomic, assign) BOOL isHighlighted;
@property (nonatomic, strong, nullable) NSNumber *tag;
@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;
@property (nonatomic, assign) RCTTextTransform textTransform;

#pragma mark - Inheritance

- (void)applyTextAttributes:(RCTTextAttributes *)textAttributes;

#pragma mark - Adapters

/**
 * Text attributes in NSAttributedString terms.
 */
- (NSDictionary<NSAttributedStringKey, id> *)effectiveTextAttributes;

/**
 * Constructed paragraph style.
 */
- (NSParagraphStyle *_Nullable)effectiveParagraphStyle;

/**
 * Constructed font.
 */
- (UIFont *)effectiveFont;

/**
 * Font size multiplier reflects `allowFontScaling`, `fontSizeMultiplier`, and `maxFontSizeMultiplier`.
 */
- (CGFloat)effectiveFontSizeMultiplier;

/**
 * Foreground and background colors with opacity and right defaults.
 */
- (RCTUIColor *)effectiveForegroundColor; // TODO(OSS Candidate ISS#2710739)
- (RCTUIColor *)effectiveBackgroundColor; // TODO(OSS Candidate ISS#2710739)

/**
 * Text transformed per 'none', 'uppercase', 'lowercase', 'capitalize'
 */
- (NSString *)applyTextAttributesToText:(NSString *)text;

@end

NS_ASSUME_NONNULL_END

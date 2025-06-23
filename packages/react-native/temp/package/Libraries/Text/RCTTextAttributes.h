/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDynamicTypeRamp.h>
#import <React/RCTTextDecorationLineType.h>

#import "RCTTextTransform.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const RCTTextAttributesIsHighlightedAttributeName;
extern NSString *const RCTTextAttributesTagAttributeName;

/**
 * Represents knowledge about all supported *text* attributes
 * assigned to some text component such as <Text>, <VirtualText>,
 * and <TextInput>.
 */
@interface RCTTextAttributes : NSObject <NSCopying>

// Color
@property (nonatomic, strong, nullable) UIColor *foregroundColor;
@property (nonatomic, strong, nullable) UIColor *backgroundColor;
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
// Paragraph Styles
@property (nonatomic, assign) CGFloat lineHeight;
@property (nonatomic, assign) NSTextAlignment alignment;
@property (nonatomic, assign) NSWritingDirection baseWritingDirection;
@property (nonatomic, assign) NSLineBreakStrategy lineBreakStrategy;
@property (nonatomic, assign) NSLineBreakMode lineBreakMode;
// Decoration
@property (nonatomic, strong, nullable) UIColor *textDecorationColor;
@property (nonatomic, assign) NSUnderlineStyle textDecorationStyle;
@property (nonatomic, assign) RCTTextDecorationLineType textDecorationLine;
// Shadow
@property (nonatomic, assign) CGSize textShadowOffset;
@property (nonatomic, assign) CGFloat textShadowRadius;
@property (nonatomic, strong, nullable) UIColor *textShadowColor;
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
- (UIColor *)effectiveForegroundColor;
- (UIColor *)effectiveBackgroundColor;

/**
 * Text transformed per 'none', 'uppercase', 'lowercase', 'capitalize'
 */
- (NSString *)applyTextAttributesToText:(NSString *)text;

@end

NS_ASSUME_NONNULL_END

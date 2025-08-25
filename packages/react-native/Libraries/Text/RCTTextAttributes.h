/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDynamicTypeRamp.h>
#import <React/RCTTextDecorationLineType.h>
#import <React/RCTTextTransform.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

NS_ASSUME_NONNULL_BEGIN

extern NSString *const RCTTextAttributesIsHighlightedAttributeName
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
extern NSString *const RCTTextAttributesTagAttributeName
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * Represents knowledge about all supported *text* attributes
 * assigned to some text component such as <Text>, <VirtualText>,
 * and <TextInput>.
 */
@interface RCTTextAttributes : NSObject <NSCopying>

// Color
@property (nonatomic, strong, nullable) UIColor *foregroundColor
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, strong, nullable) UIColor *backgroundColor
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat opacity
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
// Font
@property (nonatomic, copy, nullable) NSString *fontFamily
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat fontSize
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat fontSizeMultiplier
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat maxFontSizeMultiplier
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) NSString *fontWeight
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) NSString *fontStyle
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) NSArray<NSString *> *fontVariant
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL allowFontScaling
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) RCTDynamicTypeRamp dynamicTypeRamp
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat letterSpacing
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
// Paragraph Styles
@property (nonatomic, assign) CGFloat lineHeight
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSTextAlignment alignment
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSWritingDirection baseWritingDirection
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSLineBreakStrategy lineBreakStrategy
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSLineBreakMode lineBreakMode
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
// Decoration
@property (nonatomic, strong, nullable) UIColor *textDecorationColor
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSUnderlineStyle textDecorationStyle
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) RCTTextDecorationLineType textDecorationLine
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
// Shadow
@property (nonatomic, assign) CGSize textShadowOffset
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat textShadowRadius
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, strong, nullable) UIColor *textShadowColor
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
// Special
@property (nonatomic, assign) BOOL isHighlighted
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, strong, nullable) NSNumber *tag
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) RCTTextTransform textTransform
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

#pragma mark - Inheritance

- (void)applyTextAttributes:(RCTTextAttributes *)textAttributes
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

#pragma mark - Adapters

/**
 * Text attributes in NSAttributedString terms.
 */
- (NSDictionary<NSAttributedStringKey, id> *)effectiveTextAttributes
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * Constructed paragraph style.
 */
- (NSParagraphStyle *_Nullable)effectiveParagraphStyle
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * Constructed font.
 */
- (UIFont *)effectiveFont __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * Font size multiplier reflects `allowFontScaling`, `fontSizeMultiplier`, and `maxFontSizeMultiplier`.
 */
- (CGFloat)effectiveFontSizeMultiplier
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * Foreground and background colors with opacity and right defaults.
 */
- (UIColor *)effectiveForegroundColor
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
- (UIColor *)effectiveBackgroundColor
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * Text transformed per 'none', 'uppercase', 'lowercase', 'capitalize'
 */
- (NSString *)applyTextAttributesToText:(NSString *)text
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

NS_ASSUME_NONNULL_END

#endif // RCT_FIT_RM_OLD_COMPONENT

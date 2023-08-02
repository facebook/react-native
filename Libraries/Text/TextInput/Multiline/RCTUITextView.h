/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import "RCTTextUIKit.h" // [macOS]

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextView... but much better!
 */
@interface RCTUITextView : UITextView <RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL contextMenuHidden;
#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, assign, readonly) BOOL textWasPasted;
#else // [macOS
@property (nonatomic, assign) BOOL textWasPasted;
#endif // macOS]
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) RCTUIColor *placeholderColor; // [macOS]

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

#if !TARGET_OS_OSX // [macOS]
// The `clearButtonMode` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;
#endif // [macOS]

@property (nonatomic, assign) BOOL caretHidden;

@property (nonatomic, strong, nullable) NSString *inputAccessoryViewID;

#if TARGET_OS_OSX // [macOS
@property (nonatomic, getter=isScrollEnabled) BOOL scrollEnabled;
@property (nonatomic, strong, nullable) RCTUIColor *selectionColor;
@property (nonatomic, strong, nullable) RCTUIColor *cursorColor;
@property (nonatomic, assign) UIEdgeInsets textContainerInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, assign) CGFloat pointScaleFactor;
- (NSSize)sizeThatFits:(NSSize)size;
- (void)setReadablePasteBoardTypes:(NSArray<NSPasteboardType> *)readablePasteboardTypes;
#endif // macOS]

@property (nonatomic, getter=isGhostTextChanging) BOOL ghostTextChanging; // [macOS]

@end

NS_ASSUME_NONNULL_END

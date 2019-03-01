/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <RCTText/RCTTextUIKit.h> // TODO(macOS ISS#2323203)

#import "RCTBackedTextInputViewProtocol.h"

#import "RCTBackedTextInputDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextView... but much better!
 */
@interface RCTUITextView : UITextView <RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL contextMenuHidden;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@property (nonatomic, assign, readonly) BOOL textWasPasted;
#else // [TODO(macOS ISS#2323203)
@property (nonatomic, assign) BOOL textWasPasted;
#endif // ]TODO(macOS ISS#2323203)
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
// The `clearButtonMode` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;
#endif // TODO(macOS ISS#2323203)

// The `caretHidden` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) BOOL caretHidden;

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, strong, nullable) UIColor *selectionColor;
@property (nonatomic, assign) UIEdgeInsets textContainerInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
- (NSSize)sizeThatFits:(NSSize)size;
#endif // ]TODO(macOS ISS#2323203)

@end

NS_ASSUME_NONNULL_END

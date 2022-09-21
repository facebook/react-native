/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import "RCTTextUIKit.h" // TODO(macOS GH#774)

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTBackedTextInputDelegate.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextView... but much better!
 */
@interface RCTUITextView : UITextView <RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL contextMenuHidden;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, assign, readonly) BOOL textWasPasted;
#else // [TODO(macOS GH#774)
@property (nonatomic, assign) BOOL textWasPasted;
#endif // ]TODO(macOS GH#774)
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) RCTUIColor *placeholderColor; // TODO(OSS Candidate ISS#2710739)

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
// The `clearButtonMode` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;
#endif // TODO(macOS GH#774)

@property (nonatomic, assign) BOOL caretHidden;

@property (nonatomic, strong, nullable) NSString *inputAccessoryViewID;

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, strong, nullable) RCTUIColor *selectionColor; // TODO(OSS Candidate ISS#2710739)
@property (nonatomic, assign) UIEdgeInsets textContainerInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
- (NSSize)sizeThatFits:(NSSize)size;
- (void)setReadablePasteBoardTypes:(NSArray<NSPasteboardType> *)readablePasteboardTypes;
#endif // ]TODO(macOS GH#774)

@end

NS_ASSUME_NONNULL_END

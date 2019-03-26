/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <RCTText/RCTTextUIKit.h> // TODO(macOS ISS#2323203)

#import "RCTBackedTextInputViewProtocol.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextField... but much better!
 */
@interface RCTUITextField : UITextField <RCTBackedTextInputViewProtocol>

- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL contextMenuHidden;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@property (nonatomic, assign, readonly) BOOL textWasPasted;
#else // [TODO(macOS ISS#2323203)
@property (nonatomic, assign) BOOL textWasPasted;
#endif // ]TODO(macOS ISS#2323203)
@property (nonatomic, strong, nullable) UIColor *placeholderColor;
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@property (nonatomic, assign, getter=isEditable) BOOL editable;
#else // [TODO(macOS ISS#2323203)
@property (assign, getter=isEditable) BOOL editable;
#endif
#if TARGET_OS_OSX
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy, nullable) NSString *text;
@property (nonatomic, getter=isAutomaticTextReplacementEnabled) BOOL automaticTextReplacementEnabled;
@property (nonatomic, getter=isAutomaticSpellingCorrectionEnabled) BOOL automaticSpellingCorrectionEnabled;
@property (nonatomic, strong, nullable) UIColor *selectionColor;
@property (weak, nullable) id<RCTUITextFieldDelegate> delegate;
#endif // ]TODO(macOS ISS#2323203)

@end

NS_ASSUME_NONNULL_END

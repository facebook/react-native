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
 * Just regular UITextField... but much better!
 */
#if RCT_SUBCLASS_SECURETEXTFIELD
@interface RCTUISecureTextField : NSSecureTextField <RCTBackedTextInputViewProtocol>
#else
@interface RCTUITextField : UITextField <RCTBackedTextInputViewProtocol>
#endif

- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL contextMenuHidden;
#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, assign, readonly) BOOL textWasPasted;
#else // [macOS
@property (nonatomic, assign) BOOL textWasPasted;
#endif // macOS]
@property (nonatomic, strong, nullable) RCTUIColor *placeholderColor; // [macOS]
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, assign, getter=isEditable) BOOL editable;
#else // [macOS
@property (assign, getter=isEditable) BOOL editable;
#endif // macOS]
@property (nonatomic, getter=isScrollEnabled) BOOL scrollEnabled;
@property (nonatomic, strong, nullable) NSString *inputAccessoryViewID;
@property (nonatomic, assign, readonly) CGFloat zoomScale;
@property (nonatomic, assign, readonly) CGPoint contentOffset;
@property (nonatomic, assign, readonly) UIEdgeInsets contentInset;

#if TARGET_OS_OSX // [macOS
@property (nonatomic, copy, nullable) NSString *text;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy) NSDictionary<NSAttributedStringKey, id> *defaultTextAttributes;
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, getter=isAutomaticTextReplacementEnabled) BOOL automaticTextReplacementEnabled;
@property (nonatomic, getter=isAutomaticSpellingCorrectionEnabled) BOOL automaticSpellingCorrectionEnabled;
@property (nonatomic, getter=isContinuousSpellCheckingEnabled) BOOL continuousSpellCheckingEnabled;
@property (nonatomic, getter=isGrammarCheckingEnabled) BOOL grammarCheckingEnabled;
@property (nonatomic, assign) BOOL enableFocusRing;
@property (nonatomic, strong, nullable) RCTUIColor *selectionColor;
@property (weak, nullable) id<RCTUITextFieldDelegate> delegate;
@property (nonatomic, assign) CGFloat pointScaleFactor;
#endif // macOS]

@property (nonatomic, getter=isGhostTextChanging) BOOL ghostTextChanging; // [macOS]

@end

NS_ASSUME_NONNULL_END

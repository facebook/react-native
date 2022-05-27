/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [TODO(macOS GH#774)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
NS_ASSUME_NONNULL_BEGIN
@protocol RCTUITextFieldDelegate <NSTextFieldDelegate>
@optional
- (BOOL)textField:(NSTextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string;   // return NO to not change text
- (void)textFieldBeginEditing:(NSTextField *)textField;
- (void)textFieldDidChange:(NSTextField *)textField;
- (void)textFieldEndEditing:(NSTextField *)textField;
- (void)textFieldDidChangeSelection:(NSTextField *)textField;
@end
NS_ASSUME_NONNULL_END
#endif // ]TODO(macOS GH#774)

@protocol RCTBackedTextInputDelegate;
@class RCTTextAttributes;

NS_ASSUME_NONNULL_BEGIN

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@protocol RCTBackedTextInputViewProtocol <UITextInput>
#else // [TODO(macOS GH#774)
@protocol RCTBackedTextInputViewProtocol
#endif // ]TODO(macOS GH#774)

@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) RCTUIColor *placeholderColor; // TODO(OSS Candidate ISS#2710739)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, assign, readonly) BOOL textWasPasted;
#else // [TODO(macOS GH#774)
@property (nonatomic, assign) BOOL textWasPasted;
#endif // ]TODO(macOS GH#774)
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, strong, nullable) UIView *inputAccessoryView;
@property (nonatomic, strong, nullable) UIView *inputView;
#endif // TODO(macOS GH#774)
@property (nonatomic, weak, nullable) id<RCTBackedTextInputDelegate> textInputDelegate;
@property (nonatomic, readonly) CGSize contentSize;
@property (nonatomic, strong, nullable) NSDictionary<NSAttributedStringKey,id> *defaultTextAttributes;
@property (nonatomic, assign) BOOL contextMenuHidden;
@property (nonatomic, assign, getter=isEditable) BOOL editable;
@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL enablesReturnKeyAutomatically;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;
#endif // TODO(macOS GH#774)
@property (nonatomic, getter=isScrollEnabled) BOOL scrollEnabled;
@property (nonatomic, strong, nullable) NSString *inputAccessoryViewID;
@property (nonatomic, assign, readonly) CGFloat zoomScale;
@property (nonatomic, assign, readonly) CGPoint contentOffset;
@property (nonatomic, assign, readonly) UIEdgeInsets contentInset;


// This protocol disallows direct access to `selectedTextRange` property because
// unwise usage of it can break the `delegate` behavior. So, we always have to
// explicitly specify should `delegate` be notified about the change or not.
// If the change was initiated programmatically, we must NOT notify the delegate.
// If the change was a result of user actions (like typing or touches), we MUST notify the delegate.
#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)setSelectedTextRange:(nullable UITextRange *)selectedTextRange NS_UNAVAILABLE;
- (void)setSelectedTextRange:(nullable UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate;
#else // [TODO(macOS GH#774)
- (NSRange)selectedTextRange;
- (void)setSelectedTextRange:(NSRange)selectedTextRange NS_UNAVAILABLE;
- (void)setSelectedTextRange:(NSRange)selectedTextRange notifyDelegate:(BOOL)notifyDelegate;
#endif // ]TODO(macOS GH#774)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
// UITextInput method for OSX
- (CGSize)sizeThatFits:(CGSize)size;
#endif // ]TODO(macOS GH#774)

// This protocol disallows direct access to `text` property because
// unwise usage of it can break the `attributeText` behavior.
// Use `attributedText.string` instead.
@property (nonatomic, copy, nullable) NSString *text NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

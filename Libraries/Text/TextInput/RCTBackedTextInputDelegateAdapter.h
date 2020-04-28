/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextUIKit.h> // TODO(macOS ISS#2323203)

NS_ASSUME_NONNULL_BEGIN

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

@protocol RCTBackedTextInputViewProtocol; // TODO(OSS Candidate ISS#2710739)
@protocol RCTBackedTextInputDelegate; // TODO(OSS Candidate ISS#2710739)

@interface RCTBackedTextFieldDelegateAdapter : NSObject

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInputView;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
#else // [TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange;
#endif // ]TODO(macOS ISS#2323203)
- (void)selectedTextRangeWasSet;

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter : NSObject

- (instancetype)initWithTextView:(UITextView<RCTBackedTextInputViewProtocol> *)backedTextInputView;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
#else // [TODO(macOS ISS#2323203)
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange;
#endif // ]TODO(macOS ISS#2323203)

@end

NS_ASSUME_NONNULL_END

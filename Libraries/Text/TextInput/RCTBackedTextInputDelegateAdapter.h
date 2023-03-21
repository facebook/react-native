/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextUIKit.h> // [macOS]

#import "RCTBackedTextInputDelegate.h"
#import "RCTBackedTextInputViewProtocol.h"

NS_ASSUME_NONNULL_BEGIN

#pragma mark - RCTBackedTextFieldDelegateAdapter (for UITextField)

@protocol RCTBackedTextInputViewProtocol; // [macOS]
@protocol RCTBackedTextInputDelegate; // [macOS]

@interface RCTBackedTextFieldDelegateAdapter : NSObject

- (instancetype)initWithTextField:(UITextField<RCTBackedTextInputViewProtocol> *)backedTextInputView;

#if !TARGET_OS_OSX // [macOS]
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
#else // [macOS
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange;
#endif // macOS]
- (void)selectedTextRangeWasSet;

@end

#pragma mark - RCTBackedTextViewDelegateAdapter (for UITextView)

@interface RCTBackedTextViewDelegateAdapter : NSObject

- (instancetype)initWithTextView:(UITextView<RCTBackedTextInputViewProtocol> *)backedTextInputView;

#if !TARGET_OS_OSX // [macOS]
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange;
#else // [macOS
- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(NSRange)textRange;
#endif // macOS]

@end

NS_ASSUME_NONNULL_END

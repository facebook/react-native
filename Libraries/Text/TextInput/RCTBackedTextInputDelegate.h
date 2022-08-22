/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

@protocol RCTBackedTextInputViewProtocol;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTBackedTextInputDelegate <NSObject>

- (BOOL)textInputShouldBeginEditing; // Return `NO` to disallow editing.
- (void)textInputDidBeginEditing;

- (BOOL)textInputShouldEndEditing; // Return `YES` to allow editing to stop and to resign first responder status. `NO` to disallow the editing session to end.
- (void)textInputDidEndEditing; // May be called if forced even if `textInputShouldEndEditing` returns `NO` (e.g. view removed from window) or `[textInput endEditing:YES]` called.

- (BOOL)textInputShouldReturn; // May be called right before `textInputShouldEndEditing` if "Return" button was pressed.
- (void)textInputDidReturn;

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)automaticSpellingCorrectionDidChange:(BOOL)enabled;
- (void)continuousSpellCheckingDidChange:(BOOL)enabled;
- (void)grammarCheckingDidChange:(BOOL)enabled;
#endif // ]TODO(macOS GH#774)

/*
 * Called before any change in the TextInput. The delegate has the opportunity to change the replacement string or reject the change completely.
 * To change the replacement, return the changed version of the `text`.
 * To accept the change, return `text` argument as-is.
 * To reject the change, return `nil`.
 */
- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range;
- (void)textInputDidChange;

- (void)textInputDidChangeSelection;

- (BOOL)textInputShouldHandleDeleteBackward:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the deleteBackward event handled normally. Return `NO` to disallow it and handle it yourself. TODO(OSS Candidate ISS#2710739)
#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (BOOL)textInputShouldHandleDeleteForward:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the deleteForward event handled normally. Return `NO` to disallow it and handle it yourself.

- (void)textInputDidCancel;  // Handle `Escape` key press.
#endif // ]TODO(macOS GH#774)

@optional
- (void)scrollViewDidScroll:(RCTUIScrollView *)scrollView; // TODO(macOS GH#774)

@end

NS_ASSUME_NONNULL_END

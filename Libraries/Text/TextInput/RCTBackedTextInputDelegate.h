/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

@protocol RCTBackedTextInputViewProtocol;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTBackedTextInputDelegate <NSObject>

- (BOOL)textInputShouldBeginEditing; // Return `NO` to disallow editing.
- (void)textInputDidBeginEditing;

- (BOOL)textInputShouldEndEditing; // Return `YES` to allow editing to stop and to resign first responder status. `NO` to disallow the editing session to end.
- (void)textInputDidEndEditing; // May be called if forced even if `textInputShouldEndEditing` returns `NO` (e.g. view removed from window) or `[textInput endEditing:YES]` called.

- (BOOL)textInputShouldReturn; // May be called right before `textInputShouldEndEditing` if "Return" button was pressed.
- (void)textInputDidReturn;

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)string; // Return NO to not change text.
- (void)textInputDidChange;

- (void)textInputDidChangeSelection;

- (BOOL)textInputShouldHandleDeleteBackward:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the deleteBackward event handled normally. Return `NO` to disallow it and handle it yourself. TODO(OSS Candidate ISS#2710739)
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (BOOL)textInputShouldHandleDeleteForward:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the deleteForward event handled normally. Return `NO` to disallow it and handle it yourself.
#endif  // ]TODO(macOS ISS#2323203)

@end

NS_ASSUME_NONNULL_END

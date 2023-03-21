/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@protocol RCTBackedTextInputViewProtocol;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTBackedTextInputDelegate <NSObject>

- (BOOL)textInputShouldBeginEditing; // Return `NO` to disallow editing.
- (void)textInputDidBeginEditing;

- (BOOL)textInputShouldEndEditing; // Return `YES` to allow editing to stop and to resign first responder status. `NO`
                                   // to disallow the editing session to end.
- (void)textInputDidEndEditing; // May be called if forced even if `textInputShouldEndEditing` returns `NO` (e.g. view
                                // removed from window) or `[textInput endEditing:YES]` called.

- (BOOL)textInputShouldReturn; // May be called right before `textInputShouldEndEditing` if "Return" button was pressed.
                               // Dismisses keyboard if true
- (void)textInputDidReturn;

#if TARGET_OS_OSX // [macOS
- (void)automaticSpellingCorrectionDidChange:(BOOL)enabled;
- (void)continuousSpellCheckingDidChange:(BOOL)enabled;
- (void)grammarCheckingDidChange:(BOOL)enabled;
- (void)submitOnKeyDownIfNeeded:(NSEvent *)event;
#endif // macOS]

- (BOOL)textInputShouldSubmitOnReturn; // Checks whether to submit when return is pressed and emits an event if true.

/*
 * Called before any change in the TextInput. The delegate has the opportunity to change the replacement string or
 * reject the change completely. To change the replacement, return the changed version of the `text`. To accept the
 * change, return `text` argument as-is. To reject the change, return `nil`.
 */
- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range;
- (void)textInputDidChange;

- (void)textInputDidChangeSelection;

- (BOOL)textInputShouldHandleDeleteBackward:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the deleteBackward event handled normally. Return `NO` to disallow it and handle it yourself. // [macOS]
#if TARGET_OS_OSX // [macOS
- (BOOL)textInputShouldHandleDeleteForward:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the deleteForward event handled normally. Return `NO` to disallow it and handle it yourself.
- (BOOL)textInputShouldHandleKeyEvent:(NSEvent *)event; // Return `YES` to have the key event handled normally. Return `NO` to disallow it and handle it yourself.
- (BOOL)hasValidKeyDownOrValidKeyUp:(NSString *)key;
- (NSDragOperation)textInputDraggingEntered:(id<NSDraggingInfo>)draggingInfo;
- (void)textInputDraggingExited:(id<NSDraggingInfo>)draggingInfo;
- (BOOL)textInputShouldHandleDragOperation:(id<NSDraggingInfo>)draggingInfo;
- (void)textInputDidCancel;  // Handle `Escape` key press.
- (BOOL)textInputShouldHandlePaste:(id<RCTBackedTextInputViewProtocol>)sender; // Return `YES` to have the paste event handled normally. Return `NO` to disallow it and handle it yourself.
#endif // macOS]

@optional
- (void)scrollViewDidScroll:(RCTUIScrollView *)scrollView; // [macOS]

@end

NS_ASSUME_NONNULL_END

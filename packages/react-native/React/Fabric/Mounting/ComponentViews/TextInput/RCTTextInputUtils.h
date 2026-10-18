/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <optional>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <react/renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void RCTCopyBackedTextInput(
    UIView<RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType RCTUITextAutocorrectionTypeFromOptionalBool(std::optional<bool> autoCorrect);

UITextAutocapitalizationType RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    facebook::react::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance RCTUIKeyboardAppearanceFromKeyboardAppearance(
    facebook::react::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType RCTUITextSpellCheckingTypeFromOptionalBool(std::optional<bool> spellCheck);

UITextFieldViewMode RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    facebook::react::TextInputAccessoryVisibilityMode mode);

UIKeyboardType RCTUIKeyboardTypeFromKeyboardType(facebook::react::KeyboardType keyboardType);

UIReturnKeyType RCTUIReturnKeyTypeFromReturnKeyType(facebook::react::ReturnKeyType returnKeyType);

UITextContentType RCTUITextContentTypeFromString(const std::string &contentType);

UITextInputPasswordRules *RCTUITextInputPasswordRulesFromString(const std::string &passwordRules);

UITextSmartInsertDeleteType RCTUITextSmartInsertDeleteTypeFromOptionalBool(std::optional<bool> smartInsertDelete);

/*
 * The range of `oldText` that an edit replaced to give `newText`: what lies between their common prefix and their
 * common suffix, widened so it does not split a composed character sequence (an emoji, a flag, a letter with
 * combining marks). The inserted text is `newText` over the same location, `newText.length - oldText.length + length`
 * long.
 */
NSRange RCTTextInputChangedRange(NSString *oldText, NSString *newText);

/*
 * The user typed while JS's text was being written into a focused text input: UIKit delivers keys queued behind
 * `-setAttributedText:` inside it, and the write replaces them. Given the input's text before the write
 * (`textBeforeUpdate`), what it held with the keys typed during the write (`typedText`), and the text JS wrote
 * (`writtenText`), sets the range of `writtenText` to replace and the text to put there, and returns YES; returns NO
 * if there is nothing to put back. If JS changed only attributes, the user's edit applies where it was made. If JS
 * changed the characters (e.g. upper-casing), only an insertion is put back, at the same distance from the end.
 */
BOOL RCTTextInputTextToRestore(
    NSString *textBeforeUpdate,
    NSString *typedText,
    NSString *writtenText,
    NSRange *range,
    NSString *_Nullable *_Nonnull text);

/*
 * `text` cut to `allowedLength` (`maxLength`) without splitting a composed character sequence, or nil if no
 * character fits.
 */
NSString *_Nullable RCTTextInputTextWithinLength(NSString *text, NSInteger allowedLength);

/*
 * Where `offset` in a text lies after `range` of it was replaced by `insertedLength` characters: an offset at or after
 * the end of the range moves with the text after it, an offset inside the range or at its start moves to the end of
 * the insertion (the caret of a user who typed over the range).
 */
NSInteger RCTTextInputOffsetAfterEdit(NSInteger offset, NSRange range, NSUInteger insertedLength);

#if !TARGET_OS_TV
UIDataDetectorTypes RCTUITextViewDataDetectorTypesFromStringVector(const std::vector<std::string> &dataDetectorTypes);
#endif

NS_ASSUME_NONNULL_END

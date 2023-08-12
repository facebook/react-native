/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import <optional>

#import <React/RCTUIKit.h> // [macOS]
#import <React/RCTUITextField.h> // [macOS]
#import <React/RCTUITextView.h> // [macOS]

#import <optional>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <react/renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void RCTCopyBackedTextInput(
#if !TARGET_OS_OSX // [macOS]
    RCTUIView<RCTBackedTextInputViewProtocol> *fromTextInput,
    RCTUIView<RCTBackedTextInputViewProtocol> *toTextInput
#else // [macOS
    RCTUITextView<RCTBackedTextInputViewProtocol> *fromTextInput,
    RCTUITextView<RCTBackedTextInputViewProtocol> *toTextInput
#endif // macOS]
);

#if !TARGET_OS_OSX // [macOS]
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

UITextContentType RCTUITextContentTypeFromString(std::string const &contentType);

UITextInputPasswordRules *RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);
#endif // [macOS]

NS_ASSUME_NONNULL_END

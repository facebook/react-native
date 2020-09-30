/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <better/optional.h>
#import <react/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void RCTCopyBackedTextInput(
    UIView<RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType RCTUITextAutocorrectionTypeFromOptionalBool(facebook::better::optional<bool> autoCorrect);

UITextAutocapitalizationType RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    facebook::react::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance RCTUIKeyboardAppearanceFromKeyboardAppearance(
    facebook::react::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType RCTUITextSpellCheckingTypeFromOptionalBool(facebook::better::optional<bool> spellCheck);

UITextFieldViewMode RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    facebook::react::TextInputAccessoryVisibilityMode mode);

UIKeyboardType RCTUIKeyboardTypeFromKeyboardType(facebook::react::KeyboardType keyboardType);

UIReturnKeyType RCTUIReturnKeyTypeFromReturnKeyType(facebook::react::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextInputUtils.h"

#import <React/RCTConversions.h>

using namespace facebook::react;

static NSAttributedString *RCTSanitizeAttributedString(NSAttributedString *attributedString)
{
  // Here we need to remove text attributes specific to particular kind of TextInput on iOS (e.g. limiting line number).
  // TODO: Implement it properly.
  return [[NSAttributedString alloc] initWithString:attributedString.string];
}

void RCTCopyBackedTextInput(
    UIView<RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<RCTBackedTextInputViewProtocol> *toTextInput)
{
  toTextInput.attributedText = RCTSanitizeAttributedString(fromTextInput.attributedText);
  toTextInput.placeholder = fromTextInput.placeholder;
  toTextInput.placeholderColor = fromTextInput.placeholderColor;
  toTextInput.textContainerInset = fromTextInput.textContainerInset;
  toTextInput.inputAccessoryView = fromTextInput.inputAccessoryView;
  toTextInput.textInputDelegate = fromTextInput.textInputDelegate;
  toTextInput.placeholderColor = fromTextInput.placeholderColor;
  toTextInput.defaultTextAttributes = fromTextInput.defaultTextAttributes;
  toTextInput.autocapitalizationType = fromTextInput.autocapitalizationType;
  toTextInput.autocorrectionType = fromTextInput.autocorrectionType;
  toTextInput.contextMenuHidden = fromTextInput.contextMenuHidden;
  toTextInput.editable = fromTextInput.editable;
  toTextInput.enablesReturnKeyAutomatically = fromTextInput.enablesReturnKeyAutomatically;
  toTextInput.keyboardAppearance = fromTextInput.keyboardAppearance;
  toTextInput.spellCheckingType = fromTextInput.spellCheckingType;
  toTextInput.caretHidden = fromTextInput.caretHidden;
  toTextInput.clearButtonMode = fromTextInput.clearButtonMode;
  toTextInput.scrollEnabled = fromTextInput.scrollEnabled;
  toTextInput.secureTextEntry = fromTextInput.secureTextEntry;
  toTextInput.keyboardType = fromTextInput.keyboardType;
  toTextInput.textContentType = fromTextInput.textContentType;

  if (@available(iOS 12.0, *)) {
    toTextInput.passwordRules = fromTextInput.passwordRules;
  }

  [toTextInput setSelectedTextRange:fromTextInput.selectedTextRange notifyDelegate:NO];
}

UITextAutocorrectionType RCTUITextAutocorrectionTypeFromOptionalBool(facebook::butter::optional<bool> autoCorrect)
{
  return autoCorrect.has_value() ? (*autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo)
                                 : UITextAutocorrectionTypeDefault;
}

UITextAutocapitalizationType RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    AutocapitalizationType autocapitalizationType)
{
  switch (autocapitalizationType) {
    case AutocapitalizationType::None:
      return UITextAutocapitalizationTypeNone;
    case AutocapitalizationType::Words:
      return UITextAutocapitalizationTypeWords;
    case AutocapitalizationType::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case AutocapitalizationType::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
  }
}

UIKeyboardAppearance RCTUIKeyboardAppearanceFromKeyboardAppearance(KeyboardAppearance keyboardAppearance)
{
  switch (keyboardAppearance) {
    case KeyboardAppearance::Default:
      return UIKeyboardAppearanceDefault;
    case KeyboardAppearance::Light:
      return UIKeyboardAppearanceLight;
    case KeyboardAppearance::Dark:
      return UIKeyboardAppearanceDark;
  }
}

UITextSpellCheckingType RCTUITextSpellCheckingTypeFromOptionalBool(facebook::butter::optional<bool> spellCheck)
{
  return spellCheck.has_value() ? (*spellCheck ? UITextSpellCheckingTypeYes : UITextSpellCheckingTypeNo)
                                : UITextSpellCheckingTypeDefault;
}

UITextFieldViewMode RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    facebook::react::TextInputAccessoryVisibilityMode mode)
{
  switch (mode) {
    case TextInputAccessoryVisibilityMode::Never:
      return UITextFieldViewModeNever;
    case TextInputAccessoryVisibilityMode::WhileEditing:
      return UITextFieldViewModeWhileEditing;
    case TextInputAccessoryVisibilityMode::UnlessEditing:
      return UITextFieldViewModeUnlessEditing;
    case TextInputAccessoryVisibilityMode::Always:
      return UITextFieldViewModeAlways;
  }
}

UIKeyboardType RCTUIKeyboardTypeFromKeyboardType(KeyboardType keyboardType)
{
  switch (keyboardType) {
    // Universal
    case KeyboardType::Default:
      return UIKeyboardTypeDefault;
    case KeyboardType::EmailAddress:
      return UIKeyboardTypeEmailAddress;
    case KeyboardType::Numeric:
      return UIKeyboardTypeDecimalPad;
    case KeyboardType::PhonePad:
      return UIKeyboardTypePhonePad;
    case KeyboardType::NumberPad:
      return UIKeyboardTypeNumberPad;
    case KeyboardType::DecimalPad:
      return UIKeyboardTypeDecimalPad;
    // iOS-only
    case KeyboardType::ASCIICapable:
      return UIKeyboardTypeASCIICapable;
    case KeyboardType::NumbersAndPunctuation:
      return UIKeyboardTypeNumbersAndPunctuation;
    case KeyboardType::URL:
      return UIKeyboardTypeURL;
    case KeyboardType::NamePhonePad:
      return UIKeyboardTypeNamePhonePad;
    case KeyboardType::Twitter:
      return UIKeyboardTypeTwitter;
    case KeyboardType::WebSearch:
      return UIKeyboardTypeWebSearch;
    case KeyboardType::ASCIICapableNumberPad:
      return UIKeyboardTypeASCIICapableNumberPad;
    // Android-only
    case KeyboardType::VisiblePassword:
      return UIKeyboardTypeDefault;
  }
}

UIReturnKeyType RCTUIReturnKeyTypeFromReturnKeyType(ReturnKeyType returnKeyType)
{
  switch (returnKeyType) {
    case ReturnKeyType::Default:
      return UIReturnKeyDefault;
    case ReturnKeyType::Done:
      return UIReturnKeyDone;
    case ReturnKeyType::Go:
      return UIReturnKeyGo;
    case ReturnKeyType::Next:
      return UIReturnKeyNext;
    case ReturnKeyType::Search:
      return UIReturnKeySearch;
    case ReturnKeyType::Send:
      return UIReturnKeySend;
    // iOS-only
    case ReturnKeyType::EmergencyCall:
      return UIReturnKeyEmergencyCall;
    case ReturnKeyType::Google:
      return UIReturnKeyGoogle;
    case ReturnKeyType::Join:
      return UIReturnKeyJoin;
    case ReturnKeyType::Route:
      return UIReturnKeyRoute;
    case ReturnKeyType::Yahoo:
      return UIReturnKeyYahoo;
    case ReturnKeyType::Continue:
      return UIReturnKeyContinue;
    // Android-only
    case ReturnKeyType::None:
    case ReturnKeyType::Previous:
      return UIReturnKeyDefault;
  }
}

API_AVAILABLE(ios(10.0))
UITextContentType RCTUITextContentTypeFromString(std::string const &contentType)
{
  static dispatch_once_t onceToken;
  static NSDictionary<NSString *, NSString *> *contentTypeMap;

  dispatch_once(&onceToken, ^{
    NSMutableDictionary<NSString *, NSString *> *mutableContentTypeMap = [@{
      @"" : @"",
      @"none" : @"",
      @"URL" : UITextContentTypeURL,
      @"addressCity" : UITextContentTypeAddressCity,
      @"addressCityAndState" : UITextContentTypeAddressCityAndState,
      @"addressState" : UITextContentTypeAddressState,
      @"countryName" : UITextContentTypeCountryName,
      @"creditCardNumber" : UITextContentTypeCreditCardNumber,
      @"emailAddress" : UITextContentTypeEmailAddress,
      @"familyName" : UITextContentTypeFamilyName,
      @"fullStreetAddress" : UITextContentTypeFullStreetAddress,
      @"givenName" : UITextContentTypeGivenName,
      @"jobTitle" : UITextContentTypeJobTitle,
      @"location" : UITextContentTypeLocation,
      @"middleName" : UITextContentTypeMiddleName,
      @"name" : UITextContentTypeName,
      @"namePrefix" : UITextContentTypeNamePrefix,
      @"nameSuffix" : UITextContentTypeNameSuffix,
      @"nickname" : UITextContentTypeNickname,
      @"organizationName" : UITextContentTypeOrganizationName,
      @"postalCode" : UITextContentTypePostalCode,
      @"streetAddressLine1" : UITextContentTypeStreetAddressLine1,
      @"streetAddressLine2" : UITextContentTypeStreetAddressLine2,
      @"sublocality" : UITextContentTypeSublocality,
      @"telephoneNumber" : UITextContentTypeTelephoneNumber,
      @"username" : UITextContentTypeUsername,
      @"password" : UITextContentTypePassword,
    } mutableCopy];

    if (@available(iOS 12.0, *)) {
      [mutableContentTypeMap addEntriesFromDictionary:@{
        @"newPassword" : UITextContentTypeNewPassword,
        @"oneTimeCode" : UITextContentTypeOneTimeCode
      }];
    }

    contentTypeMap = [mutableContentTypeMap copy];
  });

  return contentTypeMap[RCTNSStringFromString(contentType)] ?: @"";
}

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *RCTUITextInputPasswordRulesFromString(std::string const &passwordRules)
{
  return [UITextInputPasswordRules passwordRulesWithDescriptor:RCTNSStringFromStringNilIfEmpty(passwordRules)];
}

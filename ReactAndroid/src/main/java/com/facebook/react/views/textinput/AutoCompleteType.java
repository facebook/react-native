package com.facebook.react.views.textinput;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import androidx.autofill.HintConstants;

/**
 Autocomplete types used by previous React Native used to be provided by android.view.View

 There are now many many more supported hints, specified by androidx.autofill.HintConstants
 https://developer.android.com/reference/androidx/autofill/HintConstants

 These are mapped to the standard defined by W3C for `autocomplete` where possible to provide the
 basis for a cross platform property (iOS and Android are distinct for similar functionality but
 could be consolidated eventually under this standard)
 https://www.w3.org/TR/WCAG21/#input-purposes
 https://www.w3.org/TR/html52/sec-forms.html#sec-autofill

 There are a few values we can get from the system that are not represented by the standard, but
 are super useful in a mobile environment (particularly one time passcodes), so have extended
 where appropriate

 // W3C `autocomplete` provided values

 "name"
 "honorific-prefix"
 "given-name"
 "additional-name"
 "family-name"
 "honorific-suffix"
 "username"
 "new-password"
 "current-password"
 "street-address"
 "address-line1"
 "address-level2"
 "address-level1"
 "country"
 "country-name"
 "postal-code"
 "cc-name"
 "cc-given-name"
 "cc-additional-name"
 "cc-family-name"
 "cc-number"
 "cc-exp"
 "cc-exp-month"
 "cc-exp-year"
 "cc-exp-csc"
 "bday"
 "bday-day"
 "bday-month"
 "bday-year"
 "sex"
 "tel"
 "tel-country-code"
 "tel-national"
 "email"

 // extensions - the standard doesn't define anything for these useful additions

 "otp"
 "otp-char-1"
 "otp-char-2"
 "otp-char-3"
 "otp-char-4"
 "otp-char-5"
 "otp-char-6"
 "otp-char-7"
 "otp-char-8"
 "tel-device"
 "cc-exp-day"
 "extended-address"
 "postal-code-extended"
 "additional-name-inititial"
 "new-username"
 "password"

 // W3C `autocomplete` values not able to be mapped...

 "nickname"
 "organization-title"
 "organization"
 "address-line2"
 "address-line3"
 "address-level4"
 "address-level3"
 "cc-type"
 "transaction-currency"
 "transaction-amount"
 "language"
 "url"
 "photo"
 "tel-area-code"
 "tel-local"
 "tel-local-prefix"
 "tel-local-suffix"
 "tel-extension"
 "impp"

*/
public enum AutoCompleteType {
  NAME_FULL("name"),
  NAME_HONORIFIC_PREFIX("honorific-prefix"),
  NAME_GIVEN("given-name"),
  NAME_ADDITIONAL("additional-name"),
  NAME_FAMILY("family-name"),
  NAME_HONORIFIC_SUFFIX("honorific-suffix"),

  USERNAME("username"),
  PASSWORD_NEW("new-password"),
  PASSWORD_CURRENT("current-password"),

  ADDRESS_FULL("street-address"),
  ADDRESS_LINE_1("address-line1"),
  ADDRESS_LOCALITY("address-level2"),
  ADDRESS_REGION("address-level1"),
  ADDRESS_COUNTRY("country"),
  ADDRESS_COUNTRY_NAME("country-name"),
  ADDRESS_POSTAL_CODE("postal-code"),

  CREDIT_CARD_NUMBER("cc-number"),
  CREDIT_CARD_EXPIRATION_DATE("cc-exp"),
  CREDIT_CARD_EXPIRATION_MONTH("cc-exp-month"),
  CREDIT_CARD_EXPIRATION_YEAR("cc-exp-year"),
  CREDIT_CARD_SECURITY_CODE("cc-exp-csc"),
  CREDIT_CARD_NAME_FULL("cc-name"),
  CREDIT_CARD_NAME_GIVEN("cc-given-name"),
  CREDIT_CARD_NAME_ADDITIONAL("cc-additional-name"),
  CREDIT_CARD_NAME_FAMILY("cc-family-name"),

  BIRTH_DATE_FULL("bday"),
  BIRTH_DATE_DAY("bday-day"),
  BIRTH_DATE_MONTH("bday-month"),
  BIRTH_DATE_YEAR("bday-year"),

  GENDER("sex"),

  TELELPHONE_NUMBER("tel"),
  TELELPHONE_NUMBER_COUNTRY_CODE("tel-country-code"),
  TELELPHONE_NUMBER_NATIONAL("tel-national"),

  EMAIL("email"),

  // extensions - the standard doesn't define anything for these useful additions

  NON_W3C_OTP("otp"),
  NON_W3C_OTP_CHAR_1("otp-char-1"),
  NON_W3C_OTP_CHAR_2("otp-char-2"),
  NON_W3C_OTP_CHAR_3("otp-char-3"),
  NON_W3C_OTP_CHAR_4("otp-char-4"),
  NON_W3C_OTP_CHAR_5("otp-char-5"),
  NON_W3C_OTP_CHAR_6("otp-char-6"),
  NON_W3C_OTP_CHAR_7("otp-char-7"),
  NON_W3C_OTP_CHAR_8("otp-char-8"),
  NON_W3C_TELEPHONE_NUMBER_DEVICE("tel-device"),
  NON_W3C_CREDIT_CARD_EXPIRATION_DAY("cc-exp-day"),
  NON_W3C_ADDRESS_EXTENDED_ADDRESS("extended-address"),
  NON_W3C_ADDRESS_EXTENDED_POSTAL_CODE("postal-code-extended"),
  NON_W3C_NAME_ADDITIONAL_INITIAL("additional-name-initial"),
  NON_W3C_USERNAME_NEW("new-username"),
  NON_W3C_PASSWORD("password");

  private final String mValue;
  private static final Map<String, AutoCompleteType> LOOKUP;
  private static final Map<AutoCompleteType, String> HINTS_LOOKUP;

  AutoCompleteType(final String value) {
    mValue = value;
  }

  public String toString() {
    return mValue;
  }

  public String toAutofillHint() {
    return HINTS_LOOKUP.get(this);
  }

  public static AutoCompleteType get(final String value) throws IllegalArgumentException {
    final AutoCompleteType autoCompleteType = LOOKUP.get(value);
    if (autoCompleteType == null) {
      throw new IllegalArgumentException("Unknown enum value: " + value);
    }
    return autoCompleteType;
  }

  public static boolean has(final String value) {
    try {
      AutoCompleteType.get(value);
    } catch (final IllegalArgumentException e) {
      return false;
    }
    return true;
  }

  static {
    final Map<String, AutoCompleteType> lookup = new HashMap();
    for (AutoCompleteType item: AutoCompleteType.values()) {
      lookup.put(item.toString(), item);
    }
    LOOKUP = Collections.unmodifiableMap(lookup);

    // map W3C stanndard values to AndroidX hint names to the  values for backward compatibility
    final Map<AutoCompleteType, String> hintLookup = new HashMap();

    hintLookup.put(NAME_FULL, HintConstants.AUTOFILL_HINT_PERSON_NAME);
    hintLookup.put(NAME_HONORIFIC_PREFIX, HintConstants.AUTOFILL_HINT_PERSON_NAME_PREFIX);
    hintLookup.put(NAME_GIVEN, HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN);
    hintLookup.put(NAME_ADDITIONAL, HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE);
    hintLookup.put(NAME_FAMILY, HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY);
    hintLookup.put(NAME_HONORIFIC_SUFFIX, HintConstants.AUTOFILL_HINT_PERSON_NAME_SUFFIX);
    hintLookup.put(USERNAME, HintConstants.AUTOFILL_HINT_USERNAME);
    hintLookup.put(PASSWORD_NEW, HintConstants.AUTOFILL_HINT_NEW_PASSWORD);
    hintLookup.put(PASSWORD_CURRENT, HintConstants.AUTOFILL_HINT_PASSWORD);
    hintLookup.put(ADDRESS_FULL, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS);
    hintLookup.put(ADDRESS_LINE_1, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_STREET_ADDRESS);
    hintLookup.put(ADDRESS_LOCALITY, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_LOCALITY);
    hintLookup.put(ADDRESS_REGION, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_REGION);
    hintLookup.put(ADDRESS_COUNTRY, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_COUNTRY);
    hintLookup.put(ADDRESS_COUNTRY_NAME, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_COUNTRY);
    hintLookup.put(ADDRESS_POSTAL_CODE, HintConstants.AUTOFILL_HINT_POSTAL_CODE);
    hintLookup.put(CREDIT_CARD_NAME_FULL, HintConstants.AUTOFILL_HINT_PERSON_NAME);
    hintLookup.put(CREDIT_CARD_NAME_GIVEN, HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN);
    hintLookup.put(CREDIT_CARD_NAME_ADDITIONAL, HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE);
    hintLookup.put(CREDIT_CARD_NAME_FAMILY, HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY);
    hintLookup.put(CREDIT_CARD_NUMBER,  HintConstants.AUTOFILL_HINT_CREDIT_CARD_NUMBER);
    hintLookup.put(CREDIT_CARD_EXPIRATION_DATE, HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE);
    hintLookup.put(CREDIT_CARD_EXPIRATION_MONTH, HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH);
    hintLookup.put(CREDIT_CARD_EXPIRATION_YEAR, HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR);
    hintLookup.put(CREDIT_CARD_SECURITY_CODE, HintConstants.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE);
    hintLookup.put(BIRTH_DATE_FULL, HintConstants.AUTOFILL_HINT_BIRTH_DATE_FULL);
    hintLookup.put(BIRTH_DATE_DAY, HintConstants.AUTOFILL_HINT_BIRTH_DATE_DAY);
    hintLookup.put(BIRTH_DATE_MONTH, HintConstants.AUTOFILL_HINT_BIRTH_DATE_MONTH);
    hintLookup.put(BIRTH_DATE_YEAR, HintConstants.AUTOFILL_HINT_BIRTH_DATE_YEAR);
    hintLookup.put(GENDER, HintConstants.AUTOFILL_HINT_GENDER);
    hintLookup.put(TELELPHONE_NUMBER, HintConstants.AUTOFILL_HINT_PHONE_NUMBER);
    hintLookup.put(TELELPHONE_NUMBER_COUNTRY_CODE, HintConstants.AUTOFILL_HINT_PHONE_COUNTRY_CODE);
    hintLookup.put(TELELPHONE_NUMBER_NATIONAL, HintConstants.AUTOFILL_HINT_PHONE_NATIONAL);
    hintLookup.put(EMAIL, HintConstants.AUTOFILL_HINT_EMAIL_ADDRESS);
    hintLookup.put(NON_W3C_OTP, HintConstants.AUTOFILL_HINT_SMS_OTP);
    hintLookup.put(NON_W3C_OTP_CHAR_1, HintConstants.generateSmsOtpHintForCharacterPosition(1));
    hintLookup.put(NON_W3C_OTP_CHAR_2, HintConstants.generateSmsOtpHintForCharacterPosition(2));
    hintLookup.put(NON_W3C_OTP_CHAR_3, HintConstants.generateSmsOtpHintForCharacterPosition(3));
    hintLookup.put(NON_W3C_OTP_CHAR_4, HintConstants.generateSmsOtpHintForCharacterPosition(4));
    hintLookup.put(NON_W3C_OTP_CHAR_5, HintConstants.generateSmsOtpHintForCharacterPosition(5));
    hintLookup.put(NON_W3C_OTP_CHAR_6, HintConstants.generateSmsOtpHintForCharacterPosition(6));
    hintLookup.put(NON_W3C_OTP_CHAR_7, HintConstants.generateSmsOtpHintForCharacterPosition(7));
    hintLookup.put(NON_W3C_OTP_CHAR_8, HintConstants.generateSmsOtpHintForCharacterPosition(8));
    hintLookup.put(NON_W3C_TELEPHONE_NUMBER_DEVICE, HintConstants.AUTOFILL_HINT_PHONE_NUMBER_DEVICE);
    hintLookup.put(NON_W3C_CREDIT_CARD_EXPIRATION_DAY, HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY);
    hintLookup.put(NON_W3C_ADDRESS_EXTENDED_ADDRESS, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_ADDRESS);
    hintLookup.put(NON_W3C_ADDRESS_EXTENDED_POSTAL_CODE, HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_POSTAL_CODE);
    hintLookup.put(NON_W3C_NAME_ADDITIONAL_INITIAL, HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE_INITIAL);
    hintLookup.put(NON_W3C_USERNAME_NEW, HintConstants.AUTOFILL_HINT_NEW_USERNAME);
    hintLookup.put(NON_W3C_PASSWORD, HintConstants.AUTOFILL_HINT_PASSWORD);

    HINTS_LOOKUP = Collections.unmodifiableMap(hintLookup);
  }

}

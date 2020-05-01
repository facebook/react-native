/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const DeprecatedColorPropType = require('./DeprecatedColorPropType');
const DeprecatedViewPropTypes = require('./DeprecatedViewPropTypes');
const PropTypes = require('prop-types');
const Text = require('../Text/Text');

const DataDetectorTypes = [
  'phoneNumber',
  'link',
  'address',
  'calendarEvent',
  'none',
  'all',
];

module.exports = {
  ...DeprecatedViewPropTypes,
  /**
   * Can tell `TextInput` to automatically capitalize certain characters.
   *
   * - `characters`: all characters.
   * - `words`: first letter of each word.
   * - `sentences`: first letter of each sentence (*default*).
   * - `none`: don't auto capitalize anything.
   */
  autoCapitalize: (PropTypes.oneOf([
    'none',
    'sentences',
    'words',
    'characters',
  ]): React$PropType$Primitive<'none' | 'sentences' | 'words' | 'characters'>),
  /**
   * Determines which content to suggest on auto complete, e.g.`username`.
   * To disable auto complete, use `off`.
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `username`
   * - `password`
   * - `email`
   * - `name`
   * - `tel`
   * - `street-address`
   * - `postal-code`
   * - `cc-number`
   * - `cc-csc`
   * - `cc-exp`
   * - `cc-exp-month`
   * - `cc-exp-year`
   * - `off`
   *
   * @platform android
   */
  autoCompleteType: (PropTypes.oneOf([
    'cc-csc',
    'cc-exp',
    'cc-exp-month',
    'cc-exp-year',
    'cc-number',
    'email',
    'name',
    'password',
    'postal-code',
    'street-address',
    'tel',
    'username',
    'off',
  ]): React$PropType$Primitive<
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'email'
    | 'name'
    | 'password'
    | 'postal-code'
    | 'street-address'
    | 'tel'
    | 'username'
    | 'off',
  >),
  /**
   * If `false`, disables auto-correct. The default value is `true`.
   */
  autoCorrect: PropTypes.bool,
  /**
   * If `false`, disables spell-check style (i.e. red underlines).
   * The default value is inherited from `autoCorrect`.
   * @platform ios
   */
  spellCheck: PropTypes.bool,
  /**
   * If `true`, focuses the input on `componentDidMount`.
   * The default value is `false`.
   */
  autoFocus: PropTypes.bool,
  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings. The
   * default is `true`.
   */
  allowFontScaling: PropTypes.bool,
  /**
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier: PropTypes.number,
  /**
   * If `false`, text is not editable. The default value is `true`.
   */
  editable: PropTypes.bool,
  /**
   * Determines which keyboard to open, e.g.`numeric`.
   *
   * The following values work across platforms:
   *
   * - `default`
   * - `numeric`
   * - `number-pad`
   * - `decimal-pad`
   * - `email-address`
   * - `phone-pad`
   *
   * *iOS Only*
   *
   * The following values work on iOS only:
   *
   * - `ascii-capable`
   * - `numbers-and-punctuation`
   * - `url`
   * - `name-phone-pad`
   * - `twitter`
   * - `web-search`
   * - `ascii-capable-number-pad`
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `visible-password`
   */
  keyboardType: (PropTypes.oneOf([
    // Cross-platform
    'default',
    'email-address',
    'numeric',
    'phone-pad',
    'number-pad',
    // iOS-only
    'ascii-capable',
    'numbers-and-punctuation',
    'url',
    'name-phone-pad',
    'decimal-pad',
    'twitter',
    'web-search',
    // iOS 10+ only
    'ascii-capable-number-pad',
    // Android-only
    'visible-password',
  ]): React$PropType$Primitive<
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'number-pad'
    | 'ascii-capable'
    | 'numbers-and-punctuation'
    | 'url'
    | 'name-phone-pad'
    | 'decimal-pad'
    | 'twitter'
    | 'web-search'
    | 'ascii-capable-number-pad'
    | 'visible-password',
  >),
  /**
   * Determines the color of the keyboard.
   * @platform ios
   */
  keyboardAppearance: (PropTypes.oneOf([
    'default',
    'light',
    'dark',
  ]): React$PropType$Primitive<'default' | 'light' | 'dark'>),
  /**
   * Determines how the return key should look. On Android you can also use
   * `returnKeyLabel`.
   *
   * *Cross platform*
   *
   * The following values work across platforms:
   *
   * - `done`
   * - `go`
   * - `next`
   * - `search`
   * - `send`
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `none`
   * - `previous`
   *
   * *iOS Only*
   *
   * The following values work on iOS only:
   *
   * - `default`
   * - `emergency-call`
   * - `google`
   * - `join`
   * - `route`
   * - `yahoo`
   */
  returnKeyType: (PropTypes.oneOf([
    // Cross-platform
    'done',
    'go',
    'next',
    'search',
    'send',
    // Android-only
    'none',
    'previous',
    // iOS-only
    'default',
    'emergency-call',
    'google',
    'join',
    'route',
    'yahoo',
  ]): React$PropType$Primitive<
    | 'done'
    | 'go'
    | 'next'
    | 'search'
    | 'send'
    | 'none'
    | 'previous'
    | 'default'
    | 'emergency-call'
    | 'google'
    | 'join'
    | 'route'
    | 'yahoo',
  >),
  /**
   * Sets the return key to the label. Use it instead of `returnKeyType`.
   * @platform android
   */
  returnKeyLabel: PropTypes.string,
  /**
   * Limits the maximum number of characters that can be entered. Use this
   * instead of implementing the logic in JS to avoid flicker.
   */
  maxLength: PropTypes.number,
  /**
   * Sets the number of lines for a `TextInput`. Use it with multiline set to
   * `true` to be able to fill the lines.
   * @platform android
   */
  numberOfLines: PropTypes.number,
  /**
   * When `false`, if there is a small amount of space available around a text input
   * (e.g. landscape orientation on a phone), the OS may choose to have the user edit
   * the text inside of a full screen text input mode. When `true`, this feature is
   * disabled and users will always edit the text directly inside of the text input.
   * Defaults to `false`.
   * @platform android
   */
  disableFullscreenUI: PropTypes.bool,
  /**
   * If `true`, the keyboard disables the return key when there is no text and
   * automatically enables it when there is text. The default value is `false`.
   * @platform ios
   */
  enablesReturnKeyAutomatically: PropTypes.bool,
  /**
   * If `true`, the text input can be multiple lines.
   * The default value is `false`.
   */
  multiline: PropTypes.bool,
  /**
   * Set text break strategy on Android API Level 23+, possible values are `simple`, `highQuality`, `balanced`
   * The default value is `simple`.
   * @platform android
   */
  textBreakStrategy: (PropTypes.oneOf([
    'simple',
    'highQuality',
    'balanced',
  ]): React$PropType$Primitive<'simple' | 'highQuality' | 'balanced'>),
  /**
   * Callback that is called when the text input is blurred.
   */
  onBlur: PropTypes.func,
  /**
   * Callback that is called when the text input is focused.
   */
  onFocus: PropTypes.func,
  /**
   * Callback that is called when the text input's text changes.
   */
  onChange: PropTypes.func,
  /**
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   */
  onChangeText: PropTypes.func,
  /**
   * Callback that is called when the text input's content size changes.
   * This will be called with
   * `{ nativeEvent: { contentSize: { width, height } } }`.
   *
   * Only called for multiline text inputs.
   */
  onContentSizeChange: PropTypes.func,
  onTextInput: PropTypes.func,
  /**
   * Callback that is called when text input ends.
   */
  onEndEditing: PropTypes.func,
  /**
   * Callback that is called when the text input selection is changed.
   * This will be called with
   * `{ nativeEvent: { selection: { start, end } } }`.
   */
  onSelectionChange: PropTypes.func,
  /**
   * Callback that is called when the text input's submit button is pressed.
   * Invalid if `multiline={true}` is specified.
   */
  onSubmitEditing: PropTypes.func,
  /**
   * Callback that is called when a key is pressed.
   * This will be called with `{ nativeEvent: { key: keyValue } }`
   * where `keyValue` is `'Enter'` or `'Backspace'` for respective keys and
   * the typed-in character otherwise including `' '` for space.
   * Fires before `onChange` callbacks.
   */
  onKeyPress: PropTypes.func,
  /**
   * Invoked on mount and layout changes with `{x, y, width, height}`.
   */
  onLayout: PropTypes.func,
  /**
   * Invoked on content scroll with `{ nativeEvent: { contentOffset: { x, y } } }`.
   * May also contain other properties from ScrollEvent but on Android contentSize
   * is not provided for performance reasons.
   */
  onScroll: PropTypes.func,
  /**
   * The string that will be rendered before text input has been entered.
   */
  placeholder: PropTypes.string,
  /**
   * The text color of the placeholder string.
   */
  placeholderTextColor: DeprecatedColorPropType,
  /**
   * If `false`, scrolling of the text view will be disabled.
   * The default value is `true`. Does only work with 'multiline={true}'.
   * @platform ios
   */
  scrollEnabled: PropTypes.bool,
  /**
   * If `true`, the text input obscures the text entered so that sensitive text
   * like passwords stay secure. The default value is `false`. Does not work with 'multiline={true}'.
   */
  secureTextEntry: PropTypes.bool,
  /**
   * The highlight and cursor color of the text input.
   */
  selectionColor: DeprecatedColorPropType,
  /**
   * The start and end of the text input's selection. Set start and end to
   * the same value to position the cursor.
   */
  selection: (PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number,
  }): React$PropType$Primitive<{
    end?: number,
    start: number,
    ...
  }>),
  /**
   * The value to show for the text input. `TextInput` is a controlled
   * component, which means the native value will be forced to match this
   * value prop if provided. For most uses, this works great, but in some
   * cases this may cause flickering - one common cause is preventing edits
   * by keeping value the same. In addition to simply setting the same value,
   * either set `editable={false}`, or set/update `maxLength` to prevent
   * unwanted edits without flicker.
   */
  value: PropTypes.string,
  /**
   * Provides an initial value that will change when the user starts typing.
   * Useful for simple use-cases where you do not want to deal with listening
   * to events and updating the value prop to keep the controlled state in sync.
   */
  defaultValue: PropTypes.string,
  /**
   * When the clear button should appear on the right side of the text view.
   * This property is supported only for single-line TextInput component.
   * @platform ios
   */
  clearButtonMode: (PropTypes.oneOf([
    'never',
    'while-editing',
    'unless-editing',
    'always',
  ]): React$PropType$Primitive<
    'never' | 'while-editing' | 'unless-editing' | 'always',
  >),
  /**
   * If `true`, clears the text field automatically when editing begins.
   * @platform ios
   */
  clearTextOnFocus: PropTypes.bool,
  /**
   * If `true`, all text will automatically be selected on focus.
   */
  selectTextOnFocus: PropTypes.bool,
  /**
   * If `true`, the text field will blur when submitted.
   * The default value is true for single-line fields and false for
   * multiline fields. Note that for multiline fields, setting `blurOnSubmit`
   * to `true` means that pressing return will blur the field and trigger the
   * `onSubmitEditing` event instead of inserting a newline into the field.
   */
  blurOnSubmit: PropTypes.bool,
  /**
   * Note that not all Text styles are supported, an incomplete list of what is not supported includes:
   *
   * - `borderLeftWidth`
   * - `borderTopWidth`
   * - `borderRightWidth`
   * - `borderBottomWidth`
   * - `borderTopLeftRadius`
   * - `borderTopRightRadius`
   * - `borderBottomRightRadius`
   * - `borderBottomLeftRadius`
   *
   * see [Issue#7070](https://github.com/facebook/react-native/issues/7070)
   * for more detail.
   *
   * [Styles](docs/style.html)
   */
  style: Text.propTypes.style,
  /**
   * The color of the `TextInput` underline.
   * @platform android
   */
  underlineColorAndroid: DeprecatedColorPropType,

  /**
   * If defined, the provided image resource will be rendered on the left.
   * The image resource must be inside `/android/app/src/main/res/drawable` and referenced
   * like
   * ```
   * <TextInput
   *  inlineImageLeft='search_icon'
   * />
   * ```
   * @platform android
   */
  inlineImageLeft: PropTypes.string,

  /**
   * Padding between the inline image, if any, and the text input itself.
   * @platform android
   */
  inlineImagePadding: PropTypes.number,

  /**
   * If `true`, allows TextInput to pass touch events to the parent component.
   * This allows components such as SwipeableListView to be swipeable from the TextInput on iOS,
   * as is the case on Android by default.
   * If `false`, TextInput always asks to handle the input (except when disabled).
   * @platform ios
   */
  rejectResponderTermination: PropTypes.bool,

  /**
   * Determines the types of data converted to clickable URLs in the text input.
   * Only valid if `multiline={true}` and `editable={false}`.
   * By default no data types are detected.
   *
   * You can provide one type or an array of many types.
   *
   * Possible values for `dataDetectorTypes` are:
   *
   * - `'phoneNumber'`
   * - `'link'`
   * - `'address'`
   * - `'calendarEvent'`
   * - `'none'`
   * - `'all'`
   *
   * @platform ios
   */
  dataDetectorTypes: (PropTypes.oneOfType([
    PropTypes.oneOf(DataDetectorTypes),
    PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes)),
  ]): React$PropType$Primitive<
    | 'phoneNumber'
    | 'link'
    | 'address'
    | 'calendarEvent'
    | 'none'
    | 'all'
    | Array<
        'phoneNumber' | 'link' | 'address' | 'calendarEvent' | 'none' | 'all',
      >,
  >),
  /**
   * If `true`, caret is hidden. The default value is `false`.
   * This property is supported only for single-line TextInput component on iOS.
   */
  caretHidden: PropTypes.bool,
  /*
   * If `true`, contextMenuHidden is hidden. The default value is `false`.
   */
  contextMenuHidden: PropTypes.bool,
  /**
   * An optional identifier which links a custom InputAccessoryView to
   * this text input. The InputAccessoryView is rendered above the
   * keyboard when this text input is focused.
   * @platform ios
   */
  inputAccessoryViewID: PropTypes.string,
  /**
   * Give the keyboard and the system information about the
   * expected semantic meaning for the content that users enter.
   * @platform ios
   */
  textContentType: (PropTypes.oneOf([
    'none',
    'URL',
    'addressCity',
    'addressCityAndState',
    'addressState',
    'countryName',
    'creditCardNumber',
    'emailAddress',
    'familyName',
    'fullStreetAddress',
    'givenName',
    'jobTitle',
    'location',
    'middleName',
    'name',
    'namePrefix',
    'nameSuffix',
    'nickname',
    'organizationName',
    'postalCode',
    'streetAddressLine1',
    'streetAddressLine2',
    'sublocality',
    'telephoneNumber',
    'username',
    'password',
    'newPassword',
    'oneTimeCode',
  ]): React$PropType$Primitive<
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode',
  >),
  /**
   * When `false`, it will prevent the soft keyboard from showing when the field is focused.
   * Defaults to `true`.
   * @platform android
   */
  showSoftInputOnFocus: PropTypes.bool,
};

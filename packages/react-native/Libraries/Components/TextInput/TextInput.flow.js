/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../Renderer/shims/ReactNativeTypes';
import type {
  PressEvent,
  ScrollEvent,
  SyntheticEvent,
} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import {
  type ColorValue,
  type TextStyleProp,
  type ViewStyleProp,
} from '../../StyleSheet/StyleSheet';
import * as React from 'react';

type ReactRefSetter<T> = {current: null | T, ...} | ((ref: null | T) => mixed);

export type ChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    eventCount: number,
    target: number,
    text: string,
  |}>,
>;

export type TextInputEvent = SyntheticEvent<
  $ReadOnly<{|
    eventCount: number,
    previousText: string,
    range: $ReadOnly<{|
      start: number,
      end: number,
    |}>,
    target: number,
    text: string,
  |}>,
>;

export type ContentSizeChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
    contentSize: $ReadOnly<{|
      width: number,
      height: number,
    |}>,
  |}>,
>;

type TargetEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
  |}>,
>;

export type BlurEvent = TargetEvent;
export type FocusEvent = TargetEvent;

type Selection = $ReadOnly<{|
  start: number,
  end: number,
|}>;

export type SelectionChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    selection: Selection,
    target: number,
  |}>,
>;

export type KeyPressEvent = SyntheticEvent<
  $ReadOnly<{|
    key: string,
    target?: ?number,
    eventCount?: ?number,
  |}>,
>;

export type EditingEvent = SyntheticEvent<
  $ReadOnly<{|
    eventCount: number,
    text: string,
    target: number,
  |}>,
>;

type DataDetectorTypesType =
  | 'phoneNumber'
  | 'link'
  | 'address'
  | 'calendarEvent'
  | 'trackingNumber'
  | 'flightNumber'
  | 'lookupSuggestion'
  | 'none'
  | 'all';

export type KeyboardType =
  // Cross Platform
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'number-pad'
  | 'decimal-pad'
  | 'url'
  // iOS-only
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  // iOS 10+ only
  | 'ascii-capable-number-pad'
  // Android-only
  | 'visible-password';

export type InputMode =
  | 'none'
  | 'text'
  | 'decimal'
  | 'numeric'
  | 'tel'
  | 'search'
  | 'email'
  | 'url';

export type ReturnKeyType =
  // Cross Platform
  | 'done'
  | 'go'
  | 'next'
  | 'search'
  | 'send'
  // Android-only
  | 'none'
  | 'previous'
  // iOS-only
  | 'default'
  | 'emergency-call'
  | 'google'
  | 'join'
  | 'route'
  | 'yahoo';

export type SubmitBehavior = 'submit' | 'blurAndSubmit' | 'newline';

export type AutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';

export type TextContentType =
  | 'none'
  | 'URL'
  | 'addressCity'
  | 'addressCityAndState'
  | 'addressState'
  | 'countryName'
  | 'creditCardNumber'
  | 'creditCardExpiration'
  | 'creditCardExpirationMonth'
  | 'creditCardExpirationYear'
  | 'creditCardSecurityCode'
  | 'creditCardType'
  | 'creditCardName'
  | 'creditCardGivenName'
  | 'creditCardMiddleName'
  | 'creditCardFamilyName'
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
  | 'oneTimeCode'
  | 'birthdate'
  | 'birthdateDay'
  | 'birthdateMonth'
  | 'birthdateYear'
  | 'cellularEID'
  | 'cellularIMEI'
  | 'dateTime'
  | 'flightNumber'
  | 'shipmentTrackingNumber';

export type enterKeyHintType =
  | 'enter'
  | 'done'
  | 'go'
  | 'next'
  | 'previous'
  | 'search'
  | 'send';

type PasswordRules = string;

type IOSProps = $ReadOnly<{|
  /**
   * When the clear button should appear on the right side of the text view.
   * This property is supported only for single-line TextInput component.
   * @platform ios
   */
  clearButtonMode?: ?('never' | 'while-editing' | 'unless-editing' | 'always'),

  /**
   * If `true`, clears the text field automatically when editing begins.
   * @platform ios
   */
  clearTextOnFocus?: ?boolean,

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
  dataDetectorTypes?:
    | ?DataDetectorTypesType
    | $ReadOnlyArray<DataDetectorTypesType>,

  /**
   * If `true`, the keyboard disables the return key when there is no text and
   * automatically enables it when there is text. The default value is `false`.
   * @platform ios
   */
  enablesReturnKeyAutomatically?: ?boolean,

  /**
   * An optional identifier which links a custom InputAccessoryView to
   * this text input. The InputAccessoryView is rendered above the
   * keyboard when this text input is focused.
   * @platform ios
   */
  inputAccessoryViewID?: ?string,

  /**
   * An optional label that overrides the default input accessory view button label.
   * @platform ios
   */
  inputAccessoryViewButtonLabel?: ?string,

  /**
   * Determines the color of the keyboard.
   * @platform ios
   */
  keyboardAppearance?: ?('default' | 'light' | 'dark'),

  /**
   * Provide rules for your password.
   * For example, say you want to require a password with at least eight characters consisting of a mix of uppercase and lowercase letters, at least one number, and at most two consecutive characters.
   * "required: upper; required: lower; required: digit; max-consecutive: 2; minlength: 8;"
   * @platform ios
   */
  passwordRules?: ?PasswordRules,

  /*
   * If `true`, allows TextInput to pass touch events to the parent component.
   * This allows components to be swipeable from the TextInput on iOS,
   * as is the case on Android by default.
   * If `false`, TextInput always asks to handle the input (except when disabled).
   * @platform ios
   */
  rejectResponderTermination?: ?boolean,

  /**
   * If `false`, scrolling of the text view will be disabled.
   * The default value is `true`. Does only work with 'multiline={true}'.
   * @platform ios
   */
  scrollEnabled?: ?boolean,

  /**
   * If `false`, disables spell-check style (i.e. red underlines).
   * The default value is inherited from `autoCorrect`.
   * @platform ios
   */
  spellCheck?: ?boolean,

  /**
   * Give the keyboard and the system information about the
   * expected semantic meaning for the content that users enter.
   * @platform ios
   */
  textContentType?: ?TextContentType,

  /**
   * Set line break strategy on iOS.
   * @platform ios
   */
  lineBreakStrategyIOS?: ?('none' | 'standard' | 'hangul-word' | 'push-out'),

  /**
   * Set line break mode on iOS.
   * @platform ios
   */
  lineBreakModeIOS?: ?(
    | 'wordWrapping'
    | 'char'
    | 'clip'
    | 'head'
    | 'middle'
    | 'tail'
  ),

  /**
   * If `false`, the iOS system will not insert an extra space after a paste operation
   * neither delete one or two spaces after a cut or delete operation.
   *
   * The default value is `true`.
   *
   * @platform ios
   */
  smartInsertDelete?: ?boolean,
|}>;

type AndroidProps = $ReadOnly<{|
  /**
   * When provided it will set the color of the cursor (or "caret") in the component.
   * Unlike the behavior of `selectionColor` the cursor color will be set independently
   * from the color of the text selection box.
   * @platform android
   */
  cursorColor?: ?ColorValue,

  /**
   * When provided it will set the color of the selection handles when highlighting text.
   * Unlike the behavior of `selectionColor` the handle color will be set independently
   * from the color of the text selection box.
   * @platform android
   */
  selectionHandleColor?: ?ColorValue,

  /**
   * When `false`, if there is a small amount of space available around a text input
   * (e.g. landscape orientation on a phone), the OS may choose to have the user edit
   * the text inside of a full screen text input mode. When `true`, this feature is
   * disabled and users will always edit the text directly inside of the text input.
   * Defaults to `false`.
   * @platform android
   */
  disableFullscreenUI?: ?boolean,

  importantForAutofill?: ?(
    | 'auto'
    | 'no'
    | 'noExcludeDescendants'
    | 'yes'
    | 'yesExcludeDescendants'
  ),

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
  inlineImageLeft?: ?string,

  /**
   * Padding between the inline image, if any, and the text input itself.
   * @platform android
   */
  inlineImagePadding?: ?number,

  /**
   * Sets the number of lines for a `TextInput`. Use it with multiline set to
   * `true` to be able to fill the lines.
   * @platform android
   */
  numberOfLines?: ?number,

  /**
   * Sets the return key to the label. Use it instead of `returnKeyType`.
   * @platform android
   */
  returnKeyLabel?: ?string,

  /**
   * Sets the number of rows for a `TextInput`. Use it with multiline set to
   * `true` to be able to fill the lines.
   * @platform android
   */
  rows?: ?number,

  /**
   * When `false`, it will prevent the soft keyboard from showing when the field is focused.
   * Defaults to `true`.
   */
  showSoftInputOnFocus?: ?boolean,

  /**
   * Set text break strategy on Android API Level 23+, possible values are `simple`, `highQuality`, `balanced`
   * The default value is `simple`.
   * @platform android
   */
  textBreakStrategy?: ?('simple' | 'highQuality' | 'balanced'),

  /**
   * The color of the `TextInput` underline.
   * @platform android
   */
  underlineColorAndroid?: ?ColorValue,
|}>;

export type Props = $ReadOnly<{|
  ...$Diff<ViewProps, $ReadOnly<{|style: ?ViewStyleProp|}>>,
  ...IOSProps,
  ...AndroidProps,

  /**
   * Can tell `TextInput` to automatically capitalize certain characters.
   *
   * - `characters`: all characters.
   * - `words`: first letter of each word.
   * - `sentences`: first letter of each sentence (*default*).
   * - `none`: don't auto capitalize anything.
   */
  autoCapitalize?: ?AutoCapitalize,

  /**
   * Specifies autocomplete hints for the system, so it can provide autofill.
   * On Android, the system will always attempt to offer autofill by using heuristics to identify the type of content.
   * To disable autocomplete, set autoComplete to off.
   *
   * The following values work across platforms:
   *
   * - `additional-name`
   * - `address-line1`
   * - `address-line2`
   * - `birthdate-day` (iOS 17+)
   * - `birthdate-full` (iOS 17+)
   * - `birthdate-month` (iOS 17+)
   * - `birthdate-year` (iOS 17+)
   * - `cc-number`
   * - `cc-csc` (iOS 17+)
   * - `cc-exp` (iOS 17+)
   * - `cc-exp-day` (iOS 17+)
   * - `cc-exp-month` (iOS 17+)
   * - `cc-exp-year` (iOS 17+)
   * - `country`
   * - `current-password`
   * - `email`
   * - `family-name`
   * - `given-name`
   * - `honorific-prefix`
   * - `honorific-suffix`
   * - `name`
   * - `new-password`
   * - `off`
   * - `one-time-code`
   * - `postal-code`
   * - `street-address`
   * - `tel`
   * - `username`
   *
   * The following values work on iOS only:
   *
   * - `cc-name` (iOS 17+)
   * - `cc-given-name` (iOS 17+)
   * - `cc-middle-name` (iOS 17+)
   * - `cc-family-name` (iOS 17+)
   * - `cc-type` (iOS 17+)
   * - `nickname`
   * - `organization`
   * - `organization-title`
   * - `url`
   *
   * The following values work on Android only:
   *
   * - `gender`
   * - `name-family`
   * - `name-given`
   * - `name-middle`
   * - `name-middle-initial`
   * - `name-prefix`
   * - `name-suffix`
   * - `password`
   * - `password-new`
   * - `postal-address`
   * - `postal-address-country`
   * - `postal-address-extended`
   * - `postal-address-extended-postal-code`
   * - `postal-address-locality`
   * - `postal-address-region`
   * - `sms-otp`
   * - `tel-country-code`
   * - `tel-national`
   * - `tel-device`
   * - `username-new`
   */
  autoComplete?: ?(
    | 'additional-name'
    | 'address-line1'
    | 'address-line2'
    | 'birthdate-day'
    | 'birthdate-full'
    | 'birthdate-month'
    | 'birthdate-year'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-day'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'cc-name'
    | 'cc-given-name'
    | 'cc-middle-name'
    | 'cc-family-name'
    | 'cc-type'
    | 'country'
    | 'current-password'
    | 'email'
    | 'family-name'
    | 'gender'
    | 'given-name'
    | 'honorific-prefix'
    | 'honorific-suffix'
    | 'name'
    | 'name-family'
    | 'name-given'
    | 'name-middle'
    | 'name-middle-initial'
    | 'name-prefix'
    | 'name-suffix'
    | 'new-password'
    | 'nickname'
    | 'one-time-code'
    | 'organization'
    | 'organization-title'
    | 'password'
    | 'password-new'
    | 'postal-address'
    | 'postal-address-country'
    | 'postal-address-extended'
    | 'postal-address-extended-postal-code'
    | 'postal-address-locality'
    | 'postal-address-region'
    | 'postal-code'
    | 'street-address'
    | 'sms-otp'
    | 'tel'
    | 'tel-country-code'
    | 'tel-national'
    | 'tel-device'
    | 'url'
    | 'username'
    | 'username-new'
    | 'off'
  ),

  /**
   * If `false`, disables auto-correct. The default value is `true`.
   */
  autoCorrect?: ?boolean,

  /**
   * If `true`, focuses the input on `componentDidMount`.
   * The default value is `false`.
   */
  autoFocus?: ?boolean,

  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings. The
   * default is `true`.
   */
  allowFontScaling?: ?boolean,

  /**
   * If `true`, caret is hidden. The default value is `false`.
   *
   * On Android devices manufactured by Xiaomi with Android Q,
   * when keyboardType equals 'email-address'this will be set
   * in native to 'true' to prevent a system related crash. This
   * will cause cursor to be disabled as a side-effect.
   *
   */
  caretHidden?: ?boolean,

  /*
   * If `true`, contextMenuHidden is hidden. The default value is `false`.
   */
  contextMenuHidden?: ?boolean,

  /**
   * Provides an initial value that will change when the user starts typing.
   * Useful for simple use-cases where you do not want to deal with listening
   * to events and updating the value prop to keep the controlled state in sync.
   */
  defaultValue?: ?Stringish,

  /**
   * If `false`, text is not editable. The default value is `true`.
   */
  editable?: ?boolean,

  forwardedRef?: ?ReactRefSetter<HostInstance & ImperativeMethods>,

  /**
   * `enterKeyHint` defines what action label (or icon) to present for the enter key on virtual keyboards.
   *
   * The following values is supported:
   *
   * - `enter`
   * - `done`
   * - `go`
   * - `next`
   * - `previous`
   * - `search`
   * - `send`
   */
  enterKeyHint?: ?enterKeyHintType,

  /**
   * `inputMode` works like the `inputmode` attribute in HTML, it determines which
   * keyboard to open, e.g.`numeric` and has precedence over keyboardType
   *
   * Support the following values:
   *
   * - `none`
   * - `text`
   * - `decimal`
   * - `numeric`
   * - `tel`
   * - `search`
   * - `email`
   * - `url`
   */
  inputMode?: ?InputMode,

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
   * - `url`
   *
   * *iOS Only*
   *
   * The following values work on iOS only:
   *
   * - `ascii-capable`
   * - `numbers-and-punctuation`
   * - `name-phone-pad`
   * - `twitter`
   * - `web-search`
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `visible-password`
   *
   */
  keyboardType?: ?KeyboardType,

  /**
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: ?number,

  /**
   * Limits the maximum number of characters that can be entered. Use this
   * instead of implementing the logic in JS to avoid flicker.
   */
  maxLength?: ?number,

  /**
   * If `true`, the text input can be multiple lines.
   * The default value is `false`.
   */
  multiline?: ?boolean,

  /**
   * Callback that is called when the text input is blurred.
   */
  onBlur?: ?(e: BlurEvent) => mixed,

  /**
   * Callback that is called when the text input's text changes.
   */
  onChange?: ?(e: ChangeEvent) => mixed,

  /**
   * DANGER: this API is not stable and will change in the future.
   *
   * Callback will be called on the main thread and may result in dropped frames.
   * Callback that is called when the text input's text changes.
   *
   * @platform ios
   */
  unstable_onChangeSync?: ?(e: ChangeEvent) => mixed,

  /**
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   */
  onChangeText?: ?(text: string) => mixed,

  /**
   * DANGER: this API is not stable and will change in the future.
   *
   * Callback will be called on the main thread and may result in dropped frames.
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   *
   * @platform ios
   */
  unstable_onChangeTextSync?: ?(text: string) => mixed,

  /**
   * Callback that is called when the text input's content size changes.
   * This will be called with
   * `{ nativeEvent: { contentSize: { width, height } } }`.
   *
   * Only called for multiline text inputs.
   */
  onContentSizeChange?: ?(e: ContentSizeChangeEvent) => mixed,

  /**
   * Callback that is called when text input ends.
   */
  onEndEditing?: ?(e: EditingEvent) => mixed,

  /**
   * Callback that is called when the text input is focused.
   */
  onFocus?: ?(e: FocusEvent) => mixed,

  /**
   * Callback that is called when a key is pressed.
   * This will be called with `{ nativeEvent: { key: keyValue } }`
   * where `keyValue` is `'Enter'` or `'Backspace'` for respective keys and
   * the typed-in character otherwise including `' '` for space.
   * Fires before `onChange` callbacks.
   */
  onKeyPress?: ?(e: KeyPressEvent) => mixed,

  /**
   * DANGER: this API is not stable and will change in the future.
   *
   * Callback will be called on the main thread and may result in dropped frames.
   *
   * Callback that is called when a key is pressed.
   * This will be called with `{ nativeEvent: { key: keyValue } }`
   * where `keyValue` is `'Enter'` or `'Backspace'` for respective keys and
   * the typed-in character otherwise including `' '` for space.
   * Fires before `onChange` callbacks.
   *
   * @platform ios
   */
  unstable_onKeyPressSync?: ?(e: KeyPressEvent) => mixed,

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: ?(event: PressEvent) => mixed,

  /**
   * Called when a touch is engaged.
   */
  onPressIn?: ?(event: PressEvent) => mixed,

  /**
   * Called when a touch is released.
   */
  onPressOut?: ?(event: PressEvent) => mixed,

  /**
   * Callback that is called when the text input selection is changed.
   * This will be called with
   * `{ nativeEvent: { selection: { start, end } } }`.
   */
  onSelectionChange?: ?(e: SelectionChangeEvent) => mixed,

  /**
   * Callback that is called when the text input's submit button is pressed.
   * Invalid if `multiline={true}` is specified.
   */
  onSubmitEditing?: ?(e: EditingEvent) => mixed,

  /**
   * Invoked on content scroll with `{ nativeEvent: { contentOffset: { x, y } } }`.
   * May also contain other properties from ScrollEvent but on Android contentSize
   * is not provided for performance reasons.
   */
  onScroll?: ?(e: ScrollEvent) => mixed,

  /**
   * The string that will be rendered before text input has been entered.
   */
  placeholder?: ?Stringish,

  /**
   * The text color of the placeholder string.
   */
  placeholderTextColor?: ?ColorValue,

  /** `readOnly` works like the `readonly` attribute in HTML.
   *  If `true`, text is not editable. The default value is `false`.
   *  See https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/readonly
   *  for more details.
   */
  readOnly?: ?boolean,

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
  returnKeyType?: ?ReturnKeyType,

  /**
   * If `true`, the text input obscures the text entered so that sensitive text
   * like passwords stay secure. The default value is `false`. Does not work with 'multiline={true}'.
   */
  secureTextEntry?: ?boolean,

  /**
   * The start and end of the text input's selection. Set start and end to
   * the same value to position the cursor.
   */
  selection?: ?$ReadOnly<{|
    start: number,
    end?: ?number,
  |}>,

  /**
   * The highlight and cursor color of the text input.
   */
  selectionColor?: ?ColorValue,

  /**
   * If `true`, all text will automatically be selected on focus.
   */
  selectTextOnFocus?: ?boolean,

  /**
   * If `true`, the text field will blur when submitted.
   * The default value is true for single-line fields and false for
   * multiline fields. Note that for multiline fields, setting `blurOnSubmit`
   * to `true` means that pressing return will blur the field and trigger the
   * `onSubmitEditing` event instead of inserting a newline into the field.
   *
   * @deprecated
   * Note that `submitBehavior` now takes the place of `blurOnSubmit` and will
   * override any behavior defined by `blurOnSubmit`.
   * @see submitBehavior
   */
  blurOnSubmit?: ?boolean,

  /**
   * When the return key is pressed,
   *
   * For single line inputs:
   *
   * - `'newline`' defaults to `'blurAndSubmit'`
   * - `undefined` defaults to `'blurAndSubmit'`
   *
   * For multiline inputs:
   *
   * - `'newline'` adds a newline
   * - `undefined` defaults to `'newline'`
   *
   * For both single line and multiline inputs:
   *
   * - `'submit'` will only send a submit event and not blur the input
   * - `'blurAndSubmit`' will both blur the input and send a submit event
   */
  submitBehavior?: ?SubmitBehavior,

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
  style?: ?TextStyleProp,

  /**
   * The value to show for the text input. `TextInput` is a controlled
   * component, which means the native value will be forced to match this
   * value prop if provided. For most uses, this works great, but in some
   * cases this may cause flickering - one common cause is preventing edits
   * by keeping value the same. In addition to simply setting the same value,
   * either set `editable={false}`, or set/update `maxLength` to prevent
   * unwanted edits without flicker.
   */
  value?: ?Stringish,
|}>;

type ImperativeMethods = $ReadOnly<{|
  clear: () => void,
  isFocused: () => boolean,
  getNativeRef: () => ?HostInstance,
  setSelection: (start: number, end: number) => void,
|}>;

/**
 * A foundational component for inputting text into the app via a
 * keyboard. Props provide configurability for several features, such as
 * auto-correction, auto-capitalization, placeholder text, and different keyboard
 * types, such as a numeric keypad.
 *
 * The simplest use case is to plop down a `TextInput` and subscribe to the
 * `onChangeText` events to read the user input. There are also other events,
 * such as `onSubmitEditing` and `onFocus` that can be subscribed to. A simple
 * example:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, TextInput } from 'react-native';
 *
 * export default class UselessTextInput extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = { text: 'Useless Placeholder' };
 *   }
 *
 *   render() {
 *     return (
 *       <TextInput
 *         style={{height: 40, borderColor: 'gray', borderWidth: 1}}
 *         onChangeText={(text) => this.setState({text})}
 *         value={this.state.text}
 *       />
 *     );
 *   }
 * }
 *
 * // skip this line if using Create React Native App
 * AppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);
 * ```
 *
 * Two methods exposed via the native element are .focus() and .blur() that
 * will focus or blur the TextInput programmatically.
 *
 * Note that some props are only available with `multiline={true/false}`.
 * Additionally, border styles that apply to only one side of the element
 * (e.g., `borderBottomColor`, `borderLeftWidth`, etc.) will not be applied if
 * `multiline=false`. To achieve the same effect, you can wrap your `TextInput`
 * in a `View`:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, View, TextInput } from 'react-native';
 *
 * class UselessTextInput extends Component {
 *   render() {
 *     return (
 *       <TextInput
 *         {...this.props} // Inherit any props passed to it; e.g., multiline, numberOfLines below
 *         editable = {true}
 *         maxLength = {40}
 *       />
 *     );
 *   }
 * }
 *
 * export default class UselessTextInputMultiline extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       text: 'Useless Multiline Placeholder',
 *     };
 *   }
 *
 *   // If you type something in the text box that is a color, the background will change to that
 *   // color.
 *   render() {
 *     return (
 *      <View style={{
 *        backgroundColor: this.state.text,
 *        borderBottomColor: '#000000',
 *        borderBottomWidth: 1 }}
 *      >
 *        <UselessTextInput
 *          multiline = {true}
 *          numberOfLines = {4}
 *          onChangeText={(text) => this.setState({text})}
 *          value={this.state.text}
 *        />
 *      </View>
 *     );
 *   }
 * }
 *
 * // skip these lines if using Create React Native App
 * AppRegistry.registerComponent(
 *  'AwesomeProject',
 *  () => UselessTextInputMultiline
 * );
 * ```
 *
 * `TextInput` has by default a border at the bottom of its view. This border
 * has its padding set by the background image provided by the system, and it
 * cannot be changed. Solutions to avoid this is to either not set height
 * explicitly, case in which the system will take care of displaying the border
 * in the correct position, or to not display the border by setting
 * `underlineColorAndroid` to transparent.
 *
 * Note that on Android performing text selection in input can change
 * app's activity `windowSoftInputMode` param to `adjustResize`.
 * This may cause issues with components that have position: 'absolute'
 * while keyboard is active. To avoid this behavior either specify `windowSoftInputMode`
 * in AndroidManifest.xml ( https://developer.android.com/guide/topics/manifest/activity-element.html )
 * or control this param programmatically with native code.
 *
 */
type InternalTextInput = component(
  ref: React.RefSetter<$ReadOnly<{...HostInstance, ...ImperativeMethods}>>,
  ...Props
);

export type TextInputComponentStatics = $ReadOnly<{|
  State: $ReadOnly<{|
    currentlyFocusedInput: () => ?HostInstance,
    currentlyFocusedField: () => ?number,
    focusTextInput: (textField: ?HostInstance) => void,
    blurTextInput: (textField: ?HostInstance) => void,
  |}>,
|}>;

export type TextInputType = InternalTextInput & TextInputComponentStatics;

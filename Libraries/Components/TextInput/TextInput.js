/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @generate-docs
 */

'use strict';

const DeprecatedTextInputPropTypes = require('../../DeprecatedPropTypes/DeprecatedTextInputPropTypes');
const Platform = require('../../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const Text = require('../../Text/Text');
const TextAncestor = require('../../Text/TextAncestor');
const TextInputState = require('./TextInputState');
const TouchableWithoutFeedback = require('../Touchable/TouchableWithoutFeedback');

const invariant = require('invariant');
const nullthrows = require('nullthrows');
const setAndForwardRef = require('../../Utilities/setAndForwardRef');

import type {TextStyleProp, ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';
import type {SyntheticEvent, ScrollEvent} from '../../Types/CoreEventTypes';
import type {PressEvent} from '../../Types/CoreEventTypes';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {TextInputNativeCommands} from './TextInputNativeCommands';

const {useLayoutEffect, useRef, useState} = React;

type ReactRefSetter<T> = {current: null | T, ...} | ((ref: null | T) => mixed);

let AndroidTextInput;
let AndroidTextInputCommands;
let RCTSinglelineTextInputView;
let RCTSinglelineTextInputNativeCommands;
let RCTMultilineTextInputView;
let RCTMultilineTextInputNativeCommands;

if (Platform.OS === 'android') {
  AndroidTextInput = require('./AndroidTextInputNativeComponent').default;
  AndroidTextInputCommands = require('./AndroidTextInputNativeComponent')
    .Commands;
} else if (Platform.OS === 'ios') {
  RCTSinglelineTextInputView = require('./RCTSingelineTextInputNativeComponent')
    .default;
  RCTSinglelineTextInputNativeCommands = require('./RCTSingelineTextInputNativeComponent')
    .Commands;
  RCTMultilineTextInputView = require('./RCTMultilineTextInputNativeComponent')
    .default;
  RCTMultilineTextInputNativeCommands = require('./RCTMultilineTextInputNativeComponent')
    .Commands;
}

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
  // iOS-only
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'url'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  // iOS 10+ only
  | 'ascii-capable-number-pad'
  // Android-only
  | 'visible-password';

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

export type AutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';

export type TextContentType =
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
  | 'oneTimeCode';

type PasswordRules = string;

type IOSProps = $ReadOnly<{|
  /**
    If `false`, disables spell-check style (i.e. red underlines).
    The default value is inherited from `autoCorrect`.

    @platform ios
   */
  spellCheck?: ?boolean,

  /**
    Determines the color of the keyboard.

    @platform ios
   */
  keyboardAppearance?: ?('default' | 'light' | 'dark'),

  /**
    If `true`, the keyboard disables the return key when there is no text and
    automatically enables it when there is text.

    @platform ios

    @default false
   */
  enablesReturnKeyAutomatically?: ?boolean,

  /**
    When the clear button should appear on the right side of the text view.
    This property is supported only for single-line TextInput component.

    @platform ios

    @default never
   */
  clearButtonMode?: ?('never' | 'while-editing' | 'unless-editing' | 'always'),

  /**
    If `true`, clears the text field automatically when editing begins.

    @platform ios
   */
  clearTextOnFocus?: ?boolean,

  /**
    Determines the types of data converted to clickable URLs in the text input.
    Only valid if `multiline={true}` and `editable={false}`.
    By default no data types are detected.

    You can provide one type or an array of many types.

    Possible values for `dataDetectorTypes` are:

    - `'phoneNumber'`
    - `'link'`
    - `'address'`
    - `'calendarEvent'`
    - `'none'`
    - `'all'`

    @platform ios
   */
  dataDetectorTypes?:
    | ?DataDetectorTypesType
    | $ReadOnlyArray<DataDetectorTypesType>,

  /**
    An optional identifier which links a custom
    [InputAccessoryView](inputaccessoryview) to this text input. The
    InputAccessoryView is rendered above the keyboard when this text input is
    focused.

    @platform ios
   */
  inputAccessoryViewID?: ?string,

  /**
    Give the keyboard and the system information about the expected semantic
    meaning for the content that users enter.

    For iOS 11+ you can set `textContentType` to `username` or `password` to
    enable autofill of login details from the device keychain.

    For iOS 12+ `newPassword` can be used to indicate a new password input the
    user may want to save in the keychain, and `oneTimeCode` can be used to
    indicate that a field can be autofilled by a code arriving in an SMS.

    To disable autofill, set `textContentType` to `none`.

    Possible values for `textContentType` are:

    - `none`
    - `URL`
    - `addressCity`
    - `addressCityAndState`
    - `addressState`
    - `countryName`
    - `creditCardNumber`
    - `emailAddress`
    - `familyName`
    - `fullStreetAddress`
    - `givenName`
    - `jobTitle`
    - `location`
    - `middleName`
    - `name`
    - `namePrefix`
    - `nameSuffix`
    - `nickname`
    - `organizationName`
    - `postalCode`
    - `streetAddressLine1`
    - `streetAddressLine2`
    - `sublocality`
    - `telephoneNumber`
    - `username`
    - `password`
    - `newPassword`
    - `oneTimeCode`

    @platform ios
   */
  textContentType?: ?TextContentType,

  /**
    When using `textContentType` as `newPassword` on iOS we can let the OS know
    the minimum requirements of the password so that it can generate one that
    will satisfy them. In order to create a valid string for `PasswordRules`
    take a look to the [Apple
    Docs](https://developer.apple.com/password-rules/).

    > If passwords generation dialog doesn't appear please make sure that:
    >
    > - AutoFill is enabled: **Settings** → **Passwords & Accounts** → toggle
    >   "On" the **AutoFill Passwords**,
    > - iCloud Keychain is used: **Settings** → **Apple ID** → **iCloud** →
    >   **Keychain** → toggle "On" the **iCloud Keychain**.

    @platform ios
   */
  passwordRules?: ?PasswordRules,

  /**
    _iOS Only_

    If `true`, allows TextInput to pass touch events to the parent component. This
    allows components such as SwipeableListView to be swipeable from the TextInput
    on iOS, as is the case on Android by default. If `false`, TextInput always asks
    to handle the input (except when disabled).

    @platform ios

    @default true
   */
  rejectResponderTermination?: ?boolean,

  /**
    If `false`, scrolling of the text view will be disabled.
    The default value is `true`. Does only work with `multiline={true}`.

    @platform ios
   */
  scrollEnabled?: ?boolean,
|}>;

type AndroidProps = $ReadOnly<{|
  /**
    Specifies autocomplete hints for the system, so it can provide autofill. On
    Android, the system will always attempt to offer autofill by using
    heuristics to identify the type of content. To disable autocomplete, set
    `autoCompleteType` to `off`.

    Possible values for `autoCompleteType` are:

    - `off`
    - `username`
    - `password`
    - `email`
    - `name`
    - `tel`
    - `street-address`
    - `postal-code`
    - `cc-number`
    - `cc-csc`
    - `cc-exp`
    - `cc-exp-month`
    - `cc-exp-year`

    @platform android
   */
  autoCompleteType?: ?(
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
    | 'off'
  ),

  /**
    Sets the return key to the label. Use it instead of `returnKeyType`.

    @platform android
   */
  returnKeyLabel?: ?string,

  /**
    Sets the number of lines for a `TextInput`. Use it with multiline set to
    `true` to be able to fill the lines.

    @platform android
   */
  numberOfLines?: ?number,

  /**
    When `false`, if there is a small amount of space available around a text input
    (e.g. landscape orientation on a phone), the OS may choose to have the user edit
    the text inside of a full screen text input mode. When `true`, this feature is
    disabled and users will always edit the text directly inside of the text input.

    @platform android

    @default false
   */
  disableFullscreenUI?: ?boolean,

  /**
    Set text break strategy on Android API Level 23+, possible values are
    `simple`, `highQuality`, `balanced`

    @platform android

    @default simple
   */
  textBreakStrategy?: ?('simple' | 'highQuality' | 'balanced'),

  /**
    The color of the `TextInput` underline.

    @platform android
   */
  underlineColorAndroid?: ?ColorValue,

  /**
    If defined, the provided image resource will be rendered on the left.
    The image resource must be inside `/android/app/src/main/res/drawable` and referenced
    like
    ```
    <TextInput
     inlineImageLeft='search_icon'
    />
    ```

    @platform android
   */
  inlineImageLeft?: ?string,

  /**
    Padding between the inline image, if any, and the text input itself.

    @platform android
   */
  inlineImagePadding?: ?number,

  /**
    Tells the system whether the individual fields in your app should be
    included in a view structure for autofill purposes on Android API Level 26+,
    possible values are `auto`, `no`, `noExcludeDescendants`, `yes`,
    `yesExcludeDescendants`.

    - `auto`: Let the Android System use its heuristics to determine if the view
      is important for autofill.
    - `no`: This view isn't important for autofill.
    - `noExcludeDescendants`: This view and its children aren't important for
      autofill.
    - `yes`: This view is important for autofill.
    - `yesExcludeDescendants`: This view is important for autofill, but its
      children aren't important for autofill.

    @platform android

    @default auto
   */
  importantForAutofill?: ?(
    | 'auto'
    | 'no'
    | 'noExcludeDescendants'
    | 'yes'
    | 'yesExcludeDescendants'
  ),

  /**
    When `false`, it will prevent the soft keyboard from showing when the field is focused.

    @default true
   */
  showSoftInputOnFocus?: ?boolean,
|}>;

export type Props = $ReadOnly<{|
  ...$Diff<ViewProps, $ReadOnly<{|style: ?ViewStyleProp|}>>,
  ...IOSProps,
  ...AndroidProps,

  /**
    Tells `TextInput` to automatically capitalize certain characters. This
    property is not supported by some keyboard types such as `name-phone-pad`.

    - `characters`: all characters.
    - `words`: first letter of each word.
    - `sentences`: first letter of each sentence (_default_).
    - `none`: don't auto capitalize anything.
   */
  autoCapitalize?: ?AutoCapitalize,

  /**
    If `false`, disables auto-correct.

    @default true
   */
  autoCorrect?: ?boolean,

  /**
    If `true`, focuses the input on `componentDidMount`.

    @default false
   */
  autoFocus?: ?boolean,

  /**
    Specifies whether fonts should scale to respect Text Size accessibility settings.

    @default true
   */
  allowFontScaling?: ?boolean,

  /**
    Specifies largest possible scale a font can reach when `allowFontScaling` is
    enabled. Possible values:

    - `null/undefined` (default): inherit from the parent node or the global
      default (0)
    - `0`: no max, ignore parent/global default
    - `>= 1`: sets the `maxFontSizeMultiplier` of this node to this value
   */
  maxFontSizeMultiplier?: ?number,

  /**
    If `false`, text is not editable.

    @default true
   */
  editable?: ?boolean,

  /**
    Determines which keyboard to open, e.g.`numeric`.

    See screenshots of all the types
    [here][visual-guide:react-native-textinput].

    [visual-guide:react-native-textinput]:
    http://lefkowitz.me/2018/04/30/visual-guide-to-react-native-textinput-keyboardtype-options/

    The following values work across platforms:

    - `default`
    - `number-pad`
    - `decimal-pad`
    - `numeric`
    - `email-address`
    - `phone-pad`

    @type {@platform android} enum (`visible-password`)
    @type {@platform ios} enum (`ascii-capable`, `numbers-and-punctuation`, `url`, `name-phone-pad`, `twitter`, `websearch`)

   */
  keyboardType?: ?KeyboardType,

  /**
    Determines how the return key should look. On Android you can also use
    `returnKeyLabel`.

    _Cross platform_

    The following values work across platforms:

    - `done`
    - `go`
    - `next`
    - `search`
    - `send`

    @type {@platform android} enum (`none`, `previous`)
    @type {@platform ios} enum (`default`, `emergency-call`, `google`, `join`, `route`, `yahoo`)
   */
  returnKeyType?: ?ReturnKeyType,

  /**
    Limits the maximum number of characters that can be entered. Use this
    instead of implementing the logic in JS to avoid flicker.
   */
  maxLength?: ?number,

  /**
    If `true`, the text input can be multiple lines.
    It is important to note that this aligns the text to the top on iOS, and centers
    it on Android. Use with `textAlignVertical` set to `top` for the same behavior
    in both platforms.

    @default false
   */
  multiline?: ?boolean,

  /**
    Callback that is called when the text input is blurred.
   */
  onBlur?: ?(e: BlurEvent) => mixed,

  /**
    Callback that is called when the text input is focused. This is called with
    `{ nativeEvent: { target } }`.
   */
  onFocus?: ?(e: FocusEvent) => mixed,

  /**
    Callback that is called when the text input's text changes. This will be
    called with `{ nativeEvent: { eventCount, target, text} }`
   */
  onChange?: ?(e: ChangeEvent) => mixed,

  /**
    Callback that is called when the text input's text changes.
    Changed text is passed as an argument to the callback handler.
   */
  onChangeText?: ?(text: string) => mixed,

  /**
    Callback that is called when the text input's content size changes.
    This will be called with
    `{ nativeEvent: { contentSize: { width, height } } }`.

    Only called for multiline text inputs.
   */
  onContentSizeChange?: ?(e: ContentSizeChangeEvent) => mixed,

  /**
    Callback that is called when text input ends.
   */
  onEndEditing?: ?(e: EditingEvent) => mixed,

  /**
    Callback that is called when the text input selection is changed. This will
    be called with `{ nativeEvent: { selection: { start, end } } }`. This prop
    requires `multiline={true}` to be set.
   */
  onSelectionChange?: ?(e: SelectionChangeEvent) => mixed,

  /**
    Callback that is called when the text input's submit button is pressed with
    the argument `{nativeEvent: {text, eventCount, target}}`.

    Note that on iOS this method isn't called when using `keyboardType="phone-pad"`.
   */
  onSubmitEditing?: ?(e: EditingEvent) => mixed,

  /**
    Callback that is called when a key is pressed. This will be called with `{
    nativeEvent: { key: keyValue } }` where `keyValue` is `'Enter'` or
    `'Backspace'` for respective keys and the typed-in character otherwise
    including `' '` for space. Fires before `onChange` callbacks. Note: on
    Android only the inputs from soft keyboard are handled, not the hardware
    keyboard inputs.
   */
  onKeyPress?: ?(e: KeyPressEvent) => mixed,

  /**
    Invoked on content scroll with `{ nativeEvent: { contentOffset: { x, y } } }`.
    May also contain other properties from ScrollEvent but on Android contentSize
    is not provided for performance reasons.
   */
  onScroll?: ?(e: ScrollEvent) => mixed,

  /**
    The string that will be rendered before text input has been entered.
   */
  placeholder?: ?Stringish,

  /**
    The text color of the placeholder string.
   */
  placeholderTextColor?: ?ColorValue,

  /**
    If `true`, the text input obscures the text entered so that sensitive text
    like passwords stay secure. Does not work with `multiline={true}`.

    @default false
   */
  secureTextEntry?: ?boolean,

  /**
    The highlight and cursor color of the text input.
   */
  selectionColor?: ?ColorValue,

  /**
    The start and end of the text input's selection. Set start and end to
    the same value to position the cursor.
   */
  selection?: ?$ReadOnly<{|
    start: number,
    end?: ?number,
  |}>,

  /**
    The value to show for the text input. `TextInput` is a controlled
    component, which means the native value will be forced to match this
    value prop if provided. For most uses, this works great, but in some
    cases this may cause flickering - one common cause is preventing edits
    by keeping value the same. In addition to simply setting the same value,
    either set `editable={false}`, or set/update `maxLength` to prevent
    unwanted edits without flicker.
   */
  value?: ?Stringish,

  /**
    Provides an initial value that will change when the user starts typing.
    Useful for simple use-cases where you do not want to deal with listening
    to events and updating the value prop to keep the controlled state in sync.
   */
  defaultValue?: ?Stringish,

  /**
    If `true`, all text will automatically be selected on focus.
   */
  selectTextOnFocus?: ?boolean,

  /**
    If `true`, the text field will blur when submitted.
    The default value is true for single-line fields and false for
    multiline fields. Note that for multiline fields, setting `blurOnSubmit`
    to `true` means that pressing return will blur the field and trigger the
    `onSubmitEditing` event instead of inserting a newline into the field.
   */
  blurOnSubmit?: ?boolean,

  /**
    Note that not all Text styles are supported, an incomplete list of what is
    not supported includes:

    - `borderLeftWidth`
    - `borderTopWidth`
    - `borderRightWidth`
    - `borderBottomWidth`
    - `borderTopLeftRadius`
    - `borderTopRightRadius`
    - `borderBottomRightRadius`
    - `borderBottomLeftRadius`

    see [Issue#7070](https://github.com/facebook/react-native/issues/7070) for
    more detail.

    [Styles](docs/style.html)

    @type Text
   */
  style?: ?TextStyleProp,

  /**
    If `true`, caret is hidden.

    @default false
   */
  caretHidden?: ?boolean,

  /**
    If `true`, contextMenuHidden is hidden.

    @default false
   */
  contextMenuHidden?: ?boolean,

  forwardedRef?: ?ReactRefSetter<
    React.ElementRef<HostComponent<mixed>> & ImperativeMethods,
  >,
|}>;

type ImperativeMethods = $ReadOnly<{|
  clear: () => void,
  isFocused: () => boolean,
  getNativeRef: () => ?React.ElementRef<HostComponent<mixed>>,
|}>;

const emptyFunctionThatReturnsTrue = () => true;

/**
  A foundational component for inputting text into the app via a keyboard. Props
  provide configurability for several features, such as auto-correction,
  auto-capitalization, placeholder text, and different keyboard types, such as a
  numeric keypad.

  The most basic use case is to plop down a `TextInput` and subscribe to the
  `onChangeText` events to read the user input. There are also other events, such
  as `onSubmitEditing` and `onFocus` that can be subscribed to. A minimal example:

  ```SnackPlayer name=TextInput
  import React, { Component } from 'react';
  import { TextInput } from 'react-native';

  const UselessTextInput = () => {
    const [value, onChangeText] = React.useState('Useless Placeholder');

    return (
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
        onChangeText={text => onChangeText(text)}
        value={value}
      />
    );
  }

  export default UselessTextInput;
  ```

  Two methods exposed via the native element are .focus() and .blur() that will
  focus or blur the TextInput programmatically.

  Note that some props are only available with `multiline={true/false}`.
  Additionally, border styles that apply to only one side of the element (e.g.,
  `borderBottomColor`, `borderLeftWidth`, etc.) will not be applied if
  `multiline=false`. To achieve the same effect, you can wrap your `TextInput` in
  a `View`:

  ```SnackPlayer name=TextInput
  import React, { Component } from 'react';
  import { View, TextInput } from 'react-native';

  const UselessTextInput = (props) => {
    return (
      <TextInput
        {...props} // Inherit any props passed to it; e.g., multiline, numberOfLines below
        editable
        maxLength={40}
      />
    );
  }

  const UselessTextInputMultiline = () => {
    const [value, onChangeText] = React.useState('Useless Multiline Placeholder');

    // If you type something in the text box that is a color, the background will change to that
    // color.
    return (
      <View
        style={{
          backgroundColor: value,
          borderBottomColor: '#000000',
          borderBottomWidth: 1,
        }}>
        <UselessTextInput
          multiline
          numberOfLines={4}
          onChangeText={text => onChangeText(text)}
          value={value}
        />
      </View>
    );
  }

  export default UselessTextInputMultiline;
  ```

  `TextInput` has by default a border at the bottom of its view. This border has
  its padding set by the background image provided by the system, and it cannot be
  changed. Solutions to avoid this is to either not set height explicitly, case in
  which the system will take care of displaying the border in the correct
  position, or to not display the border by setting `underlineColorAndroid` to
  transparent.

  Note that on Android performing text selection in input can change app's
  activity `windowSoftInputMode` param to `adjustResize`. This may cause issues
  with components that have position: 'absolute' while keyboard is active. To
  avoid this behavior either specify `windowSoftInputMode` in AndroidManifest.xml
  ( https://developer.android.com/guide/topics/manifest/activity-element.html ) or
  control this param programmatically with native code.
 */
function InternalTextInput(props: Props): React.Node {
  const inputRef = useRef<null | React.ElementRef<HostComponent<mixed>>>(null);

  // Android sends a "onTextChanged" event followed by a "onSelectionChanged" event, for
  // the same "most recent event count".
  // For controlled selection, that means that immediately after text is updated,
  // a controlled component will pass in the *previous* selection, even if the controlled
  // component didn't mean to modify the selection at all.
  // Therefore, we ignore selections and pass them through until the selection event has
  // been sent.
  // Note that this mitigation is NOT needed for Fabric.
  let selection: ?Selection =
    props.selection == null
      ? null
      : {
          start: props.selection.start,
          end: props.selection.end ?? props.selection.start,
        };

  const [mostRecentEventCount, setMostRecentEventCount] = useState<number>(0);

  const [lastNativeText, setLastNativeText] = useState<?Stringish>(props.value);
  const [lastNativeSelectionState, setLastNativeSelection] = useState<{|
    selection: ?Selection,
    mostRecentEventCount: number,
  |}>({selection, mostRecentEventCount});

  const lastNativeSelection = lastNativeSelectionState.selection;
  const lastNativeSelectionEventCount =
    lastNativeSelectionState.mostRecentEventCount;

  if (lastNativeSelectionEventCount < mostRecentEventCount) {
    selection = null;
  }

  let viewCommands: TextInputNativeCommands<HostComponent<any>>;
  if (AndroidTextInputCommands) {
    viewCommands = AndroidTextInputCommands;
  } else {
    viewCommands = props.multiline
      ? RCTMultilineTextInputNativeCommands
      : RCTSinglelineTextInputNativeCommands;
  }

  const text =
    typeof props.value === 'string'
      ? props.value
      : typeof props.defaultValue === 'string'
      ? props.defaultValue
      : '';

  // This is necessary in case native updates the text and JS decides
  // that the update should be ignored and we should stick with the value
  // that we have in JS.
  useLayoutEffect(() => {
    const nativeUpdate = {};

    if (lastNativeText !== props.value && typeof props.value === 'string') {
      nativeUpdate.text = props.value;
      setLastNativeText(props.value);
    }

    if (
      selection &&
      lastNativeSelection &&
      (lastNativeSelection.start !== selection.start ||
        lastNativeSelection.end !== selection.end)
    ) {
      nativeUpdate.selection = selection;
      setLastNativeSelection({selection, mostRecentEventCount});
    }

    if (Object.keys(nativeUpdate).length === 0) {
      return;
    }

    if (inputRef.current != null) {
      viewCommands.setTextAndSelection(
        inputRef.current,
        mostRecentEventCount,
        text,
        selection?.start ?? -1,
        selection?.end ?? -1,
      );
    }
  }, [
    mostRecentEventCount,
    inputRef,
    props.value,
    props.defaultValue,
    lastNativeText,
    selection,
    lastNativeSelection,
    text,
    viewCommands,
  ]);

  useLayoutEffect(() => {
    const inputRefValue = inputRef.current;

    if (inputRefValue != null) {
      TextInputState.registerInput(inputRefValue);

      return () => {
        TextInputState.unregisterInput(inputRefValue);

        if (TextInputState.currentlyFocusedInput() === inputRefValue) {
          nullthrows(inputRefValue).blur();
        }
      };
    }
  }, [inputRef]);

  function clear(): void {
    if (inputRef.current != null) {
      viewCommands.setTextAndSelection(
        inputRef.current,
        mostRecentEventCount,
        '',
        0,
        0,
      );
    }
  }

  // TODO: Fix this returning true on null === null, when no input is focused
  function isFocused(): boolean {
    return TextInputState.currentlyFocusedInput() === inputRef.current;
  }

  function getNativeRef(): ?React.ElementRef<HostComponent<mixed>> {
    return inputRef.current;
  }

  const _setNativeRef = setAndForwardRef({
    getForwardedRef: () => props.forwardedRef,
    setLocalRef: ref => {
      inputRef.current = ref;

      /*
        Hi reader from the future. I'm sorry for this.

        This is a hack. Ideally we would forwardRef to the underlying
        host component. However, since TextInput has it's own methods that can be
        called as well, if we used the standard forwardRef then these
        methods wouldn't be accessible and thus be a breaking change.

        We have a couple of options of how to handle this:
        - Return a new ref with everything we methods from both. This is problematic
          because we need React to also know it is a host component which requires
          internals of the class implementation of the ref.
        - Break the API and have some other way to call one set of the methods or
          the other. This is our long term approach as we want to eventually
          get the methods on host components off the ref. So instead of calling
          ref.measure() you might call ReactNative.measure(ref). This would hopefully
          let the ref for TextInput then have the methods like `.clear`. Or we do it
          the other way and make it TextInput.clear(textInputRef) which would be fine
          too. Either way though is a breaking change that is longer term.
        - Mutate this ref. :( Gross, but accomplishes what we need in the meantime
          before we can get to the long term breaking change.
        */
      if (ref) {
        ref.clear = clear;
        ref.isFocused = isFocused;
        ref.getNativeRef = getNativeRef;
      }
    },
  });

  const _onPress = (event: PressEvent) => {
    if (props.editable || props.editable === undefined) {
      nullthrows(inputRef.current).focus();
    }
  };

  const _onChange = (event: ChangeEvent) => {
    const text = event.nativeEvent.text;
    props.onChange && props.onChange(event);
    props.onChangeText && props.onChangeText(text);

    if (inputRef.current == null) {
      // calling `props.onChange` or `props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    setLastNativeText(text);
    // This must happen last, after we call setLastNativeText.
    // Different ordering can cause bugs when editing AndroidTextInputs
    // with multiple Fragments.
    // We must update this so that controlled input updates work.
    setMostRecentEventCount(event.nativeEvent.eventCount);
  };

  const _onSelectionChange = (event: SelectionChangeEvent) => {
    props.onSelectionChange && props.onSelectionChange(event);

    if (inputRef.current == null) {
      // calling `props.onSelectionChange`
      // may clean up the input itself. Exits here.
      return;
    }

    setLastNativeSelection({
      selection: event.nativeEvent.selection,
      mostRecentEventCount,
    });
  };

  const _onFocus = (event: FocusEvent) => {
    TextInputState.focusInput(inputRef.current);
    if (props.onFocus) {
      props.onFocus(event);
    }
  };

  const _onBlur = (event: BlurEvent) => {
    TextInputState.blurInput(inputRef.current);
    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  const _onScroll = (event: ScrollEvent) => {
    props.onScroll && props.onScroll(event);
  };

  let textInput = null;
  let additionalTouchableProps: {|
    rejectResponderTermination?: $PropertyType<
      Props,
      'rejectResponderTermination',
    >,
    // This is a hack to let Flow know we want an exact object
  |} = {...null};

  // The default value for `blurOnSubmit` is true for single-line fields and
  // false for multi-line fields.
  const blurOnSubmit = props.blurOnSubmit ?? !props.multiline;

  if (Platform.OS === 'ios') {
    const RCTTextInputView = props.multiline
      ? RCTMultilineTextInputView
      : RCTSinglelineTextInputView;

    const style = props.multiline
      ? [styles.multilineInput, props.style]
      : props.style;

    additionalTouchableProps.rejectResponderTermination =
      props.rejectResponderTermination;

    textInput = (
      <RCTTextInputView
        ref={_setNativeRef}
        {...props}
        blurOnSubmit={blurOnSubmit}
        dataDetectorTypes={props.dataDetectorTypes}
        mostRecentEventCount={mostRecentEventCount}
        onBlur={_onBlur}
        onChange={_onChange}
        onContentSizeChange={props.onContentSizeChange}
        onFocus={_onFocus}
        onScroll={_onScroll}
        onSelectionChange={_onSelectionChange}
        onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
        selection={selection}
        style={style}
        text={text}
      />
    );
  } else if (Platform.OS === 'android') {
    const style = [props.style];
    const autoCapitalize = props.autoCapitalize || 'sentences';
    let children = props.children;
    const childCount = React.Children.count(children);
    invariant(
      !(props.value && childCount),
      'Cannot specify both value and children.',
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }

    textInput = (
      /* $FlowFixMe the types for AndroidTextInput don't match up exactly with
        the props for TextInput. This will need to get fixed */
      <AndroidTextInput
        ref={_setNativeRef}
        {...props}
        autoCapitalize={autoCapitalize}
        blurOnSubmit={blurOnSubmit}
        children={children}
        disableFullscreenUI={props.disableFullscreenUI}
        mostRecentEventCount={mostRecentEventCount}
        onBlur={_onBlur}
        onChange={_onChange}
        onFocus={_onFocus}
        /* $FlowFixMe the types for AndroidTextInput don't match up exactly
          with the props for TextInput. This will need to get fixed */
        onScroll={_onScroll}
        onSelectionChange={_onSelectionChange}
        selection={selection}
        style={style}
        text={text}
        textBreakStrategy={props.textBreakStrategy}
      />
    );
  }
  return (
    <TextAncestor.Provider value={true}>
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={_onPress}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
        accessibilityState={props.accessibilityState}
        nativeID={props.nativeID}
        testID={props.testID}
        {...additionalTouchableProps}>
        {textInput}
      </TouchableWithoutFeedback>
    </TextAncestor.Provider>
  );
}

const ExportedForwardRef: React.AbstractComponent<
  React.ElementConfig<typeof InternalTextInput>,
  React.ElementRef<HostComponent<mixed>> & ImperativeMethods,
> = React.forwardRef(function TextInput(
  props,
  forwardedRef: ReactRefSetter<
    React.ElementRef<HostComponent<mixed>> & ImperativeMethods,
  >,
) {
  return <InternalTextInput {...props} forwardedRef={forwardedRef} />;
});

// $FlowFixMe
ExportedForwardRef.defaultProps = {
  allowFontScaling: true,
  rejectResponderTermination: true,
  underlineColorAndroid: 'transparent',
};

// TODO: Deprecate this
// $FlowFixMe
ExportedForwardRef.propTypes = DeprecatedTextInputPropTypes;

// $FlowFixMe
ExportedForwardRef.State = {
  currentlyFocusedInput: TextInputState.currentlyFocusedInput,

  currentlyFocusedField: TextInputState.currentlyFocusedField,
  focusTextInput: TextInputState.focusTextInput,
  blurTextInput: TextInputState.blurTextInput,
};

type TextInputComponentStatics = $ReadOnly<{|
  State: $ReadOnly<{|
    currentlyFocusedInput: typeof TextInputState.currentlyFocusedInput,
    currentlyFocusedField: typeof TextInputState.currentlyFocusedField,
    focusTextInput: typeof TextInputState.focusTextInput,
    blurTextInput: typeof TextInputState.blurTextInput,
  |}>,
  propTypes: typeof DeprecatedTextInputPropTypes,
|}>;

const styles = StyleSheet.create({
  multilineInput: {
    // This default top inset makes RCTMultilineTextInputView seem as close as possible
    // to single-line RCTSinglelineTextInputView defaults, using the system defaults
    // of font size 17 and a height of 31 points.
    paddingTop: 5,
  },
});

module.exports = ((ExportedForwardRef: any): React.AbstractComponent<
  React.ElementConfig<typeof InternalTextInput>,
  $ReadOnly<{|
    ...React.ElementRef<HostComponent<mixed>>,
    ...ImperativeMethods,
  |}>,
> &
  TextInputComponentStatics);

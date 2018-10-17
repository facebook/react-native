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

const DocumentSelectionState = require('DocumentSelectionState');
const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TextAncestor = require('TextAncestor');
const TextInputState = require('TextInputState');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const UIManager = require('UIManager');

const emptyFunction = require('fbjs/lib/emptyFunction');
const invariant = require('fbjs/lib/invariant');
const requireNativeComponent = require('requireNativeComponent');
const warning = require('fbjs/lib/warning');
const nullthrows = require('nullthrows');
const setAndForwardRef = require('setAndForwardRef');

import type {SyntheticEvent} from 'CoreEventTypes';
import type {TextStyleProp, ViewStyleProp} from 'StyleSheet';
import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {EventEmitter} from 'EventEmitter';

let AndroidTextInput;
let RCTMultilineTextInputView;
let RCTSinglelineTextInputView;

const onlyMultiline = {
  onTextInput: true,
  children: true,
};

type Event = Object;

type Selection = $ReadOnly<{|
  start: number,
  end?: number,
|}>;

type DataDetectorTypes =
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

type IOSProps = $ReadOnly<{|
  /**
   * If `false`, disables spell-check style (i.e. red underlines).
   * The default value is inherited from `autoCorrect`.
   * @platform ios
   */
  spellCheck?: ?boolean,

  /**
   * Determines the color of the keyboard.
   * @platform ios
   */
  keyboardAppearance?: ?('default' | 'light' | 'dark'),

  /**
   * If `true`, the keyboard disables the return key when there is no text and
   * automatically enables it when there is text. The default value is `false`.
   * @platform ios
   */
  enablesReturnKeyAutomatically?: ?boolean,

  /**
   * An instance of `DocumentSelectionState`, this is some state that is responsible for
   * maintaining selection information for a document.
   *
   * Some functionality that can be performed with this instance is:
   *
   * - `blur()`
   * - `focus()`
   * - `update()`
   *
   * > You can reference `DocumentSelectionState` in
   * > [`vendor/document/selection/DocumentSelectionState.js`](https://github.com/facebook/react-native/blob/master/Libraries/vendor/document/selection/DocumentSelectionState.js)
   *
   * @platform ios
   */
  selectionState?: ?DocumentSelectionState,

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
  dataDetectorTypes?: ?DataDetectorTypes | $ReadOnlyArray<DataDetectorTypes>,

  /**
   * An optional identifier which links a custom InputAccessoryView to
   * this text input. The InputAccessoryView is rendered above the
   * keyboard when this text input is focused.
   * @platform ios
   */
  inputAccessoryViewID?: ?string,

  /**
   * Give the keyboard and the system information about the
   * expected semantic meaning for the content that users enter.
   * @platform ios
   */
  textContentType?: ?(
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
    | 'oneTimeCode'
  ),

  /**
   * If `false`, scrolling of the text view will be disabled.
   * The default value is `true`. Does only work with 'multiline={true}'.
   * @platform ios
   */
  scrollEnabled?: ?boolean,
|}>;

type AndroidProps = $ReadOnly<{|
  /**
   * Sets the return key to the label. Use it instead of `returnKeyType`.
   * @platform android
   */
  returnKeyLabel?: ?string,

  /**
   * Sets the number of lines for a `TextInput`. Use it with multiline set to
   * `true` to be able to fill the lines.
   * @platform android
   */
  numberOfLines?: ?number,

  /**
   * When `false`, if there is a small amount of space available around a text input
   * (e.g. landscape orientation on a phone), the OS may choose to have the user edit
   * the text inside of a full screen text input mode. When `true`, this feature is
   * disabled and users will always edit the text directly inside of the text input.
   * Defaults to `false`.
   * @platform android
   */
  disableFullscreenUI?: ?boolean,

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
|}>;

type Props = $ReadOnly<{|
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
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: ?number,

  /**
   * If `false`, text is not editable. The default value is `true`.
   */
  editable?: ?boolean,

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
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `visible-password`
   */
  keyboardType?: ?KeyboardType,

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
  onBlur?: ?Function,

  /**
   * Callback that is called when the text input is focused.
   */
  onFocus?: ?Function,

  /**
   * Callback that is called when the text input's text changes.
   */
  onChange?: ?Function,

  /**
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   */
  onChangeText?: ?Function,

  /**
   * Callback that is called when the text input's content size changes.
   * This will be called with
   * `{ nativeEvent: { contentSize: { width, height } } }`.
   *
   * Only called for multiline text inputs.
   */
  onContentSizeChange?: ?Function,

  onTextInput?: ?Function,

  /**
   * Callback that is called when text input ends.
   */
  onEndEditing?: ?Function,

  /**
   * Callback that is called when the text input selection is changed.
   * This will be called with
   * `{ nativeEvent: { selection: { start, end } } }`.
   */
  onSelectionChange?: ?Function,

  /**
   * Callback that is called when the text input's submit button is pressed.
   * Invalid if `multiline={true}` is specified.
   */
  onSubmitEditing?: ?Function,

  /**
   * Callback that is called when a key is pressed.
   * This will be called with `{ nativeEvent: { key: keyValue } }`
   * where `keyValue` is `'Enter'` or `'Backspace'` for respective keys and
   * the typed-in character otherwise including `' '` for space.
   * Fires before `onChange` callbacks.
   */
  onKeyPress?: ?Function,

  /**
   * Invoked on content scroll with `{ nativeEvent: { contentOffset: { x, y } } }`.
   * May also contain other properties from ScrollEvent but on Android contentSize
   * is not provided for performance reasons.
   */
  onScroll?: ?Function,

  /**
   * The string that will be rendered before text input has been entered.
   */
  placeholder?: ?Stringish,

  /**
   * The text color of the placeholder string.
   */
  placeholderTextColor?: ?ColorValue,

  /**
   * If `true`, the text input obscures the text entered so that sensitive text
   * like passwords stay secure. The default value is `false`. Does not work with 'multiline={true}'.
   */
  secureTextEntry?: ?boolean,

  /**
   * The highlight and cursor color of the text input.
   */
  selectionColor?: ?ColorValue,

  /**
   * The start and end of the text input's selection. Set start and end to
   * the same value to position the cursor.
   */
  selection?: ?Selection,

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

  /**
   * Provides an initial value that will change when the user starts typing.
   * Useful for simple use-cases where you do not want to deal with listening
   * to events and updating the value prop to keep the controlled state in sync.
   */
  defaultValue?: ?Stringish,

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
   */
  blurOnSubmit?: ?boolean,

  /**
   * If `true`, caret is hidden. The default value is `false`.
   * This property is supported only for single-line TextInput component on iOS.
   */
  caretHidden?: ?boolean,

  /*
   * If `true`, contextMenuHidden is hidden. The default value is `false`.
   */
  contextMenuHidden?: ?boolean,

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
  // $FlowFixMe: Properly type the ref prop type
  forwardedRef?: $FlowIssue,
|}>;

type NativeProps = $ReadOnly<{|
  ...Props,
  text?: ?string,
  onSelectionChangeShouldSetResponder?: ?() => boolean,
  mostRecentEventCount?: ?number,
|}>;

declare class InternalTextInputType extends ReactNative.NativeComponent<
  NativeProps,
> {
  /**
   * Removes all text from the `TextInput`.
   */
  clear(): mixed;

  /**
   * Returns `true` if the input is currently focused; `false` otherwise.
   */
  isFocused(): boolean;
}

if (Platform.OS === 'android') {
  AndroidTextInput = ((requireNativeComponent('AndroidTextInput'): any): Class<
    InternalTextInputType,
  >);
} else if (Platform.OS === 'ios') {
  RCTMultilineTextInputView = ((requireNativeComponent(
    'RCTMultilineTextInputView',
  ): any): Class<InternalTextInputType>);
  RCTSinglelineTextInputView = ((requireNativeComponent(
    'RCTSinglelineTextInputView',
  ): any): Class<InternalTextInputType>);
}

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
class InternalTextInput extends React.Component<Props> {
  static defaultProps = {
    allowFontScaling: true,
    underlineColorAndroid: 'transparent',
  };

  _inputRef: ?React.ElementRef<typeof InternalTextInputType> = null;
  _lastNativeText: ?string = null;
  _lastNativeSelection: ?Selection = null;
  _rafId: ?AnimationFrameID = null;

  context: {
    focusEmitter?: ?EventEmitter,
    onFocusRequested?: ?(component: React.Component<any>) => mixed,
  };
  _focusSubscription: ?Function = null;

  _setNativeRef = setAndForwardRef({
    getForwardedRef: () => this.props.forwardedRef,
    setLocalRef: ref => {
      this._inputRef = ref;
    },
  });

  /**
   * Returns `true` if the input is currently focused; `false` otherwise.
   */
  isFocused(): boolean {
    return (
      TextInputState.currentlyFocusedField() ===
      ReactNative.findNodeHandle(this._inputRef)
    );
  }

  componentDidMount() {
    this._lastNativeText = this.props.value;
    const tag = ReactNative.findNodeHandle(this._inputRef);
    if (tag != null) {
      // tag is null only in unit tests
      TextInputState.registerInput(tag);
    }

    if (this.context.focusEmitter) {
      this._focusSubscription = this.context.focusEmitter.addListener(
        'focus',
        el => {
          if (this === el) {
            this._rafId = requestAnimationFrame(
              nullthrows(this._inputRef).focus.bind(this._inputRef),
            );
          } else if (this.isFocused()) {
            nullthrows(this._inputRef).blur();
          }
        },
      );
      if (this.props.autoFocus && this.context.onFocusRequested) {
        this.context.onFocusRequested(this);
      }
    } else {
      if (this.props.autoFocus) {
        this._rafId = requestAnimationFrame(
          nullthrows(this._inputRef).focus.bind(this._inputRef),
        );
      }
    }
  }

  componentWillUnmount() {
    this._focusSubscription && this._focusSubscription.remove();
    if (this.isFocused()) {
      nullthrows(this._inputRef).blur();
    }
    const tag = ReactNative.findNodeHandle(this._inputRef);
    if (tag != null) {
      TextInputState.unregisterInput(tag);
    }
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
    }
  }

  /**
   * Removes all text from the `TextInput`.
   */
  clear() {
    nullthrows(this._inputRef).setNativeProps({text: ''});
  }

  render() {
    let textInput;
    if (Platform.OS === 'ios') {
      textInput = UIManager.getViewManagerConfig('RCTVirtualText')
        ? this._renderIOS()
        : this._renderIOSLegacy();
    } else if (Platform.OS === 'android') {
      textInput = this._renderAndroid();
    }
    return (
      <TextAncestor.Provider value={true}>{textInput}</TextAncestor.Provider>
    );
  }

  _getText(): ?string {
    return typeof this.props.value === 'string'
      ? this.props.value
      : typeof this.props.defaultValue === 'string'
        ? this.props.defaultValue
        : '';
  }

  _renderIOSLegacy() {
    let textContainer;

    const props = Object.assign({}, this.props);
    const style = [this.props.style];

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start,
      };
    }

    if (!props.multiline) {
      if (__DEV__) {
        for (const propKey in onlyMultiline) {
          if (props[propKey]) {
            const error = new Error(
              'TextInput prop `' +
                propKey +
                '` is only supported with multiline.',
            );
            warning(false, '%s', error.stack);
          }
        }
      }
      textContainer = (
        <RCTSinglelineTextInputView
          ref={this._setNativeRef}
          {...props}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onSelectionChange={this._onSelectionChange}
          onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
          text={this._getText()}
        />
      );
    } else {
      let children = props.children;
      let childCount = 0;
      React.Children.forEach(children, () => ++childCount);
      invariant(
        !(props.value && childCount),
        'Cannot specify both value and children.',
      );
      if (childCount >= 1) {
        children = (
          <Text
            style={style}
            allowFontScaling={props.allowFontScaling}
            maxFontSizeMultiplier={props.maxFontSizeMultiplier}>
            {children}
          </Text>
        );
      }
      if (props.inputView) {
        children = [children, props.inputView];
      }
      style.unshift(styles.multilineInput);
      textContainer = (
        <RCTMultilineTextInputView
          ref={this._setNativeRef}
          {...props}
          children={children}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onContentSizeChange={this.props.onContentSizeChange}
          onSelectionChange={this._onSelectionChange}
          onTextInput={this._onTextInput}
          onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
          text={this._getText()}
          dataDetectorTypes={this.props.dataDetectorTypes}
          onScroll={this._onScroll}
        />
      );
    }

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        rejectResponderTermination={true}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
        accessibilityStates={props.accessibilityStates}
        nativeID={this.props.nativeID}
        testID={props.testID}>
        {textContainer}
      </TouchableWithoutFeedback>
    );
  }

  _renderIOS() {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start,
      };
    }

    const RCTTextInputView = props.multiline
      ? RCTMultilineTextInputView
      : RCTSinglelineTextInputView;

    if (props.multiline) {
      props.style.unshift(styles.multilineInput);
    }

    const textContainer = (
      <RCTTextInputView
        ref={this._setNativeRef}
        {...props}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onContentSizeChange={this.props.onContentSizeChange}
        onSelectionChange={this._onSelectionChange}
        onTextInput={this._onTextInput}
        onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
        text={this._getText()}
        dataDetectorTypes={this.props.dataDetectorTypes}
        onScroll={this._onScroll}
      />
    );

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        rejectResponderTermination={true}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
        accessibilityStates={props.accessibilityStates}
        nativeID={this.props.nativeID}
        testID={props.testID}>
        {textContainer}
      </TouchableWithoutFeedback>
    );
  }

  _renderAndroid() {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];
    props.autoCapitalize = UIManager.getViewManagerConfig(
      'AndroidTextInput',
    ).Constants.AutoCapitalizationType[props.autoCapitalize || 'sentences'];
    /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error when upgrading Flow's support for React. To see the
     * error delete this comment and run Flow. */
    let children = this.props.children;
    let childCount = 0;
    React.Children.forEach(children, () => ++childCount);
    invariant(
      !(this.props.value && childCount),
      'Cannot specify both value and children.',
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start,
      };
    }

    const textContainer = (
      <AndroidTextInput
        ref={this._setNativeRef}
        {...props}
        mostRecentEventCount={0}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onSelectionChange={this._onSelectionChange}
        onTextInput={this._onTextInput}
        text={this._getText()}
        children={children}
        disableFullscreenUI={this.props.disableFullscreenUI}
        textBreakStrategy={this.props.textBreakStrategy}
        onScroll={this._onScroll}
      />
    );

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        accessible={this.props.accessible}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityStates={this.props.accessibilityStates}
        nativeID={this.props.nativeID}
        testID={this.props.testID}>
        {textContainer}
      </TouchableWithoutFeedback>
    );
  }

  _onFocus = (event: Event) => {
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.focus();
    }
  };

  _onPress = (event: Event) => {
    if (this.props.editable || this.props.editable === undefined) {
      nullthrows(this._inputRef).focus();
    }
  };

  _onChange = (event: Event) => {
    // Make sure to fire the mostRecentEventCount first so it is already set on
    // native when the text value is set.
    if (this._inputRef) {
      this._inputRef.setNativeProps({
        mostRecentEventCount: event.nativeEvent.eventCount,
      });
    }

    const text = event.nativeEvent.text;
    this.props.onChange && this.props.onChange(event);
    this.props.onChangeText && this.props.onChangeText(text);

    if (!this._inputRef) {
      // calling `this.props.onChange` or `this.props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeText = text;
    this.forceUpdate();
  };

  _onSelectionChange = (event: Event) => {
    this.props.onSelectionChange && this.props.onSelectionChange(event);

    if (!this._inputRef) {
      // calling `this.props.onSelectionChange`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeSelection = event.nativeEvent.selection;

    if (this.props.selection || this.props.selectionState) {
      this.forceUpdate();
    }
  };

  componentDidUpdate() {
    // This is necessary in case native updates the text and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const nativeProps = {};

    if (
      this._lastNativeText !== this.props.value &&
      typeof this.props.value === 'string'
    ) {
      nativeProps.text = this.props.value;
    }

    // Selection is also a controlled prop, if the native value doesn't match
    // JS, update to the JS value.
    const {selection} = this.props;
    if (
      this._lastNativeSelection &&
      selection &&
      (this._lastNativeSelection.start !== selection.start ||
        this._lastNativeSelection.end !== selection.end)
    ) {
      nativeProps.selection = this.props.selection;
    }

    if (Object.keys(nativeProps).length > 0 && this._inputRef) {
      this._inputRef.setNativeProps(nativeProps);
    }

    if (this.props.selectionState && selection) {
      this.props.selectionState.update(selection.start, selection.end);
    }
  }

  _onBlur = (event: Event) => {
    nullthrows(this._inputRef).blur();
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.blur();
    }
  };

  _onTextInput = (event: Event) => {
    this.props.onTextInput && this.props.onTextInput(event);
  };

  _onScroll = (event: Event) => {
    this.props.onScroll && this.props.onScroll(event);
  };
}

// $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
const TextInput = React.forwardRef((props, ref) => (
  <InternalTextInput {...props} forwardedRef={ref} />
));

TextInput.displayName = 'TextInput';
TextInput.State = {
  currentlyFocusedField: TextInputState.currentlyFocusedField,
  focusTextInput: TextInputState.focusTextInput,
  blurTextInput: TextInputState.blurTextInput,
};

const styles = StyleSheet.create({
  multilineInput: {
    // This default top inset makes RCTMultilineTextInputView seem as close as possible
    // to single-line RCTSinglelineTextInputView defaults, using the system defaults
    // of font size 17 and a height of 31 points.
    paddingTop: 5,
  },
});

module.exports = ((TextInput: any): Class<InternalTextInputType>);

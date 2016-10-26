/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextInput
 * @flow
 */
'use strict';

const ColorPropType = require('ColorPropType');
const DocumentSelectionState = require('DocumentSelectionState');
const EventEmitter = require('EventEmitter');
const NativeMethodsMixin = require('react/lib/NativeMethodsMixin');
const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TextInputState = require('TextInputState');
const TimerMixin = require('react-timer-mixin');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const UIManager = require('UIManager');
const View = require('View');
const warning = require('fbjs/lib/warning');

const emptyFunction = require('fbjs/lib/emptyFunction');
const invariant = require('fbjs/lib/invariant');
const requireNativeComponent = require('requireNativeComponent');

const PropTypes = React.PropTypes;

const onlyMultiline = {
  onTextInput: true,
  children: true,
};

if (Platform.OS === 'android') {
  var AndroidTextInput = requireNativeComponent('AndroidTextInput', null);
} else if (Platform.OS === 'ios') {
  var RCTTextView = requireNativeComponent('RCTTextView', null);
  var RCTTextField = requireNativeComponent('RCTTextField', null);
}

type Event = Object;
type Selection = {
  start: number,
  end?: number,
};

const DataDetectorTypes = [
  'phoneNumber',
  'link',
  'address',
  'calendarEvent',
  'none',
  'all',
];

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
 * class UselessTextInput extends Component {
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
 * // App registration and rendering
 * AppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);
 * ```
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
 * class UselessTextInputMultiline extends Component {
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
 * // App registration and rendering
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
 */
const TextInput = React.createClass({
  statics: {
    /* TODO(brentvatne) docs are needed for this */
    State: TextInputState,
  },

  propTypes: {
    ...View.propTypes,
    /**
     * Can tell `TextInput` to automatically capitalize certain characters.
     *
     * - `characters`: all characters.
     * - `words`: first letter of each word.
     * - `sentences`: first letter of each sentence (*default*).
     * - `none`: don't auto capitalize anything.
     */
    autoCapitalize: PropTypes.oneOf([
      'none',
      'sentences',
      'words',
      'characters',
    ]),
    /**
     * If `false`, disables auto-correct. The default value is `true`.
     */
    autoCorrect: PropTypes.bool,
    /**
     * If `true`, focuses the input on `componentDidMount`.
     * The default value is `false`.
     */
    autoFocus: PropTypes.bool,
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
     * - `email-address`
     * - `phone-pad`
     */
    keyboardType: PropTypes.oneOf([
      // Cross-platform
      'default',
      'email-address',
      'numeric',
      'phone-pad',
      // iOS-only
      'ascii-capable',
      'numbers-and-punctuation',
      'url',
      'number-pad',
      'name-phone-pad',
      'decimal-pad',
      'twitter',
      'web-search',
    ]),
    /**
     * Determines the color of the keyboard.
     * @platform ios
     */
    keyboardAppearance: PropTypes.oneOf([
      'default',
      'light',
      'dark',
    ]),
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
    returnKeyType: PropTypes.oneOf([
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
    ]),
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
    /**
     * Callback that is called when text input ends.
     */
    onEndEditing: PropTypes.func,
    /**
     * Callback that is called when the text input selection is changed.
     */
    onSelectionChange: PropTypes.func,
    /**
     * Callback that is called when the text input's submit button is pressed.
     * Invalid if `multiline={true}` is specified.
     */
    onSubmitEditing: PropTypes.func,
    /**
     * Callback that is called when a key is pressed.
     * Pressed key value is passed as an argument to the callback handler.
     * Fires before `onChange` callbacks.
     * @platform ios
     */
    onKeyPress: PropTypes.func,
    /**
     * Invoked on mount and layout changes with `{x, y, width, height}`.
     */
    onLayout: PropTypes.func,
    /**
     * The string that will be rendered before text input has been entered.
     */
    placeholder: PropTypes.node,
    /**
     * The text color of the placeholder string.
     */
    placeholderTextColor: ColorPropType,
    /**
     * If `true`, the text input obscures the text entered so that sensitive text
     * like passwords stay secure. The default value is `false`.
     */
    secureTextEntry: PropTypes.bool,
    /**
    * The highlight (and cursor on iOS) color of the text input.
    */
    selectionColor: ColorPropType,
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
    selectionState: PropTypes.instanceOf(DocumentSelectionState),
    /**
     * The start and end of the text input's selection. Set start and end to
     * the same value to position the cursor.
     */
    selection: PropTypes.shape({
      start: PropTypes.number.isRequired,
      end: PropTypes.number,
    }),
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
    defaultValue: PropTypes.node,
    /**
     * When the clear button should appear on the right side of the text view.
     * @platform ios
     */
    clearButtonMode: PropTypes.oneOf([
      'never',
      'while-editing',
      'unless-editing',
      'always',
    ]),
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
     * [Styles](/react-native/docs/style.html)
     */
    style: Text.propTypes.style,
    /**
     * The color of the `TextInput` underline.
     * @platform android
     */
    underlineColorAndroid: ColorPropType,

    /**
     * If defined, the provided image resource will be rendered on the left.
     * @platform android
     */
    inlineImageLeft: PropTypes.string,

    /**
     * Padding between the inline image, if any, and the text input itself.
     * @platform android
     */
    inlineImagePadding: PropTypes.number,

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
    dataDetectorTypes: PropTypes.oneOfType([
      PropTypes.oneOf(DataDetectorTypes),
      PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes)),
    ]),
  },

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  mixins: [NativeMethodsMixin, TimerMixin],

  viewConfig:
    ((Platform.OS === 'ios' && RCTTextField ?
      RCTTextField.viewConfig :
      (Platform.OS === 'android' && AndroidTextInput ?
        AndroidTextInput.viewConfig :
        {})) : Object),

  /**
   * Returns `true` if the input is currently focused; `false` otherwise.
   */
  isFocused: function(): boolean {
    return TextInputState.currentlyFocusedField() ===
      ReactNative.findNodeHandle(this._inputRef);
  },

  contextTypes: {
    onFocusRequested: React.PropTypes.func,
    focusEmitter: React.PropTypes.instanceOf(EventEmitter),
  },

  _inputRef: (undefined: any),
  _focusSubscription: (undefined: ?Function),
  _lastNativeText: (undefined: ?string),
  _lastNativeSelection: (undefined: ?Selection),

  componentDidMount: function() {
    this._lastNativeText = this.props.value;
    if (!this.context.focusEmitter) {
      if (this.props.autoFocus) {
        this.requestAnimationFrame(this.focus);
      }
      return;
    }
    this._focusSubscription = this.context.focusEmitter.addListener(
      'focus',
      (el) => {
        if (this === el) {
          this.requestAnimationFrame(this.focus);
        } else if (this.isFocused()) {
          this.blur();
        }
      }
    );
    if (this.props.autoFocus) {
      this.context.onFocusRequested(this);
    }
  },

  componentWillUnmount: function() {
    this._focusSubscription && this._focusSubscription.remove();
    if (this.isFocused()) {
      this.blur();
    }
  },

  getChildContext: function(): Object {
    return {isInAParentText: true};
  },

  childContextTypes: {
    isInAParentText: React.PropTypes.bool
  },

  /**
   * Removes all text from the `TextInput`.
   */
  clear: function() {
    this.setNativeProps({text: ''});
  },

  render: function() {
    if (Platform.OS === 'ios') {
      return this._renderIOS();
    } else if (Platform.OS === 'android') {
      return this._renderAndroid();
    }
  },

  _getText: function(): ?string {
    return typeof this.props.value === 'string' ?
      this.props.value :
      (
        typeof this.props.defaultValue === 'string' ?
        this.props.defaultValue :
        ''
      );
  },

  _setNativeRef: function(ref: any) {
    this._inputRef = ref;
  },

  _renderIOS: function() {
    var textContainer;

    var props = Object.assign({}, this.props);
    props.style = [styles.input, this.props.style];

    if (props.selection && props.selection.end == null) {
      props.selection = {start: props.selection.start, end: props.selection.start};
    }

    if (!props.multiline) {
      if (__DEV__) {
        for (var propKey in onlyMultiline) {
          if (props[propKey]) {
            const error = new Error(
              'TextInput prop `' + propKey + '` is only supported with multiline.'
            );
            warning(false, '%s', error.stack);
          }
        }
      }
      textContainer =
        <RCTTextField
          ref={this._setNativeRef}
          {...props}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onSelectionChange={this._onSelectionChange}
          onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
          text={this._getText()}
        />;
    } else {
      var children = props.children;
      var childCount = 0;
      React.Children.forEach(children, () => ++childCount);
      invariant(
        !(props.value && childCount),
        'Cannot specify both value and children.'
      );
      if (childCount >= 1) {
        children = <Text style={props.style}>{children}</Text>;
      }
      if (props.inputView) {
        children = [children, props.inputView];
      }
      textContainer =
        <RCTTextView
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
        />;
    }

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        rejectResponderTermination={true}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityTraits={props.accessibilityTraits}
        testID={props.testID}>
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _renderAndroid: function() {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];
    props.autoCapitalize =
      UIManager.AndroidTextInput.Constants.AutoCapitalizationType[this.props.autoCapitalize];
    var children = this.props.children;
    var childCount = 0;
    React.Children.forEach(children, () => ++childCount);
    invariant(
      !(this.props.value && childCount),
      'Cannot specify both value and children.'
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }

    if (props.selection && props.selection.end == null) {
      props.selection = {start: props.selection.start, end: props.selection.start};
    }

    const textContainer =
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
      />;

    return (
      <TouchableWithoutFeedback
        onLayout={this.props.onLayout}
        onPress={this._onPress}
        accessible={this.props.accessible}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityComponentType={this.props.accessibilityComponentType}
        testID={this.props.testID}>
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _onFocus: function(event: Event) {
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.focus();
    }
  },

  _onPress: function(event: Event) {
    if (this.props.editable || this.props.editable === undefined) {
      this.focus();
    }
  },

  _onChange: function(event: Event) {
    // Make sure to fire the mostRecentEventCount first so it is already set on
    // native when the text value is set.
    this._inputRef.setNativeProps({
      mostRecentEventCount: event.nativeEvent.eventCount,
    });

    var text = event.nativeEvent.text;
    this.props.onChange && this.props.onChange(event);
    this.props.onChangeText && this.props.onChangeText(text);

    if (!this._inputRef) {
      // calling `this.props.onChange` or `this.props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeText = text;
    this.forceUpdate();
  },

  _onSelectionChange: function(event: Event) {
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
  },

  componentDidUpdate: function () {
    // This is necessary in case native updates the text and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const nativeProps = {};

    if (this._lastNativeText !== this.props.value && typeof this.props.value === 'string') {
      nativeProps.text = this.props.value;
    }

    // Selection is also a controlled prop, if the native value doesn't match
    // JS, update to the JS value.
    const {selection} = this.props;
    if (this._lastNativeSelection && selection &&
        (this._lastNativeSelection.start !== selection.start ||
        this._lastNativeSelection.end !== selection.end)) {
      nativeProps.selection = this.props.selection;
    }

    if (Object.keys(nativeProps).length > 0) {
      this._inputRef.setNativeProps(nativeProps);
    }

    if (this.props.selectionState && selection) {
      this.props.selectionState.update(selection.start, selection.end);
    }
  },

  _onBlur: function(event: Event) {
    this.blur();
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.blur();
    }
  },

  _onTextInput: function(event: Event) {
    this.props.onTextInput && this.props.onTextInput(event);
  },
});

var styles = StyleSheet.create({
  input: {
    alignSelf: 'stretch',
  },
});

module.exports = TextInput;

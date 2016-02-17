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

var DocumentSelectionState = require('DocumentSelectionState');
var EventEmitter = require('EventEmitter');
var NativeMethodsMixin = require('NativeMethodsMixin');
var Platform = require('Platform');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactChildren = require('ReactChildren');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TextInputState = require('TextInputState');
var TimerMixin = require('react-timer-mixin');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var UIManager = require('UIManager');
var View = require('View');

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var emptyFunction = require('emptyFunction');
var invariant = require('invariant');
var requireNativeComponent = require('requireNativeComponent');

var onlyMultiline = {
  onTextInput: true, // not supported in Open Source yet
  children: true,
};

var notMultiline = {
  // nothing yet
};

if (Platform.OS === 'android') {
  var AndroidTextInput = requireNativeComponent('AndroidTextInput', null);
} else if (Platform.OS === 'ios') {
  var RCTTextView = requireNativeComponent('RCTTextView', null);
  var RCTTextField = requireNativeComponent('RCTTextField', null);
}

type Event = Object;

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
 * ```
 *   <TextInput
 *     style={{height: 40, borderColor: 'gray', borderWidth: 1}}
 *     onChangeText={(text) => this.setState({text})}
 *     value={this.state.text}
 *   />
 * ```
 *
 * Note that some props are only available with `multiline={true/false}`:
 */
var TextInput = React.createClass({
  statics: {
    /* TODO(brentvatne) docs are needed for this */
    State: TextInputState,
  },

  propTypes: {
    ...View.propTypes,
    /**
     * Can tell TextInput to automatically capitalize certain characters.
     *
     * - characters: all characters,
     * - words: first letter of each word
     * - sentences: first letter of each sentence (default)
     * - none: don't auto capitalize anything
     */
    autoCapitalize: PropTypes.oneOf([
      'none',
      'sentences',
      'words',
      'characters',
    ]),
    /**
     * If false, disables auto-correct. The default value is true.
     */
    autoCorrect: PropTypes.bool,
    /**
     * If true, focuses the input on componentDidMount.
     * The default value is false.
     */
    autoFocus: PropTypes.bool,
    /**
     * If false, text is not editable. The default value is true.
     */
    editable: PropTypes.bool,
    /**
     * Determines which keyboard to open, e.g.`numeric`.
     *
     * The following values work across platforms:
     * - default
     * - numeric
     * - email-address
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
     * Determines how the return key should look.
     * @platform ios
     */
    returnKeyType: PropTypes.oneOf([
      'default',
      'go',
      'google',
      'join',
      'next',
      'route',
      'search',
      'send',
      'yahoo',
      'done',
      'emergency-call',
    ]),
    /**
     * Limits the maximum number of characters that can be entered. Use this
     * instead of implementing the logic in JS to avoid flicker.
     */
    maxLength: PropTypes.number,
    /**
     * Sets the number of lines for a TextInput. Use it with multiline set to
     * true to be able to fill the lines.
     * @platform android
     */
    numberOfLines: PropTypes.number,
    /**
     * If true, the keyboard disables the return key when there is no text and
     * automatically enables it when there is text. The default value is false.
     * @platform ios
     */
    enablesReturnKeyAutomatically: PropTypes.bool,
    /**
     * If true, the text input can be multiple lines.
     * The default value is false.
     */
    multiline: PropTypes.bool,
    /**
     * Callback that is called when the text input is blurred
     */
    onBlur: PropTypes.func,
    /**
     * Callback that is called when the text input is focused
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
     * Callback that is called when text input ends.
     */
    onEndEditing: PropTypes.func,
    /**
     * Callback that is called when the text input selection is changed
     */
    onSelectionChange: PropTypes.func,
    /**
     * Callback that is called when the text input's submit button is pressed.
     * Invalid if multiline={true} is specified.
     */
    onSubmitEditing: PropTypes.func,
    /**
     * Callback that is called when a key is pressed.
     * Pressed key value is passed as an argument to the callback handler.
     * Fires before onChange callbacks.
     * @platform ios
     */
    onKeyPress: PropTypes.func,
    /**
     * Invoked on mount and layout changes with `{x, y, width, height}`.
     */
    onLayout: PropTypes.func,
    /**
     * The string that will be rendered before text input has been entered
     */
    placeholder: PropTypes.string,
    /**
     * The text color of the placeholder string
     */
    placeholderTextColor: PropTypes.string,
    /**
     * If true, the text input obscures the text entered so that sensitive text
     * like passwords stay secure. The default value is false.
     */
    secureTextEntry: PropTypes.bool,
    /**
    * The highlight (and cursor on ios) color of the text input
    */
    selectionColor: PropTypes.string,
    /**
     * See DocumentSelectionState.js, some state that is responsible for
     * maintaining selection information for a document
     * @platform ios
     */
    selectionState: PropTypes.instanceOf(DocumentSelectionState),
    /**
     * The value to show for the text input. TextInput is a controlled
     * component, which means the native value will be forced to match this
     * value prop if provided. For most uses this works great, but in some
     * cases this may cause flickering - one common cause is preventing edits
     * by keeping value the same. In addition to simply setting the same value,
     * either set `editable={false}`, or set/update `maxLength` to prevent
     * unwanted edits without flicker.
     */
    value: PropTypes.string,
    /**
     * Provides an initial value that will change when the user starts typing.
     * Useful for simple use-cases where you don't want to deal with listening
     * to events and updating the value prop to keep the controlled state in sync.
     */
    defaultValue: PropTypes.string,
    /**
     * When the clear button should appear on the right side of the text view
     * @platform ios
     */
    clearButtonMode: PropTypes.oneOf([
      'never',
      'while-editing',
      'unless-editing',
      'always',
    ]),
    /**
     * If true, clears the text field automatically when editing begins
     * @platform ios
     */
    clearTextOnFocus: PropTypes.bool,
    /**
     * If true, all text will automatically be selected on focus
     * @platform ios
     */
    selectTextOnFocus: PropTypes.bool,
    /**
     * If true, the text field will blur when submitted.
     * The default value is true for single-line fields and false for
     * multiline fields. Note that for multiline fields, setting blurOnSubmit
     * to true means that pressing return will blur the field and trigger the
     * onSubmitEditing event instead of inserting a newline into the field.
     * @platform ios
     */
    blurOnSubmit: PropTypes.bool,
    /**
     * Styles
     */
    style: Text.propTypes.style,
    /**
     * The color of the textInput underline.
     * @platform android
     */
    underlineColorAndroid: PropTypes.string,
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

  isFocused: function(): boolean {
    return TextInputState.currentlyFocusedField() ===
      React.findNodeHandle(this.refs.input);
  },

  contextTypes: {
    onFocusRequested: React.PropTypes.func,
    focusEmitter: React.PropTypes.instanceOf(EventEmitter),
  },

  _focusSubscription: (undefined: ?Function),

  componentDidMount: function() {
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
      this.props.defaultValue;
  },

  _renderIOS: function() {
    var textContainer;

    var onSelectionChange;
    if (this.props.selectionState || this.props.onSelectionChange) {
      onSelectionChange = (event: Event) => {
        if (this.props.selectionState) {
          var selection = event.nativeEvent.selection;
          this.props.selectionState.update(selection.start, selection.end);
        }
        this.props.onSelectionChange && this.props.onSelectionChange(event);
      };
    }

    var props = Object.assign({}, this.props);
    props.style = [styles.input, this.props.style];
    if (!props.multiline) {
      for (var propKey in onlyMultiline) {
        if (props[propKey]) {
          throw new Error(
            'TextInput prop `' + propKey + '` is only supported with multiline.'
          );
        }
      }
      textContainer =
        <RCTTextField
          ref="input"
          {...props}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onSelectionChange={onSelectionChange}
          onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
          text={this._getText()}
        />;
    } else {
      for (var propKey in notMultiline) {
        if (props[propKey]) {
          throw new Error(
            'TextInput prop `' + propKey + '` cannot be used with multiline.'
          );
        }
      }

      var children = props.children;
      var childCount = 0;
      ReactChildren.forEach(children, () => ++childCount);
      invariant(
        !(props.value && childCount),
        'Cannot specify both value and children.'
      );
      if (childCount > 1) {
        children = <Text>{children}</Text>;
      }
      if (props.inputView) {
        children = [children, props.inputView];
      }
      textContainer =
        <RCTTextView
          ref="input"
          {...props}
          children={children}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onSelectionChange={onSelectionChange}
          onTextInput={this._onTextInput}
          onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
          text={this._getText()}
        />;
    }

    return (
      <TouchableWithoutFeedback
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
    var onSelectionChange;
    if (this.props.selectionState || this.props.onSelectionChange) {
      onSelectionChange = (event: Event) => {
        if (this.props.selectionState) {
          var selection = event.nativeEvent.selection;
          this.props.selectionState.update(selection.start, selection.end);
        }
        this.props.onSelectionChange && this.props.onSelectionChange(event);
      };
    }

    var autoCapitalize =
      UIManager.AndroidTextInput.Constants.AutoCapitalizationType[this.props.autoCapitalize];
    var children = this.props.children;
    var childCount = 0;
    ReactChildren.forEach(children, () => ++childCount);
    invariant(
      !(this.props.value && childCount),
      'Cannot specify both value and children.'
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }

    var textContainer =
      <AndroidTextInput
        ref="input"
        style={[this.props.style]}
        autoCapitalize={autoCapitalize}
        autoCorrect={this.props.autoCorrect}
        keyboardType={this.props.keyboardType}
        mostRecentEventCount={0}
        multiline={this.props.multiline}
        numberOfLines={this.props.numberOfLines}
        maxLength={this.props.maxLength}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onSelectionChange={onSelectionChange}
        onTextInput={this._onTextInput}
        onEndEditing={this.props.onEndEditing}
        onSubmitEditing={this.props.onSubmitEditing}
        onLayout={this.props.onLayout}
        password={this.props.password || this.props.secureTextEntry}
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        selectionColor={this.props.selectionColor}
        text={this._getText()}
        underlineColorAndroid={this.props.underlineColorAndroid}
        children={children}
        editable={this.props.editable}
      />;

    return (
      <TouchableWithoutFeedback
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
    this.refs.input.setNativeProps({
      mostRecentEventCount: event.nativeEvent.eventCount,
    });

    var text = event.nativeEvent.text;
    this.props.onChange && this.props.onChange(event);
    this.props.onChangeText && this.props.onChangeText(text);

    if (!this.refs.input) {
      // calling `this.props.onChange` or `this.props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    // This is necessary in case native updates the text and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    if (text !== this.props.value && typeof this.props.value === 'string') {
      this.refs.input.setNativeProps({
        text: this.props.value,
      });
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

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
var RCTUIManager = require('NativeModules').UIManager;
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactChildren = require('ReactChildren');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TextInputState = require('TextInputState');
var TimerMixin = require('react-timer-mixin');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var emptyFunction = require('emptyFunction');
var getObjectValues = require('getObjectValues');
var invariant = require('invariant');
var merge = require('merge');

var autoCapitalizeConsts = RCTUIManager.UIText.AutocapitalizationType;
var clearButtonModeConsts = RCTUIManager.UITextField.clearButtonMode;

var RCTTextViewAttributes = merge(ReactIOSViewAttributes.UIView, {
  autoCorrect: true,
  autoCapitalize: true,
  color: true,
  editable: true,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontWeight: true,
  keyboardType: true,
  mostRecentEventCounter: true,
  placeholder: true,
  placeholderTextColor: true,
  text: true,
});

var RCTTextFieldAttributes = merge(RCTTextViewAttributes, {
  caretHidden: true,
  enabled: true,
  clearButtonMode: true,
});

var onlyMultiline = {
  onSelectionChange: true,
  onTextInput: true,
  children: true,
};

var notMultiline = {
  onSubmitEditing: true,
};

type DefaultProps = {
  bufferDelay: number;
};

type Event = Object;

/**
 * A foundational component for inputting text into the app via a
 * keyboard.  Props provide configurability for several features, such as auto-
 * correction, auto-capitalization, placeholder text, and different keyboard
 * types, such as a numeric keypad.
 *
 * The simplest use case is to plop down a `TextInput` and subscribe to the
 * `onChangeText` events to read the user input.  There are also other events, such
 * as `onSubmitEditing` and `onFocus` that can be subscribed to.  A simple
 * example:
 *
 * ```
 * <View>
 *   <TextInput
 *     style={{height: 40, borderColor: 'gray', borderWidth: 1}}
 *     onChangeText={(text) => this.setState({input: text})}
 *   />
 *   <Text>{'user input: ' + this.state.input}</Text>
 * </View>
 * ```
 *
 * The `value` prop can be used to set the value of the input in order to make
 * the state of the component clear, but <TextInput> does not behave as a true
 * controlled component by default because all operations are asynchronous.
 * Setting `value` once is like setting the default value, but you can change it
 * continuously based on `onChangeText` events as well.  If you really want to
 * force the component to always revert to the value you are setting, you can
 * set `controlled={true}`.
 *
 * The `multiline` prop is not supported in all releases, and some props are
 * multiline only.
 */

var TextInput = React.createClass({
  propTypes: {
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
     * If false, disables auto-correct. Default value is true.
     */
    autoCorrect: PropTypes.bool,
    /**
     * If true, focuses the input on componentDidMount. Default value is false.
     */
    autoFocus: PropTypes.bool,
    /**
     * If false, text is not editable. Default value is true.
     */
    editable: PropTypes.bool,
    /**
     * Determines which keyboard to open, e.g.`numeric`.
     */
    keyboardType: PropTypes.oneOf([
      'default',
      'numeric',
    ]),
    /**
     * If true, the text input can be multiple lines. Default value is false.
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
     * (text: string) => void
     *
     * Callback that is called when the text input's text changes.
     */
    onChangeText: PropTypes.func,

    onEndEditing: PropTypes.func,
    onSubmitEditing: PropTypes.func,
    /**
     * The string that will be rendered before text input has been entered
     */
    placeholder: PropTypes.string,
    /**
     * The text color of the placeholder string
     */
    placeholderTextColor: PropTypes.string,
    /**
     * See DocumentSelectionState.js, some state that is responsible for
     * maintaining selection information for a document
     */
    selectionState: PropTypes.instanceOf(DocumentSelectionState),
    /**
     * The default value for the text input
     */
    value: PropTypes.string,
    /**
     * This helps avoid drops characters due to race conditions between JS and
     * the native text input.  The default should be fine, but if you're
     * potentially doing very slow operations on every keystroke then you may
     * want to try increasing this.
     */
    bufferDelay: PropTypes.number,
    /**
     * If you really want this to behave as a controlled component, you can set
     * this true, but you will probably see flickering, dropped keystrokes,
     * and/or laggy typing, depending on how you process onChange events.
     */
    controlled: PropTypes.bool,
    /**
     * When the clear button should appear on the right side of the text view
     */
    clearButtonMode: PropTypes.oneOf([
      'never',
      'while-editing',
      'unless-editing',
      'always',
    ]),

    style: Text.propTypes.style,
  },

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  mixins: [NativeMethodsMixin, TimerMixin],

  viewConfig: {
    uiViewClassName: 'RCTTextField',
    validAttributes: RCTTextFieldAttributes,
  },

  isFocused: function(): boolean {
    return TextInputState.currentlyFocusedField() ===
      this.refs.input.getNativeNode();
  },

  getDefaultProps: function(): DefaultProps {
    return {
      bufferDelay: 100,
    };
  },

  getInitialState: function() {
    return {
      mostRecentEventCounter: 0,
      bufferedValue: this.props.value,
    };
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
  },

  _bufferTimeout: (undefined: ?number),

  componentWillReceiveProps: function(newProps: {value: any}) {
    if (newProps.value !== this.props.value) {
      if (!this.isFocused()) {
        // Set the value immediately if the input is not focused since that
        // means there is no risk of the user typing immediately.
        this.setState({bufferedValue: newProps.value});
      } else {
        // The following clear and setTimeout buffers the value such that if more
        // characters are typed in quick succession, generating new values, the
        // out of date values will get cancelled before they are ever sent to
        // native.
        //
        // If we don't do this, it's likely the out of date values will blow
        // away recently typed characters in the native input that JS was not
        // yet aware of (since it is informed asynchronously), then the next
        // character will be appended to the older value, dropping the
        // characters in between.  Here is a potential sequence of events
        // (recall we have multiple independently serial, interleaved queues):
        //
        // 1) User types 'R' => send 'R' to JS queue.
        // 2) User types 'e' => send 'Re' to JS queue.
        // 3) JS processes 'R' and sends 'R' back to native.
        // 4) Native recieves 'R' and changes input from 'Re' back to 'R'.
        // 5) User types 'a' => send 'Ra' to JS queue.
        // 6) JS processes 'Re' and sends 'Re' back to native.
        // 7) Native recieves 'Re' and changes input from 'R' back to 'Re'.
        // 8) JS processes 'Ra' and sends 'Ra' back to native.
        // 9) Native recieves final 'Ra' from JS - 'e' has been dropped!
        //
        // This isn't 100% foolproop (e.g. if it takes longer than
        // `props.bufferDelay` ms to process one keystroke), and there are of
        // course other potential algorithms to deal with this, but this is a
        // simple solution that seems to reduce the chance of dropped characters
        // drastically without compromising native input responsiveness (e.g. by
        // introducing delay from a synchronization protocol).
        this.clearTimeout(this._bufferTimeout);
        this._bufferTimeout = this.setTimeout(
          () => this.setState({bufferedValue: newProps.value}),
          this.props.bufferDelay
        );
      }
    }
  },

  render: function() {
    var textContainer;

    var autoCapitalize = autoCapitalizeConsts[this.props.autoCapitalize];
    var clearButtonMode = clearButtonModeConsts[this.props.clearButtonMode];

    if (!this.props.multiline) {
      for (var propKey in onlyMultiline) {
        if (this.props[propKey]) {
          throw new Error(
            'TextInput prop `' + propKey + '` is only supported with multiline.'
          );
        }
      }
      textContainer =
        <RCTTextField
          ref="input"
          style={[styles.input, this.props.style]}
          enabled={this.props.editable}
          keyboardType={this.props.keyboardType}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onEndEditing={this.props.onEndEditing}
          onSubmitEditing={this.props.onSubmitEditing}
          onSelectionChangeShouldSetResponder={() => true}
          placeholder={this.props.placeholder}
          text={this.state.bufferedValue}
          autoCapitalize={autoCapitalize}
          autoCorrect={this.props.autoCorrect}
          clearButtonMode={clearButtonMode}
        />;
    } else {
      for (var propKey in notMultiline) {
        if (this.props[propKey]) {
          throw new Error(
            'TextInput prop `' + propKey + '` cannot be used with multiline.'
          );
        }
      }

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
      if (this.props.inputView) {
        children = [children, this.props.inputView];
      }
      textContainer =
        <RCTTextView
          ref="input"
          style={[styles.input, this.props.style]}
          children={children}
          mostRecentEventCounter={this.state.mostRecentEventCounter}
          editable={this.props.editable}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onEndEditing={this.props.onEndEditing}
          onSelectionChange={this._onSelectionChange}
          onTextInput={this._onTextInput}
          onSelectionChangeShouldSetResponder={emptyFunction.thatReturnsTrue}
          placeholder={this.props.placeholder}
          placeholderTextColor={this.props.placeholderTextColor}
          text={this.state.bufferedValue}
          autoCapitalize={autoCapitalize}
          autoCorrect={this.props.autoCorrect}
          clearButtonMode={clearButtonMode}
        />;
    }

    return (
      <TouchableWithoutFeedback
        onPress={this._onPress}
        rejectResponderTermination={true}>
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _onFocus: function(event: Event) {
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  },

  _onPress: function(event: Event) {
    this.focus();
  },

  _onChange: function(event: Event) {
    if (this.props.controlled && event.nativeEvent.text !== this.props.value) {
      this.refs.input.setNativeProps({text: this.props.value});
    }
    this.props.onChange && this.props.onChange(event);
    this.props.onChangeText && this.props.onChangeText(event.nativeEvent.text);
  },

  _onBlur: function(event: Event) {
    this.blur();
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  },

  _onSelectionChange: function(event: Event) {
    if (this.props.selectionState) {
      var selection = event.nativeEvent.selection;
      this.props.selectionState.update(selection.start, selection.end);
    }
    this.props.onSelectionChange && this.props.onSelectionChange(event);
  },

  _onTextInput: function(event: Event) {
    this.props.onTextInput && this.props.onTextInput(event);
    var counter = event.nativeEvent.eventCounter;
    if (counter > this.state.mostRecentEventCounter) {
      this.setState({mostRecentEventCounter: counter});
    }
  },
});

var styles = StyleSheet.create({
  input: {
    alignSelf: 'stretch',
  },
});

var RCTTextView = createReactIOSNativeComponentClass({
  validAttributes: RCTTextViewAttributes,
  uiViewClassName: 'RCTTextView',
});

var RCTTextField = createReactIOSNativeComponentClass({
  validAttributes: RCTTextFieldAttributes,
  uiViewClassName: 'RCTTextField',
});

module.exports = TextInput;

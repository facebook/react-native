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

const DeprecatedViewPropTypes = require('DeprecatedViewPropTypes');
const DeprecatedColorPropType = require('DeprecatedColorPropType');
const DocumentSelectionState = require('DocumentSelectionState');
const TextStylePropTypes = require('TextStylePropTypes');
const Platform = require('Platform');
const PropTypes = require('prop-types');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TextAncestor = require('TextAncestor');
const TextInputState = require('TextInputState');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const UIManager = require('UIManager');

const {
  AndroidTextInput,
  RCTMultilineTextInputView,
  RCTSinglelineTextInputView,
} = require('TextInputNativeComponent');

const emptyFunction = require('fbjs/lib/emptyFunction');
const invariant = require('fbjs/lib/invariant');
const warning = require('fbjs/lib/warning');
const nullthrows = require('nullthrows');
const setAndForwardRef = require('setAndForwardRef');

import type {Props, Selection, Event} from 'TextInputTypes';
import type {EventEmitter} from 'EventEmitter';
import type {TextInputType} from 'TextInputNativeComponent';
import type {PressEvent} from 'CoreEventTypes';

const onlyMultiline = {
  onTextInput: true,
  children: true,
};

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
class TextInput extends React.Component<Props> {
  static defaultProps = {
    allowFontScaling: true,
    underlineColorAndroid: 'transparent',
  };

  _inputRef: ?React.ElementRef<Class<TextInputType>> = null;
  _lastNativeText: ?Stringish = null;
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

  _onPress = (event: PressEvent) => {
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
const TextInputWithRef = React.forwardRef((props, ref) => (
  <TextInput {...props} forwardedRef={ref} />
));

TextInputWithRef.displayName = 'TextInput';

const DataDetectorTypes = [
  'phoneNumber',
  'link',
  'address',
  'calendarEvent',
  'none',
  'all',
];

TextInputWithRef.propTypes = {
  ...DeprecatedViewPropTypes,
  autoCapitalize: PropTypes.oneOf(['none', 'sentences', 'words', 'characters']),
  autoCorrect: PropTypes.bool,
  spellCheck: PropTypes.bool,
  autoFocus: PropTypes.bool,
  allowFontScaling: PropTypes.bool,
  maxFontSizeMultiplier: PropTypes.number,
  editable: PropTypes.bool,
  keyboardType: PropTypes.oneOf([
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
    // Android-only
    'visible-password',
  ]),
  keyboardAppearance: PropTypes.oneOf(['default', 'light', 'dark']),
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
  returnKeyLabel: PropTypes.string,
  maxLength: PropTypes.number,
  numberOfLines: PropTypes.number,
  disableFullscreenUI: PropTypes.bool,
  enablesReturnKeyAutomatically: PropTypes.bool,
  multiline: PropTypes.bool,
  textBreakStrategy: PropTypes.oneOf(['simple', 'highQuality', 'balanced']),
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onChange: PropTypes.func,
  onChangeText: PropTypes.func,
  onContentSizeChange: PropTypes.func,
  onTextInput: PropTypes.func,
  onEndEditing: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onSubmitEditing: PropTypes.func,
  onKeyPress: PropTypes.func,
  onLayout: PropTypes.func,
  onScroll: PropTypes.func,
  placeholder: PropTypes.string,
  placeholderTextColor: DeprecatedColorPropType,
  scrollEnabled: PropTypes.bool,
  secureTextEntry: PropTypes.bool,
  selectionColor: DeprecatedColorPropType,
  selectionState: PropTypes.instanceOf(DocumentSelectionState),
  selection: PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number,
  }),
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  clearButtonMode: PropTypes.oneOf([
    'never',
    'while-editing',
    'unless-editing',
    'always',
  ]),
  clearTextOnFocus: PropTypes.bool,
  selectTextOnFocus: PropTypes.bool,
  blurOnSubmit: PropTypes.bool,
  style: TextStylePropTypes,
  underlineColorAndroid: DeprecatedColorPropType,
  inlineImageLeft: PropTypes.string,
  inlineImagePadding: PropTypes.number,
  dataDetectorTypes: PropTypes.oneOfType([
    PropTypes.oneOf(DataDetectorTypes),
    PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes)),
  ]),
  caretHidden: PropTypes.bool,
  contextMenuHidden: PropTypes.bool,
  inputAccessoryViewID: PropTypes.string,
  textContentType: PropTypes.oneOf([
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
  ]),
};

const styles = StyleSheet.create({
  multilineInput: {
    // This default top inset makes RCTMultilineTextInputView seem as close as possible
    // to single-line RCTSinglelineTextInputView defaults, using the system defaults
    // of font size 17 and a height of 31 points.
    paddingTop: 5,
  },
});

module.exports = ((TextInputWithRef: any): Class<TextInputType>);

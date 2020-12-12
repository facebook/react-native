/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = require('../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const TouchableNativeFeedback = require('./Touchable/TouchableNativeFeedback');
const TouchableOpacity = require('./Touchable/TouchableOpacity');
const View = require('./View/View');

const invariant = require('invariant');

import type {PressEvent, KeyEvent} from '../Types/CoreEventTypes';
import type {FocusEvent, BlurEvent} from './TextInput/TextInput'; // TODO(OSS Candidate ISS#2710739)
import type {ColorValue} from '../StyleSheet/StyleSheetTypes';

type ButtonProps = $ReadOnly<{|
  /**
   * Text to display inside the button
   */
  title: string,

  /**
   * Handler to be called when the user taps the button
   */
  onPress: (event?: PressEvent) => mixed,

  /**
   * If true, doesn't play system sound on touch (Android Only)
   **/
  touchSoundDisabled?: ?boolean,

  /**
   * Color of the text (iOS), or background color of the button (Android)
   */
  color?: ?ColorValue,

  /**
   * TV preferred focus (see documentation for the View component).
   */
  hasTVPreferredFocus?: ?boolean,

  /**
   * TV next focus down (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusDown?: ?number,

  /**
   * TV next focus forward (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusForward?: ?number,

  /**
   * TV next focus left (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusLeft?: ?number,

  /**
   * TV next focus right (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusRight?: ?number,

  /**
   * TV next focus up (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusUp?: ?number,

  /**
   * Text to display for blindness accessibility features
   */
  accessibilityLabel?: ?string,
  /**
   * Hint text to display blindness accessibility features
   */
  accessibilityHint?: ?string, // TODO(OSS Candidate ISS#2710739)
  /**
   * If true, disable all interactions for this component.
   */
  disabled?: ?boolean,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  // [TODO(OSS Candidate ISS#2710739)
  /**
   * Handler to be called when the button receives key focus
   */
  onBlur?: ?(e: BlurEvent) => void,

  /**
   * Handler to be called when the button loses key focus
   */
  onFocus?: ?(e: FocusEvent) => void,

  /**
   * Handler to be called when a key down press is detected
   */
  onKeyDown?: ?(e: KeyEvent) => void,

  /**
   * Handler to be called when a key up press is detected
   */
  onKeyUp?: ?(e: KeyEvent) => void,

  /*
   * Array of keys to receive key down events for
   * For arrow keys, add "leftArrow", "rightArrow", "upArrow", "downArrow",
   */
  validKeysDown?: ?Array<string>,

  /*
   * Array of keys to receive key up events for
   * For arrow keys, add "leftArrow", "rightArrow", "upArrow", "downArrow",
   */
  validKeysUp?: ?Array<string>,
  // ]TODO(OSS Candidate ISS#2710739)
|}>;

/**
 * A basic button component that should render nicely on any platform. Supports
 * a minimal level of customization.
 *
 * <center><img src="img/buttonExample.png"></img></center>
 *
 * If this button doesn't look right for your app, you can build your own
 * button using [TouchableOpacity](docs/touchableopacity.html)
 * or [TouchableNativeFeedback](docs/touchablenativefeedback.html).
 * For inspiration, look at the [source code for this button component](https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js).
 * Or, take a look at the [wide variety of button components built by the community](https://js.coach/react-native?search=button).
 *
 * Example usage:
 *
 * ```
 * import { Button } from 'react-native';
 * ...
 *
 * <Button
 *   onPress={onPressLearnMore}
 *   title="Learn More"
 *   color="#841584"
 *   accessibilityLabel="Learn more about this purple button"
 * />
 * ```
 *
 */

class Button extends React.Component<ButtonProps> {
  render(): React.Node {
    const {
      accessibilityLabel,
      accessibilityHint, // TODO(OSS Candidate ISS#2710739)
      color,
      onPress,
      touchSoundDisabled,
      title,
      hasTVPreferredFocus,
      nextFocusDown,
      nextFocusForward,
      nextFocusLeft,
      nextFocusRight,
      nextFocusUp,
      disabled,
      testID,
      onFocus, // TODO(OSS Candidate ISS#2710739)
      onBlur, // TODO(OSS Candidate ISS#2710739)
      onKeyDown,
      validKeysDown,
      validKeysUp,
      onKeyUp,
    } = this.props;
    const buttonStyles = [styles.button];
    const textStyles = [styles.text];
    if (color) {
      if (
        Platform.OS === 'ios' ||
        Platform.OS === 'macos' /* TODO(macOS ISS#2323203) */
      ) {
        textStyles.push({color: color});
      } else {
        buttonStyles.push({backgroundColor: color});
      }
    }
    const accessibilityState = {};
    if (disabled) {
      buttonStyles.push(styles.buttonDisabled);
      textStyles.push(styles.textDisabled);
      accessibilityState.disabled = true;
    }
    invariant(
      typeof title === 'string',
      'The title prop of a Button must be a string',
    );
    const formattedTitle =
      Platform.OS === 'android' ? title.toUpperCase() : title;
    const Touchable =
      Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;
    return (
      <Touchable
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint} // TODO(OSS Candidate ISS#2710739)
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        hasTVPreferredFocus={hasTVPreferredFocus}
        nextFocusDown={nextFocusDown}
        nextFocusForward={nextFocusForward}
        nextFocusLeft={nextFocusLeft}
        nextFocusRight={nextFocusRight}
        nextFocusUp={nextFocusUp}
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        onFocus={onFocus} // TODO(OSS Candidate ISS#2710739)
        onBlur={onBlur} // TODO(OSS Candidate ISS#2710739)
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        validKeysDown={validKeysDown}
        validKeysUp={validKeysUp}
        touchSoundDisabled={touchSoundDisabled}>
        <View style={buttonStyles}>
          <Text style={textStyles} disabled={disabled}>
            {formattedTitle}
          </Text>
        </View>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  button: Platform.select({
    ios: {},
    android: {
      elevation: 4,
      // Material design blue from https://material.google.com/style/color.html#color-color-palette
      backgroundColor: '#2196F3',
      borderRadius: 2,
    },
    macos: {}, // TODO(macOS ISS#2323203)
  }),
  text: {
    textAlign: 'center',
    margin: 8,
    ...Platform.select({
      ios: {
        // iOS blue from https://developer.apple.com/ios/human-interface-guidelines/visual-design/color/
        color: '#007AFF',
        fontSize: 18,
      },
      android: {
        color: 'white',
        fontWeight: '500',
      },
      macos: {
        // [TODO(macOS ISS#2323203)
        color: '#007AFF',
        fontSize: 18,
      }, // ]TODO(macOS ISS#2323203)
    }),
  },
  buttonDisabled: Platform.select({
    ios: {},
    android: {
      elevation: 0,
      backgroundColor: '#dfdfdf',
    },
    macos: {}, // TODO(macOS ISS#2323203)
  }),
  textDisabled: Platform.select({
    ios: {
      color: '#cdcdcd',
    },
    macos: {
      // [TODO(macOS ISS#2323203)
      color: '#cdcdcd',
    }, // ]TODO(macOS ISS#2323203)
    android: {
      color: '#a1a1a1',
    },
  }),
});

module.exports = Button;

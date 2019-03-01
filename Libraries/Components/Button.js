/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ColorPropType = require('ColorPropType');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight'); // [TODO(windows ISS)
const TouchableNativeFeedback = require('TouchableNativeFeedback');
const TouchableOpacity = require('TouchableOpacity');
const View = require('View');

const invariant = require('fbjs/lib/invariant');

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

class Button extends React.Component<{
  title: string,
  onPress: () => any,
  color?: ?string,
  hasTVPreferredFocus?: ?boolean,
  accessibilityLabel?: ?string,
  accessibilityHint?: string, // TODO(OSS Candidate ISS#2710739)
  disabled?: ?boolean,
  testID?: ?string,
}> {
  static propTypes = {
    /**
     * Text to display inside the button
     */
    title: PropTypes.string.isRequired,
    /**
     * Text to display for blindness accessibility features
     */
    accessibilityLabel: PropTypes.string,
    /**
    * Hint text to display blindness accessibility features
    */
    accessibilityHint: PropTypes.string, // TODO(OSS Candidate ISS#2710739)
    /**
     * Color of the text (iOS, macOS), or background color of the button (Android)
     */
    color: ColorPropType,
    /**
     * If true, disable all interactions for this component.
     */
    disabled: PropTypes.bool,
    /**
     * TV preferred focus (see documentation for the View component).
     */
    hasTVPreferredFocus: PropTypes.bool,
    /**
     * Handler to be called when the user taps the button
     */
    onPress: PropTypes.func.isRequired,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  };

  render() {
    const {
      accessibilityLabel,
      accessibilityHint, // TODO(OSS Candidate ISS#2710739)
      color,
      onPress,
      title,
      hasTVPreferredFocus,
      disabled,
      testID,
    } = this.props;
    const buttonStyles = [styles.button];
    const textStyles = [styles.text];
    if (color) {
      if (Platform.OS === 'ios' || Platform.OS === 'macos') { // TODO(macOS ISS#2323203)
        textStyles.push({color: color});
      } else {
        buttonStyles.push({backgroundColor: color});
      }
    }
    const accessibilityStates = [];
    if (disabled) {
      buttonStyles.push(styles.buttonDisabled);
      textStyles.push(styles.textDisabled);
      accessibilityStates.push('disabled');
    }
    invariant(
      typeof title === 'string',
      'The title prop of a Button must be a string',
    );
    const formattedTitle =
      Platform.OS === 'android' ? title.toUpperCase() : title;
    const Touchable =
       (Platform.OS === 'android') // [TODO(windows ISS)
         ? TouchableNativeFeedback
         : (Platform.OS === 'uwp' || Platform.OS === 'windesktop')
           ? TouchableHighlight
           : TouchableOpacity; // ]TODO(windows ISS)
    return (
      <Touchable
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint} // TODO(OSS Candidate ISS#2710739)
        accessibilityRole="button"
        accessibilityStates={accessibilityStates}
        hasTVPreferredFocus={hasTVPreferredFocus}
        testID={testID}
        disabled={disabled}
        onPress={onPress}>
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
    uwp: {  // [TODO(windows ISS)
      backgroundColor: '#2196F3',
      borderRadius: 2,
    },
    windesktop: {},  // ]TODO(windows ISS)
  }),
  text: Platform.select({
    ios: {
      // iOS blue from https://developer.apple.com/ios/human-interface-guidelines/visual-design/color/
      color: '#007AFF',
      textAlign: 'center',
      padding: 8,
      fontSize: 18,
    },
    android: {
      color: 'white',
      textAlign: 'center',
      padding: 8,
      fontWeight: '500',
    },
    macos: { // [TODO(macOS ISS#2323203)
      color: '#007AFF',
      textAlign: 'center',
      padding: 8,
      fontSize: 18,
    }, // ]TODO(macOS ISS#2323203)
    uwp: { // [TODO(windows ISS)
      textAlign: 'center',
      color: 'white',
      padding: 8,
      fontWeight: '500',
    },
    windesktop: {}, // ]TODO(windows ISS)
  }),
  buttonDisabled: Platform.select({
    ios: {},
    android: {
      elevation: 0,
      backgroundColor: '#dfdfdf',
    },
    macos: {}, // TODO(macOS ISS#2323203)
    uwp: { // [TODO(windows ISS)
      backgroundColor: '#dfdfdf',
    },
    windesktop: {}, // ]TODO(windows ISS)
  }),
  textDisabled: Platform.select({
    ios: {
      color: '#cdcdcd',
    },
    macos: { // [TODO(macOS ISS#2323203)
      color: '#cdcdcd',
    }, // ]TODO(macOS ISS#2323203)
    android: {
      color: '#a1a1a1',
    },
    uwp: { // [TODO(windows ISS)
      color: '#a1a1a1',
    },
    windesktop: {
      color: '#a1a1a1',
    }, // ]TODO(windows ISS)
  }),
});

module.exports = Button;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Button
 * @flow
 */
'use strict';

const ColorPropType = require('ColorPropType');
const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
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
 * > You can change the style of the button using the props `styles`.
 *
 * If this button doesn't look right for your app, you can build your own
 * button using [TouchableOpacity](https://facebook.github.io/react-native/docs/touchableopacity.html)
 * or [TouchableNativeFeedback](https://facebook.github.io/react-native/docs/touchablenativefeedback.html).
 * For inspiration, look at the [source code for this button component](https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js).
 * Or, take a look at the [wide variety of button components built by the community](https://js.coach/react-native?search=button).
 *
 * Example usage:
 *
 * ```
 * <Button
 *   onPress={onPressLearnMore}
 *   title="Learn More"
 *   color="#841584"
 *   accessibilityLabel="Learn more about this purple button"
 * />
 * ```
 *
 * Example of usage with a custom style.
 *
 * ```
 * <Button
 *   onPress={onPressLearnMore}
 *   title="Learn More"
 *   color="#841584"
 *   accessibilityLabel="Learn more about this purple button"
 *   styles={{
 *     text: Platform.select({
 *       ios: {
 *         textDecorationLine: 'underline',
 *       },
 *       android: {
 *        textDecorationLine: 'underline',
 *       },
 *     })
 *   }}
 * />
 * ```
 *
 */

class Button extends React.Component {

  props: {
    title: string,
    onPress: () => any,
    color?: ?string,
    accessibilityLabel?: ?string,
    disabled?: ?boolean,
    styles: shape,
  };

  static propTypes = {
    /**
     * Text to display inside the button
     */
    title: React.PropTypes.string.isRequired,
    /**
     * Text to display for blindness accessibility features
     */
    accessibilityLabel: React.PropTypes.string,
    /**
     * Color of the text (iOS), or background color of the button (Android)
     */
    color: ColorPropType,
    /**
     * If true, disable all interactions for this component.
     */
    disabled: React.PropTypes.bool,
    /**
     * Handler to be called when the user taps the button
     */
    onPress: React.PropTypes.func.isRequired,
    /**
     * The object with the styles to apply to the button. The styles should follow the
     * [current button styles format](https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js#L141).
     */
    styles: React.PropTypes.shape({
      button: React.PropTypes.object,
      text: React.PropTypes.object,
      buttonDisabled: React.PropTypes.object,
      textDisabled: React.PropTypes.object,
    }),
  };

  render() {
    const {
      accessibilityLabel,
      color,
      onPress,
      title,
      disabled,
    } = this.props;
    const buttonStyles = [styles.button, {...this.props.styles.button}];
    const textStyles = [styles.text, {...this.props.styles.text}];
    const Touchable = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;
    if (color && Platform.OS === 'ios') {
      textStyles.push({color: color});
    } else if (color) {
      buttonStyles.push({backgroundColor: color});
    }
    if (disabled) {
      buttonStyles.push([styles.buttonDisabled, {...this.props.styles.buttonDisabled}]);
      textStyles.push([styles.textDisabled, {...this.props.styles.textDisabled}]);
    }
    invariant(
      typeof title === 'string',
      'The title prop of a Button must be a string',
    );
    const formattedTitle = Platform.OS === 'android' ? title.toUpperCase() : title;
    return (
      <Touchable
        accessibilityComponentType="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityTraits={['button']}
        disabled={disabled}
        onPress={onPress}>
        <View style={buttonStyles}>
          <Text style={textStyles}>{formattedTitle}</Text>
        </View>
      </Touchable>
    );
  }
}

// Material design blue from https://material.google.com/style/color.html#color-color-palette
let defaultBlue = '#2196F3';
if (Platform.OS === 'ios') {
  // Measured default tintColor from iOS 10
  defaultBlue = '#0C42FD';
}

const styles = StyleSheet.create({
  button: Platform.select({
    ios: {},
    android: {
      elevation: 4,
      backgroundColor: defaultBlue,
      borderRadius: 2,
    },
  }),
  text: Platform.select({
    ios: {
      color: defaultBlue,
      textAlign: 'center',
      padding: 8,
      fontSize: 18,
    },
    android: {
      textAlign: 'center',
      color: 'white',
      padding: 8,
      fontWeight: '500',
    },
  }),
  buttonDisabled: Platform.select({
    ios: {},
    android: {
      elevation: 0,
      backgroundColor: '#dfdfdf',
    }
  }),
  textDisabled: Platform.select({
    ios: {
      color: '#cdcdcd',
    },
    android: {
      color: '#a1a1a1',
    }
  }),
});

module.exports = Button;

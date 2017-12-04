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

const Animated = require('Animated');
const ColorPropType = require('ColorPropType');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableNativeFeedback = require('TouchableNativeFeedback');
const TouchableOpacity = require('TouchableOpacity');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
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
  accessibilityLabel?: ?string,
  bold?: ?boolean,
  bordered?: ?boolean,
  color?: ?string,
  disabled?: ?boolean,
  hasTVPreferredFocus?: ?boolean,
  noShadow?: ?boolean,
  onPress: () => any,
  testID?: ?string,
  title: string,
  transparent?: ?boolean,
}, {
    activeAnim: typeof Animated.Value
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
     * Color of the text (iOS), or background color of the button (Android)
     */
    color: ColorPropType,
    /**
     * If true, disable all interactions for this component.
     */
    disabled: PropTypes.bool,
    /**
     * Handler to be called when the user taps the button
     */
    onPress: PropTypes.func.isRequired,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
    /**
     * *(Apple TV only)* TV preferred focus (see documentation for the View component).
     *
     * @platform ios
     */
    hasTVPreferredFocus: PropTypes.bool,
    /**
     * *(iOS only)* If true, title will be be bold (on Android the title is always bold regardless of this prop).
     *
     * @platform ios
     */
    bold: PropTypes.bool,
    /**
     * *(Android only)* If true color will affect the title, and background will be transparent. On iOS the background is always transparent regardless of this. If set transparent to true, you cannot set bordered to true.
     *
     * @platform android
     */
    transparent: PropTypes.bool,
    /**
     * *(Android only)* If true, no shadow is drawn.
     *
     * @platform android
     */
    noShadow: PropTypes.bool,
    /**
     * The border and title will be same as "color". On Android, the background is white, and on iOS the background remains transparent. iOS also has a different onPressIn and onPressOut animation where the text goes to white and the background goes to "color".
     */
    bordered: PropTypes.bool,
  };

  state = {
    activeAnim: new Animated.Value(0)
  }

  render() {
    const {
      accessibilityLabel,
      bold,
      bordered,
      color,
      disabled,
      hasTVPreferredFocus,
      noShadow,
      onPress,
      testID,
      title,
      transparent
    } = this.props;
    const { activeAnim } = this.state;

    const isIOS = Platform.OS === 'ios';
    const isAndroid = !isIOS;

    const buttonStyles = [styles.button];
    const textStyles = [styles.text];
    const accessibilityTraits = ['button'];

    if (disabled) {
      accessibilityTraits.push('disabled');
      buttonStyles.push(styles.buttonDisabled);
      textStyles.push(styles.textDisabled);
      if (bordered) {
        buttonStyles.push(styles.buttonBordered, styles.buttonBorderedDisabled);
      }
      if (isAndroid) {
        if (transparent) {
          buttonStyles.push(styles.buttonTransparentDisabledAndroid);
        }
      }
    } else {
      if (transparent && isAndroid) {
        buttonStyles.push(styles.buttonTransparentAndroid);
      }
      if (bordered && !(isAndroid && transparent)) {
        buttonStyles.push(styles.buttonBordered);
      }
      if (color) {
        if (bordered) {
          buttonStyles.push({ borderColor: color });
        }
        if (isIOS || (isAndroid && (transparent || bordered))) {
          textStyles.push({ color });
        } else if (!transparent) {
          buttonStyles.push({ backgroundColor: color }); // isAndroid on this line
        }
      } else {
        if (isAndroid && (transparent || bordered)) {
          textStyles.push(styles.textBorderedAndroid);
        }
      }
      if (noShadow && isAndroid && !bordered && !transparent) {
        buttonStyles.push(styles.buttonUnelevatedAndroid);
      }
    }

    if (bold && isIOS) {
      textStyles.push(styles.textBold);
    }
    invariant(
      typeof title === 'string',
      'The title prop of a Button must be a string',
    );
    const formattedTitle = isAndroid ? title.toUpperCase() : title;
    const Touchable = isAndroid ? TouchableNativeFeedback : TouchableOpacity;
    if (isIOS && bordered) {
      return (
        <View style={buttonStyles}>
          <Text style={textStyles} disabled={disabled}>{formattedTitle}</Text>
          <TouchableWithoutFeedback accessibilityComponentType="button" accessibilityLabel={accessibilityLabel} accessibilityTraits={accessibilityTraits} disabled={disabled} hasTVPreferredFocus={hasTVPreferredFocus} onPress={onPress} onPressIn={this.activateIOS} onPressOut={this.deactivateIOS} testID={testID}>
            <Animated.View style={[{ opacity: activeAnim }, styles.buttonBorderedActiveIOS, color && { backgroundColor: color }]}>
              <Text style={[styles.text, styles.textBorderedActiveIOS, bold && styles.textBold]}>{formattedTitle}</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      );
    } else {
      return (
        <Touchable accessibilityComponentType="button" accessibilityLabel={accessibilityLabel} accessibilityTraits={accessibilityTraits} disabled={disabled} hasTVPreferredFocus={hasTVPreferredFocus} onPress={onPress} testID={testID}>
          <View style={buttonStyles}>
            <Text style={textStyles} disabled={disabled}>{formattedTitle}</Text>
          </View>
        </Touchable>
      );
    }
  }

  activateIOS = () => {
    const { activeAnim } = this.state;
    activeAnim.stopAnimation();
    Animated.timing(activeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }
  deactivateIOS = () => {
    const { activeAnim } = this.state;
    activeAnim.stopAnimation();
    Animated.timing(activeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }
}

const styles = StyleSheet.create({
  button: Platform.select({
    ios: undefined,
    android: {
      elevation: 4,
      backgroundColor: '#2196F3', // Material design blue from https://material.google.com/style/color.html#color-color-palette
      borderRadius: 2
    }
  }),
  buttonTransparentAndroid: {
    backgroundColor: 'transparent',
    elevation: 0
  },
  buttonBordered: Platform.select({
    ios: {
      borderWidth: 1,
      borderColor: '#007AFF',
      borderRadius: 6,
      overflow: 'hidden' // otherwse backgroundColor onPress messes up borderRadius
    },
    android: {
      elevation: 0,
      borderColor: '#2196F3',
      borderWidth: 1,
      backgroundColor: '#FFFFFF'
    }
  }),
  buttonUnelevatedAndroid: {
    elevation: 0
  },
  text: Platform.select({
    ios: {
      color: '#007AFF', // iOS blue from https://developer.apple.com/ios/human-interface-guidelines/visual-design/color/
      textAlign: 'center',
      padding: 8,
      paddingVertical: 12,
      fontSize: 18
    },
    android: {
      color: '#FFFFFF',
      textAlign: 'center',
      padding: 8,
      fontWeight: '500'
    }
  }),
  textBold: Platform.select({
    ios: {
      fontWeight: '500'
    },
    android: undefined
  }),
  textBorderedAndroid: {
    color: '#2196F3'
  },
  buttonDisabled: Platform.select({
    ios: undefined,
    android: {
      elevation: 0,
      backgroundColor: '#DFDFDF'
    }
  }),
  buttonBorderedDisabled: Platform.select({
    ios: {
      borderColor: '#CDCDCD'
    },
    android: {
      borderColor: '#DFDFDF',
      backgroundColor: '#FFFFFF'
    }
  }),
  buttonTransparentDisabledAndroid: {
    backgroundColor: 'transparent'
  },
  textDisabled: Platform.select({
    ios: {
      color: '#CDCDCD'
    },
    android: {
      color: '#A1A1A1'
    }
  }),
  textBorderedActiveIOS: {
    color: '#FFFFFF'
  },
  buttonBorderedActiveIOS: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF'
  }
});

module.exports = Button;

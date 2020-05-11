/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');

const {Alert, Button, View, StyleSheet} = require('react-native');
import {RNTesterThemeContext} from '../../components/RNTesterTheme';

function onButtonPress(buttonName) {
  Alert.alert(`${buttonName} has been pressed!`);
}

exports.displayName = 'ButtonExample';
exports.framework = 'React';
exports.title = '<Button>';
exports.description = 'Simple React Native button component.';

exports.examples = [
  {
    title: 'Simple Button',
    description: ('The title and onPress handler are required. It is ' +
      'recommended to set accessibilityLabel to help make your app usable by ' +
      'everyone.': string),
    render: function(): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('Simple')}
                testID="simple_button"
                color={theme.LinkColor}
                title="Press Me"
                accessibilityLabel="See an informative alert"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Adjusted color',
    description: ('Adjusts the color in a way that looks standard on each ' +
      'platform. On iOS, the color prop controls the color of the text. On ' +
      'Android, the color adjusts the background color of the button.': string),
    render: function(): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('Purple')}
                testID="purple_button"
                color={theme.SystemPurpleColor}
                title="Press Purple"
                accessibilityLabel="Learn more about purple"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Fit to text layout',
    description: ('This layout strategy lets the title define the width of ' +
      'the button': string),
    render: function(): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <View style={styles.container}>
                <Button
                  onPress={() => onButtonPress('Left')}
                  testID="left_button"
                  color={theme.LinkColor}
                  title="This looks great!"
                  accessibilityLabel="This sounds great!"
                />
                <Button
                  onPress={() => onButtonPress('Right')}
                  testID="right_button"
                  color={theme.SystemPurpleColor}
                  title="Ok!"
                  accessibilityLabel="Ok, Great!"
                />
              </View>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Disabled Button',
    description: 'All interactions for the component are disabled.',
    render: function(): React.Node {
      return (
        <Button
          disabled
          onPress={() => onButtonPress('Disabled')}
          testID="disabled_button"
          title="I Am Disabled"
          accessibilityLabel="See an informative alert"
        />
      );
    },
  },
];

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

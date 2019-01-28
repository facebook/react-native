/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
  TouchableWithoutFeedback,
} = ReactNative;

const RNTesterBlock = require('./RNTesterBlock');
const RNTesterPage = require('./RNTesterPage');

const importantForAccessibilityValues = [
  'auto',
  'yes',
  'no',
  'no-hide-descendants',
];

class AccessibilityAndroidExample extends React.Component {
  state = {
    count: 0,
    backgroundImportantForAcc: 0,
    forgroundImportantForAcc: 0,
    screenReaderEnabled: false,
  };

  componentDidMount() {
    AccessibilityInfo.addEventListener(
      'change',
      this._handleScreenReaderToggled,
    );
    AccessibilityInfo.fetch().done(isEnabled => {
      this.setState({
        screenReaderEnabled: isEnabled,
      });
    });
  }

  componentWillUnmount() {
    AccessibilityInfo.removeEventListener(
      'change',
      this._handleScreenReaderToggled,
    );
  }

  _handleScreenReaderToggled = isEnabled => {
    this.setState({
      screenReaderEnabled: isEnabled,
    });
  };

  _addOne = () => {
    this.setState({
      count: ++this.state.count,
    });
  };

  _changeBackgroundImportantForAcc = () => {
    this.setState({
      backgroundImportantForAcc: (this.state.backgroundImportantForAcc + 1) % 4,
    });
  };

  _changeForgroundImportantForAcc = () => {
    this.setState({
      forgroundImportantForAcc: (this.state.forgroundImportantForAcc + 1) % 4,
    });
  };

  render() {
    return (
      <RNTesterPage title={'Accessibility'}>
        <RNTesterBlock title="Nonaccessible view with TextViews">
          <View>
            <Text style={{color: 'green'}}>This is</Text>
            <Text style={{color: 'blue'}}>nontouchable normal view.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view with TextViews wihout label">
          <View accessible={true}>
            <Text style={{color: 'green'}}>This is</Text>
            <Text style={{color: 'blue'}}>
              nontouchable accessible view without label.
            </Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view with TextViews with label">
          <View
            accessible={true}
            accessibilityLabel="I have label, so I read it instead of embedded text.">
            <Text style={{color: 'green'}}>This is</Text>
            <Text style={{color: 'blue'}}>
              nontouchable accessible view with label.
            </Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Touchable with accessibilityRole = button">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('Toasts work by default', ToastAndroid.SHORT)
            }
            accessibilityRole="button">
            <View style={styles.embedded}>
              <Text>Click me</Text>
              <Text>Or not</Text>
            </View>
          </TouchableWithoutFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="Disabled Touchable with accessibilityRole = button">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('Toasts work by default', ToastAndroid.SHORT)
            }
            accessibilityRole="button"
            accessibilityStates={['disabled']}
            disabled={true}>
            <View>
              <Text>I am disabled</Text>
              <Text>Clicking me will not trigger any action.</Text>
            </View>
          </TouchableWithoutFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="Touchable with accessibilityRole = button and accessibilityHint">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('Toasts work by default', ToastAndroid.SHORT)
            }
            accessibilityRole="button"
            accessibilityHint="Triggers
            Toasts">
            <View>
              <Text>Click Me!</Text>
            </View>
          </TouchableWithoutFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible View with hint, role, and state">
          <View
            accessible={true}
            accessibilityRole="button"
            accessibilityStates={['selected']}
            accessibilityHint="accessibility hint">
            <Text>Accessible view with hint, role, and state</Text>
            <Text style={{color: 'gray'}}>
              Talkback will say: accessibility hint button, selected{' '}
            </Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible View with label, hint, role, and state">
          <View
            accessible={true}
            accessibilityLabel="accessibility Label"
            accessibilityRole="button"
            accessibilityStates={['selected']}
            accessibilityHint="accessibility Hint">
            <Text>Accessible view with label, hint, role, and state</Text>
            <Text style={{color: 'gray'}}>
              Talkback will say: accessibility label, hint button, selected{' '}
            </Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible View with no other properties set">
          <View accessible={true}>
            <Text>This accessible view has no label, so the text is read.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="LiveRegion">
          <TouchableWithoutFeedback onPress={this._addOne}>
            <View style={styles.embedded}>
              <Text>Click me</Text>
            </View>
          </TouchableWithoutFeedback>
          <Text accessibilityLiveRegion="polite">
            Clicked {this.state.count} times
          </Text>
        </RNTesterBlock>

        <RNTesterBlock title="Check if the screen reader is enabled">
          <Text>
            The screen reader is{' '}
            {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.
          </Text>
        </RNTesterBlock>

        <RNTesterBlock title="Overlapping views and importantForAccessibility property">
          <View style={styles.container}>
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                right: 10,
                height: 100,
                backgroundColor: 'green',
              }}
              accessible={true}
              accessibilityLabel="First layout"
              importantForAccessibility={
                importantForAccessibilityValues[
                  this.state.backgroundImportantForAcc
                ]
              }>
              <View accessible={true}>
                <Text style={{fontSize: 25}}>Hello</Text>
              </View>
            </View>
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 25,
                right: 10,
                height: 110,
                backgroundColor: 'yellow',
                opacity: 0.5,
              }}
              accessible={true}
              accessibilityLabel="Second layout"
              importantForAccessibility={
                importantForAccessibilityValues[
                  this.state.forgroundImportantForAcc
                ]
              }>
              <View accessible={true}>
                <Text style={{fontSize: 20}}>world</Text>
              </View>
            </View>
          </View>
          <TouchableWithoutFeedback
            onPress={this._changeBackgroundImportantForAcc}>
            <View style={styles.embedded}>
              <Text>
                Change importantForAccessibility for background layout.
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <View accessible={true}>
            <Text>Background layout importantForAccessibility</Text>
            <Text>
              {
                importantForAccessibilityValues[
                  this.state.backgroundImportantForAcc
                ]
              }
            </Text>
          </View>
          <TouchableWithoutFeedback
            onPress={this._changeForgroundImportantForAcc}>
            <View style={styles.embedded}>
              <Text>
                Change importantForAccessibility for forground layout.
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <View accessible={true}>
            <Text>Forground layout importantForAccessibility</Text>
            <Text>
              {
                importantForAccessibilityValues[
                  this.state.forgroundImportantForAcc
                ]
              }
            </Text>
          </View>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  embedded: {
    backgroundColor: 'yellow',
    padding: 10,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    height: 150,
  },
});

exports.title = 'Accessibility';
exports.description = 'Examples of using Accessibility API.';
exports.examples = [
  {
    title: 'Accessibility elements',
    render(): React.Element<typeof AccessibilityAndroidExample> {
      return <AccessibilityAndroidExample />;
    },
  },
];

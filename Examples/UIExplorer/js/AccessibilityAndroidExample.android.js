/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @providesModule AccessibilityAndroidExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
  TouchableWithoutFeedback,
} = ReactNative;

var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var importantForAccessibilityValues = ['auto', 'yes', 'no', 'no-hide-descendants'];

class AccessibilityAndroidExample extends React.Component {
  static title = 'Accessibility';
  static description = 'Examples of using Accessibility API.';

  state = {
    count: 0,
    backgroundImportantForAcc: 0,
    forgroundImportantForAcc: 0,
    screenReaderEnabled: false,
  };

  componentDidMount() {
    AccessibilityInfo.addEventListener(
      'change',
      this._handleScreenReaderToggled
    );
    AccessibilityInfo.fetch().done((isEnabled) => {
      this.setState({
        screenReaderEnabled: isEnabled
      });
    });
  }

  componentWillUnmount() {
    AccessibilityInfo.removeEventListener(
      'change',
      this._handleScreenReaderToggled
    );
  }

  _handleScreenReaderToggled = (isEnabled) => {
    this.setState({
      screenReaderEnabled: isEnabled,
    });
  }

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
      <UIExplorerPage title={'Accessibility'}>

        <UIExplorerBlock title="Nonaccessible view with TextViews">
          <View>
            <Text style={{color: 'green',}}>
              This is
            </Text>
            <Text style={{color: 'blue'}}>
              nontouchable normal view.
            </Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Accessible view with TextViews wihout label">
          <View accessible={true}>
            <Text style={{color: 'green',}}>
              This is
            </Text>
            <Text style={{color: 'blue'}}>
              nontouchable accessible view without label.
            </Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Accessible view with TextViews with label">
          <View accessible={true}
            accessibilityLabel="I have label, so I read it instead of embedded text.">
            <Text style={{color: 'green',}}>
              This is
            </Text>
            <Text style={{color: 'blue'}}>
              nontouchable accessible view with label.
            </Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Touchable with component type = button">
          <TouchableWithoutFeedback
            onPress={() => ToastAndroid.show('Toasts work by default', ToastAndroid.SHORT)}
            accessibilityComponentType="button">
            <View style={styles.embedded}>
              <Text>Click me</Text>
              <Text>Or not</Text>
            </View>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>

        <UIExplorerBlock title="LiveRegion">
          <TouchableWithoutFeedback onPress={this._addOne}>
            <View style={styles.embedded}>
              <Text>Click me</Text>
            </View>
          </TouchableWithoutFeedback>
          <Text accessibilityLiveRegion="polite">
            Clicked {this.state.count} times
          </Text>
        </UIExplorerBlock>

        <UIExplorerBlock title="Check if the screen reader is enabled">
          <Text>
            The screen reader is {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.
          </Text>
        </UIExplorerBlock>

        <UIExplorerBlock title="Overlapping views and importantForAccessibility property">
          <View style={styles.container}>
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                right: 10,
                height: 100,
                backgroundColor: 'green'}}
              accessible={true}
              accessibilityLabel="First layout"
              importantForAccessibility={
                importantForAccessibilityValues[this.state.backgroundImportantForAcc]}>
              <View accessible={true}>
                <Text style={{fontSize: 25}}>
                  Hello
                </Text>
              </View>
            </View>
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 25,
                right: 10,
                height: 110,
                backgroundColor: 'yellow', opacity: 0.5}}
              accessible={true}
              accessibilityLabel="Second layout"
              importantForAccessibility={
                importantForAccessibilityValues[this.state.forgroundImportantForAcc]}>
              <View accessible={true}>
                <Text style={{fontSize: 20}}>
                  world
                </Text>
              </View>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={this._changeBackgroundImportantForAcc}>
            <View style={styles.embedded}>
              <Text>
                Change importantForAccessibility for background layout.
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <View accessible={true}>
            <Text>
              Background layout importantForAccessibility
            </Text>
            <Text>
              {importantForAccessibilityValues[this.state.backgroundImportantForAcc]}
            </Text>
          </View>
          <TouchableWithoutFeedback onPress={this._changeForgroundImportantForAcc}>
            <View style={styles.embedded}>
              <Text>
                Change importantForAccessibility for forground layout.
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <View accessible={true}>
            <Text>
              Forground layout importantForAccessibility
            </Text>
            <Text>
              {importantForAccessibilityValues[this.state.forgroundImportantForAcc]}
            </Text>
          </View>
        </UIExplorerBlock>

      </UIExplorerPage>
    );
  }
}

var styles = StyleSheet.create({
   embedded: {
    backgroundColor: 'yellow',
    padding:10,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    height:150,
  },
});

module.exports = AccessibilityAndroidExample;

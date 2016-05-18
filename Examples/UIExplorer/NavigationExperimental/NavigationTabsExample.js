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
*/
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  View,
} = ReactNative;
const {
  Reducer: NavigationReducer,
} = NavigationExperimental;

const NavigationExampleRow = require('./NavigationExampleRow');
const NavigationExampleTabBar = require('./NavigationExampleTabBar');

class ExmpleTabPage extends React.Component {
  render() {
    const currentTabRoute = this.props.tabs[this.props.index];
    return (
      <ScrollView style={styles.tabPage}>
        <NavigationExampleRow
          text={`Current Tab is: ${currentTabRoute.key}`}
        />
        {this.props.tabs.map((tab, index) => (
          <NavigationExampleRow
            key={tab.key}
            text={`Go to ${tab.key}`}
            onPress={() => {
              this.props.onNavigate(NavigationReducer.TabsReducer.JumpToAction(index));
            }}
          />
        ))}
        <NavigationExampleRow
          text="Exit Tabs Example"
          onPress={this.props.onExampleExit}
        />
      </ScrollView>
    );
  }
}

const ExampleTabsReducer = NavigationReducer.TabsReducer({
  tabReducers: [
    (lastRoute) => lastRoute || {key: 'one'},
    (lastRoute) => lastRoute || {key: 'two'},
    (lastRoute) => lastRoute || {key: 'three'},
  ],
});

class NavigationTabsExample extends React.Component {
  constructor() {
    super();
    this.state = ExampleTabsReducer(undefined, {});
  }
  render() {
    return (
      <View style={styles.topView}>
        <ExmpleTabPage
          tabs={this.state.children}
          index={this.state.index}
          onExampleExit={this.props.onExampleExit}
          onNavigate={this.handleAction.bind(this)}
        />
        <NavigationExampleTabBar
          tabs={this.state.children}
          index={this.state.index}
          onNavigate={this.handleAction.bind(this)}
        />
      </View>
    );
  }
  handleAction(action) {
    if (!action) {
      return false;
    }
    const newState = ExampleTabsReducer(this.state, action);
    if (newState === this.state) {
      return false;
    }
    this.setState(newState);
    return true;
  }
  handleBackAction() {
    return this.handleAction({ type: 'BackAction' });
  }
}

const styles = StyleSheet.create({
  topView: {
    flex: 1,
    paddingTop: 30,
  },
  tabPage: {
    backgroundColor: '#E9E9EF',
  },
});

module.exports = NavigationTabsExample;

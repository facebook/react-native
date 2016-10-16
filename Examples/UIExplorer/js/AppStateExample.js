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
 * @providesModule AppStateExample
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  AppState,
  Text,
  View
} = ReactNative;

class AppStateSubscription extends React.Component {
  state = {
    appState: AppState.currentState,
    previousAppStates: [],
    memoryWarnings: 0,
  };

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    AppState.addEventListener('memoryWarning', this._handleMemoryWarning);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    AppState.removeEventListener('memoryWarning', this._handleMemoryWarning);
  }

  _handleMemoryWarning = () => {
    this.setState({memoryWarnings: this.state.memoryWarnings + 1});
  };

  _handleAppStateChange = (appState) => {
    var previousAppStates = this.state.previousAppStates.slice();
    previousAppStates.push(this.state.appState);
    this.setState({
      appState,
      previousAppStates,
    });
  };

  render() {
    if (this.props.showMemoryWarnings) {
      return (
        <View>
          <Text>{this.state.memoryWarnings}</Text>
        </View>
      );
    }
    if (this.props.showCurrentOnly) {
      return (
        <View>
          <Text>{this.state.appState}</Text>
        </View>
      );
    }
    return (
      <View>
        <Text>{JSON.stringify(this.state.previousAppStates)}</Text>
      </View>
    );
  }
}

exports.title = 'AppState';
exports.description = 'app background status';
exports.examples = [
  {
    title: 'AppState.currentState',
    description: 'Can be null on app initialization',
    render() { return <Text>{AppState.currentState}</Text>; }
  },
  {
    title: 'Subscribed AppState:',
    description: 'This changes according to the current state, so you can only ever see it rendered as "active"',
    render(): React.Element<any> { return <AppStateSubscription showCurrentOnly={true} />; }
  },
  {
    title: 'Previous states:',
    render(): React.Element<any> { return <AppStateSubscription showCurrentOnly={false} />; }
  },
  {
    platform: 'ios',
    title: 'Memory Warnings',
    description: 'In the IOS simulator, hit Shift+Command+M to simulate a memory warning.',
    render(): React.Element<any> { return <AppStateSubscription showMemoryWarnings={true} />; }
  },
];

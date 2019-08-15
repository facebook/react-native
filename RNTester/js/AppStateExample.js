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

const React = require('react');
const {AppState, Text, View} = require('react-native');

class AppStateSubscription extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
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

  _handleAppStateChange = appState => {
    const previousAppStates = this.state.previousAppStates.slice();
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
    render() {
      return <Text>{AppState.currentState}</Text>;
    },
  },
  {
    title: 'Subscribed AppState:',
    description:
      'This changes according to the current state, so you can only ever see it rendered as "active"',
    render(): React.Element<any> {
      return <AppStateSubscription showCurrentOnly={true} />;
    },
  },
  {
    title: 'Previous states:',
    render(): React.Element<any> {
      return <AppStateSubscription showCurrentOnly={false} />;
    },
  },
  {
    platform: 'ios',
    title: 'Memory Warnings',
    description:
      'In the IOS simulator, hit Shift+Command+M to simulate a memory warning.',
    render(): React.Element<any> {
      return <AppStateSubscription showMemoryWarnings={true} />;
    },
  },
];

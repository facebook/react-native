/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {AppStateValues} from 'react-native/Libraries/AppState/AppState';
import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

import RNTesterText from '../../components/RNTesterText';
import React from 'react';
import {AppState, Platform, View} from 'react-native';

class AppStateSubscription extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  state: {
    appState: ?string,
    eventsDetected: Array<string>,
    memoryWarnings: number,
    previousAppStates: Array<?(any | string)>,
  } = {
    appState: AppState.currentState,
    previousAppStates: [],
    memoryWarnings: 0,
    eventsDetected: [],
  };

  _subscriptions: ?Array<EventSubscription>;

  componentDidMount() {
    this._subscriptions = [
      AppState.addEventListener('change', this._handleAppStateChange),
      AppState.addEventListener('memoryWarning', this._handleMemoryWarning),
    ];
    if (Platform.OS === 'android') {
      this._subscriptions.push(
        AppState.addEventListener('focus', this._handleFocus),
        AppState.addEventListener('blur', this._handleBlur),
      );
    }
  }

  componentWillUnmount() {
    if (this._subscriptions != null) {
      for (const subscription of this._subscriptions) {
        subscription.remove();
      }
    }
  }

  _handleMemoryWarning = () => {
    this.setState({memoryWarnings: this.state.memoryWarnings + 1});
  };

  _handleBlur = () => {
    const eventsDetected = this.state.eventsDetected.slice();
    eventsDetected.push('blur');
    this.setState({eventsDetected});
  };

  _handleFocus = () => {
    const eventsDetected = this.state.eventsDetected.slice();
    eventsDetected.push('focus');
    this.setState({eventsDetected});
  };

  _handleAppStateChange = (appState: AppStateValues) => {
    const previousAppStates = this.state.previousAppStates.slice();
    previousAppStates.push(this.state.appState);
    this.setState({
      appState,
      previousAppStates,
    });
  };

  render(): React.Node {
    if (this.props.showMemoryWarnings) {
      return (
        <View>
          <RNTesterText>{this.state.memoryWarnings}</RNTesterText>
        </View>
      );
    }
    if (this.props.showCurrentOnly) {
      return (
        <View>
          <RNTesterText>{this.state.appState}</RNTesterText>
        </View>
      );
    }
    if (this.props.detectEvents) {
      return (
        <View>
          <RNTesterText>
            {JSON.stringify(this.state.eventsDetected)}
          </RNTesterText>
        </View>
      );
    }
    return (
      <View>
        <RNTesterText>
          {JSON.stringify(this.state.previousAppStates)}
        </RNTesterText>
      </View>
    );
  }
}

exports.title = 'AppState';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/appstate';
exports.description = 'app background status';
exports.examples = [
  {
    title: 'AppState.currentState',
    description: 'Can be null on app initialization',
    render(): React.Node {
      return <RNTesterText>{AppState.currentState}</RNTesterText>;
    },
  },
  {
    title: 'Subscribed AppState:',
    description:
      'This changes according to the current state, so you can only ever see it rendered as "active"',
    render(): React.MixedElement {
      return <AppStateSubscription showCurrentOnly={true} />;
    },
  },
  {
    title: 'Previous states:',
    render(): React.MixedElement {
      return <AppStateSubscription showCurrentOnly={false} />;
    },
  },
  {
    platform: 'ios',
    title: 'Memory Warnings',
    description:
      'In the IOS simulator, hit Shift+Command+M to simulate a memory warning.',
    render(): React.MixedElement {
      return <AppStateSubscription showMemoryWarnings={true} />;
    },
  },
  {
    platform: 'android',
    title: 'Focus/Blur Events',
    description:
      'In the Android simulator, toggle the notification drawer to fire events.',
    render(): React.MixedElement {
      return <AppStateSubscription detectEvents={true} />;
    },
  },
] as Array<RNTesterModuleExample>;

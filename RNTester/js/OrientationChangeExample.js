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
const ReactNative = require('react-native');
const {DeviceEventEmitter, Text, View} = ReactNative;

import type EmitterSubscription from '../../Libraries/vendor/emitter/EmitterSubscription';

class OrientationChangeExample extends React.Component<{}, $FlowFixMeState> {
  _orientationSubscription: EmitterSubscription;

  state = {
    currentOrientation: '',
    orientationDegrees: 0,
    isLandscape: false,
  };

  componentDidMount() {
    this._orientationSubscription = DeviceEventEmitter.addListener(
      'namedOrientationDidChange',
      this._onOrientationChange,
    );
  }

  componentWillUnmount() {
    this._orientationSubscription.remove();
  }

  _onOrientationChange = (orientation: Object) => {
    this.setState({
      currentOrientation: orientation.name,
      orientationDegrees: orientation.rotationDegrees,
      isLandscape: orientation.isLandscape,
    });
  };

  render() {
    return (
      <View>
        <Text>{JSON.stringify(this.state)}</Text>
      </View>
    );
  }
}

exports.title = 'OrientationChangeExample';
exports.description = 'listening to orientation changes';
exports.examples = [
  {
    title: 'OrientationChangeExample',
    description: 'listening to device orientation changes',
    render() {
      return <OrientationChangeExample />;
    },
  },
];

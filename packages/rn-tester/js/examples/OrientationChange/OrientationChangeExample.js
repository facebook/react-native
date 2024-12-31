/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import RNTesterText from '../../components/RNTesterText';
import React from 'react';
import {DeviceEventEmitter, View} from 'react-native';
import {type EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

class OrientationChangeExample extends React.Component<{...}, $FlowFixMeState> {
  _orientationSubscription: EventSubscription;

  state:
    | any
    | {
        currentOrientation: string,
        isLandscape: boolean,
        orientationDegrees: number,
      } = {
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

  render(): React.Node {
    return (
      <View>
        <RNTesterText>{JSON.stringify(this.state)}</RNTesterText>
      </View>
    );
  }
}

exports.title = 'OrientationChangeExample';
exports.category = 'Basic';
exports.description = 'listening to orientation changes';
exports.examples = [
  {
    title: 'OrientationChangeExample',
    description: 'listening to device orientation changes',
    render(): React.Node {
      return <OrientationChangeExample />;
    },
  },
];

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule AdSupportIOSExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AdSupportIOS,
  StyleSheet,
  Text,
  View,
} = ReactNative;

exports.framework = 'React';
exports.title = 'Advertising ID';
exports.description = 'Example of using the ad support API.';

exports.examples = [
  {
    title: 'Ad Support IOS',
    render: function(): React.Element<any> {
      return <AdSupportIOSExample />;
    },
  }
];

class AdSupportIOSExample extends React.Component {
  state = {
    deviceID: 'No IDFA yet',
    hasAdvertiserTracking: 'unset',
  };

  componentDidMount() {
    AdSupportIOS.getAdvertisingId(
      this._onDeviceIDSuccess,
      this._onDeviceIDFailure
    );

    AdSupportIOS.getAdvertisingTrackingEnabled(
      this._onHasTrackingSuccess,
      this._onHasTrackingFailure
    );
  }

  _onHasTrackingSuccess = (hasTracking) => {
    this.setState({
      'hasAdvertiserTracking': hasTracking,
    });
  };

  _onHasTrackingFailure = (e) => {
    this.setState({
      'hasAdvertiserTracking': 'Error!',
    });
  };

  _onDeviceIDSuccess = (deviceID) => {
    this.setState({
      'deviceID': deviceID,
    });
  };

  _onDeviceIDFailure = (e) => {
    this.setState({
      'deviceID': 'Error!',
    });
  };

  render() {
    return (
      <View>
        <Text>
          <Text style={styles.title}>Advertising ID: </Text>
          {JSON.stringify(this.state.deviceID)}
        </Text>
        <Text>
          <Text style={styles.title}>Has Advertiser Tracking: </Text>
          {JSON.stringify(this.state.hasAdvertiserTracking)}
        </Text>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  title: {
    fontWeight: '500',
  },
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as React from 'react';
import {useEffect, useState} from 'react';
import {NativeModules, StyleSheet, Text, View} from 'react-native';
import Battery from 'react-native/Libraries/Battery/Battery';

const {TestModule} = NativeModules;

type BatteryState = {
  level: number,
  isCharging: boolean,
  isLowPowerMode: boolean,
};

type State = {
  batteryState: ?BatteryState,
  eventsReceived: number,
  error: ?string,
};

function BatteryTest(): React.Node {
  const [state, setState] = useState<State>({
    batteryState: null,
    eventsReceived: 0,
    error: null,
  });

  useEffect(() => {
    // Get initial battery state
    Battery.getBatteryState()
      .then(batteryState => {
        if (batteryState) {
          setState(prevState => ({
            ...prevState,
            batteryState,
          }));
          TestModule.markTestCompleted();
        } else {
          setState(prevState => ({
            ...prevState,
            error: 'Battery state unavailable',
          }));
        }
      })
      .catch(error => {
        setState(prevState => ({
          ...prevState,
          error: error.message || 'Failed to get battery state',
        }));
      });

    // Listen for battery changes
    const subscription = Battery.addChangeListener((newState: BatteryState) => {
      setState(prevState => ({
        ...prevState,
        batteryState: newState,
        eventsReceived: prevState.eventsReceived + 1,
      }));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (state.error) {
    return (
      <View style={styles.container}>
        <Text testID="error">{state.error}</Text>
      </View>
    );
  }

  if (!state.batteryState) {
    return (
      <View style={styles.container}>
        <Text testID="loading">Loading battery state...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text testID="battery-level">
        Battery Level: {state.batteryState.level}%
      </Text>
      <Text testID="is-charging">
        Charging: {state.batteryState.isCharging ? 'Yes' : 'No'}
      </Text>
      <Text testID="low-power-mode">
        Low Power Mode: {state.batteryState.isLowPowerMode ? 'Yes' : 'No'}
      </Text>
      <Text testID="events-received">
        Events Received: {state.eventsReceived}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 40,
  },
});

module.exports = BatteryTest;


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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import React from 'react';
import {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Battery from 'react-native/Libraries/Battery/Battery';

type BatteryState = {
  level: number,
  isCharging: boolean,
  isLowPowerMode: boolean,
};

function BatteryDisplay() {
  const [batteryState, setBatteryState] = useState<?BatteryState>(null);
  const [eventsReceived, setEventsReceived] = useState<number>(0);

  useEffect(() => {
    // Get initial battery state
    Battery.getBatteryState().then(state => {
      setBatteryState(state);
    });

    // Listen for battery changes
    const subscription = Battery.addChangeListener((newState: BatteryState) => {
      setBatteryState(newState);
      setEventsReceived(prev => prev + 1);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!batteryState) {
    return <RNTesterText>Loading battery state...</RNTesterText>;
  }

  const getBatteryColor = (level: number): string => {
    if (level > 50) return '#4CAF50'; // Green
    if (level > 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <View style={styles.container}>
      <RNTesterText style={[styles.batteryLevel, {color: getBatteryColor(batteryState.level)}]}>
        {batteryState.level}%
      </RNTesterText>
      <RNTesterText>
        Charging: {batteryState.isCharging ? 'Yes' : 'No'}
      </RNTesterText>
      <RNTesterText>
        Low Power Mode: {batteryState.isLowPowerMode ? 'Yes' : 'No'}
      </RNTesterText>
      <RNTesterText style={styles.eventsText}>
        Events Received: {eventsReceived}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  batteryLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  eventsText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
  },
});

exports.title = 'Battery';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/battery';
exports.description = 'Monitor device battery state, charging status, and low-power mode';
exports.examples = [
  {
    title: 'Current Battery State',
    description: 'Displays current battery level, charging status, and low-power mode',
    render(): React.Node {
      return <BatteryDisplay />;
    },
  },
  {
    title: 'Battery Level Only',
    description: 'Shows just the battery percentage',
    render(): React.Node {
      const [level, setLevel] = useState<?number>(null);

      useEffect(() => {
        Battery.getBatteryState().then(state => {
          if (state) {
            setLevel(state.level);
          }
        });

        const subscription = Battery.addChangeListener((newState: BatteryState) => {
          setLevel(newState.level);
        });

        return () => subscription.remove();
      }, []);

      return (
        <RNTesterText testID="battery-level-only">
          {level !== null ? `${level}%` : 'Loading...'}
        </RNTesterText>
      );
    },
  },
  {
    title: 'Charging Status',
    description: 'Shows whether the device is currently charging',
    render(): React.Node {
      const [isCharging, setIsCharging] = useState<?boolean>(null);

      useEffect(() => {
        Battery.getBatteryState().then(state => {
          if (state) {
            setIsCharging(state.isCharging);
          }
        });

        const subscription = Battery.addChangeListener((newState: BatteryState) => {
          setIsCharging(newState.isCharging);
        });

        return () => subscription.remove();
      }, []);

      return (
        <RNTesterText testID="charging-status">
          {isCharging !== null
            ? isCharging
              ? 'Charging'
              : 'Not Charging'
            : 'Loading...'}
        </RNTesterText>
      );
    },
  },
  {
    title: 'Low Power Mode',
    description: 'Shows whether low-power mode (iOS) or battery saver (Android) is enabled',
    render(): React.Node {
      const [isLowPowerMode, setIsLowPowerMode] = useState<?boolean>(null);

      useEffect(() => {
        Battery.getBatteryState().then(state => {
          if (state) {
            setIsLowPowerMode(state.isLowPowerMode);
          }
        });

        const subscription = Battery.addChangeListener((newState: BatteryState) => {
          setIsLowPowerMode(newState.isLowPowerMode);
        });

        return () => subscription.remove();
      }, []);

      return (
        <RNTesterText testID="low-power-mode">
          {isLowPowerMode !== null
            ? isLowPowerMode
              ? 'Low Power Mode: Enabled'
              : 'Low Power Mode: Disabled'
            : 'Loading...'}
        </RNTesterText>
      );
    },
  },
] as Array<RNTesterModuleExample>;


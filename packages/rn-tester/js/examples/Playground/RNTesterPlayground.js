/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {BackHandler, Platform, StyleSheet, View} from 'react-native';

function Playground() {
  const [events, setEvents] = useState<$ReadOnlyArray<string>>([]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        const line = `${new Date().toISOString()} hardwareBackPress`;
        console.log('[PredictiveBack]', line);
        setEvents(current => [line, ...current].slice(0, 8));
        // Returning true cannot cancel a system-handled exit. If the observer
        // is working, the app still closes after this log.
        return true;
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <RNTesterText style={styles.title}>
        Predictive back observer
      </RNTesterText>
      <RNTesterText>
        RNTesterActivity disables React Native's consuming back callback so
        Android can play the system predictive-back animation. A
        PRIORITY_SYSTEM_NAVIGATION_OBSERVER still delivers hardwareBackPress
        to JS on commit.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        1. API 36 device/AVD, gesture navigation, animations on.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        2. Drag slowly inward from the left or right edge and hold. The
        activity should shrink and home should peek through.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        3. Release to commit: Metro should log [PredictiveBack] and the app
        should still close. Returning true cannot prevent that exit.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        4. Release early to cancel: no JS event, activity springs back.
      </RNTesterText>
      <RNTesterText style={styles.logTitle}>JS events</RNTesterText>
      {events.length === 0 ? (
        <RNTesterText variant="caption">
          None yet. Watch Metro if the app closes too quickly to read this.
        </RNTesterText>
      ) : (
        events.map(event => (
          <RNTesterText key={event} variant="caption">
            {event}
          </RNTesterText>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  step: {
    marginTop: 4,
  },
  logTitle: {
    fontWeight: '700',
    marginTop: 12,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;

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
        // Let RNTester's root handler pop this example. Return true only
        // if you want to consume and stay here.
        return false;
      },
    );
    const predictive = BackHandler.addPredictiveBackListener(event => {
      const line = `${new Date().toISOString()} ${event.phase} progress=${event.progress.toFixed(2)}`;
      console.log('[PredictiveBack]', line);
      setEvents(current => [line, ...current].slice(0, 8));
    });

    return () => {
      subscription.remove();
      predictive.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <RNTesterText style={styles.title}>Predictive back</RNTesterText>
      <RNTesterText>
        Nested screens keep the list mounted underneath. Swipe from the edge and
        hold: the example pane should shrink and the list should peek through.
        The root list leaves intercept off so Android can play back-to-home.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        1. API 36 device/AVD, gesture navigation, animations on.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        2. From this Playground screen, swipe from the edge and hold: the
        Components list should peek behind this pane. Swipe far (or flick) and
        release: this pane should keep shrinking and fade out, then pop. Release
        early to cancel: this pane should spring back to full screen. The app
        must not close.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        3. From the root list, swipe from the edge and hold: the activity should
        shrink and home should peek through. Release to exit; Metro logs
        [PredictiveBack]. Returning true cannot prevent that exit.
      </RNTesterText>
      <RNTesterText style={styles.step}>
        4. From the root list, release early to cancel: no JS event, activity
        springs back.
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

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  View,
  NativeModules,
  AppState,
  Text,
  EmitterSubscription,
  NativeEventEmitter
} from 'react-native';

const { ForcedAlert } = NativeModules;
const {EVENT_A, EVENT_B} = ForcedAlert.getConstants();

function Playground(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    var subscriptions: EmitterSubscription[] = []
    subscriptions.push(AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    }));

    const eventEmitter = new NativeEventEmitter(ForcedAlert);
    subscriptions.push(eventEmitter.addListener(EVENT_A, message => {
      console.log('Event A: ', message);
    }));
    subscriptions.push(eventEmitter.addListener(EVENT_B, async message => {
      await sleep(500);
      console.log('Event B: ', message);
    }));

    return () => {
      subscriptions.forEach((s) => s.remove());
    };
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? 'black' : 'white',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic">
        <Text>Current state is: {appStateVisible}</Text>
        <View style={backgroundStyle}>
         <Button 
          title='Press me'
          onPress={async () => {
            console.log('\n');
            await sleep(500);
            console.log('Timer works before Activity');
            ForcedAlert.alert("Native Alert", "Custom Android Activity")
            console.log('Custom activity started');
            await sleep(500);
            console.log('Timer works after async');
          }}
         />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function sleep(ms: number) {
  return new Promise( async resolve => { await fetch("https://google.com"); resolve()});
}

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../../types/RNTesterTypes';
import type {KeyboardEvent} from 'react-native/Libraries/Components/Keyboard/Keyboard';

import * as React from 'react';
import {useEffect, useState} from 'react';
import {Keyboard, StyleSheet, Text, View} from 'react-native';

type KeyboardEventViewerProps = {
  showEvent: 'keyboardWillShow' | 'keyboardDidShow',
  hideEvent: 'keyboardWillHide' | 'keyboardDidHide',
};

const KeyboardEventViewer = (props: KeyboardEventViewerProps): React.Node => {
  const {showEvent, hideEvent} = props;
  const [isShown, setIsShown] = useState(false);
  const [lastEvent, setLastEvent] = useState<?KeyboardEvent>();

  useEffect(() => {
    const subscription = Keyboard.addListener(showEvent, ev => {
      setIsShown(true);
      setLastEvent(ev);
    });
    return () => subscription.remove();
  }, [showEvent]);

  useEffect(() => {
    const subscription = Keyboard.addListener(hideEvent, ev => {
      setIsShown(false);
      setLastEvent(ev);
    });
    return () => subscription.remove();
  }, [hideEvent]);

  return (
    <View>
      <Text>
        <Text>Keyboard is </Text>
        {isShown ? (
          <Text style={styles.openText}>open</Text>
        ) : (
          <Text style={styles.closeText}>closed</Text>
        )}
      </Text>
      <View style={styles.eventBox}>
        <Text>
          {lastEvent
            ? JSON.stringify(lastEvent, null, 2)
            : 'No events observed'}
        </Text>
      </View>
    </View>
  );
};

const keyboardWillShowHideExample: RNTesterModuleExample = {
  title: 'keyboardWillShow / keyboardWillHide',
  platform: 'ios',
  render: () => (
    <KeyboardEventViewer
      showEvent="keyboardWillShow"
      hideEvent="keyboardWillHide"
    />
  ),
};

const keyboardDidShowHideExample: RNTesterModuleExample = {
  title: 'keyboardDidShow / keyboardDidHide',
  render: () => (
    <KeyboardEventViewer
      showEvent="keyboardDidShow"
      hideEvent="keyboardDidHide"
    />
  ),
};

const styles = StyleSheet.create({
  closeText: {
    color: 'red',
  },
  openText: {
    color: 'green',
  },
  eventBox: {
    marginTop: 10,
    padding: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const KeyboardExample: RNTesterModule = {
  title: 'Keyboard',
  description: 'Demonstrates usage of the "Keyboard" static API',
  documentationURL: 'https://reactnative.dev/docs/keyboard',
  category: 'Basic',
  examples: [keyboardWillShowHideExample, keyboardDidShowHideExample],
};

export default KeyboardExample;

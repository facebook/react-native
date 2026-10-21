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
import {StyleSheet, View} from 'react-native';

// Per the HTML spec, no 'message' event should fire once close() has been called.
// echo.websocket.org greets each connection and echoes what it receives. The 
// websocket here is immediately closed, so replies arrive while the socket is 
// no longer in the OPEN state.
// 
// On React-Native, the following code logs the greeting and echoed hello after close.
// On browsers, the equivalent code won't log any messages.

function Playground() {
  const [log, setLog] = useState<Array<string>>([]);

  useEffect(() => {
    const add = (s: string) => {
      console.log(s);
      setLog(l => [...l, s]);
    };
    const ws = new WebSocket('wss://echo.websocket.org');
    ws.onopen = () => {
      ws.send('hello');
      ws.close();
      add(`close() called, readyState=${ws.readyState}`);
    };
    ws.onmessage = e =>
      add(
        `message after close(): "${String(e.data)}", readyState=${ws.readyState}`,
      );
    ws.onclose = e => add(`onclose code=${String(e.code)}`);
  }, []);

  return (
    <View style={styles.container}>
      <RNTesterText>{log.join('\n')}</RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict'; // TODO(OSS Candidate ISS#2710739)

const React = require('react');
const ReactNative = require('react-native');
import {Platform} from 'react-native';
const {Button, PlatformColor, StyleSheet, Text, TextInput, View} = ReactNative;

import type {KeyEvent} from 'react-native/Libraries/Types/CoreEventTypes';

function KeyEventExample(): React.Node {
  const [log, setLog] = React.useState([]);
  const appendLog = (line: string) => {
    const limit = 12;
    let newLog = log.slice(0, limit - 1);
    newLog.unshift(line);
    setLog(newLog);
  };

  return (
    <View style={{padding: 10}}>
      <Text>
        Key events are called when a component detects a key press.To tab
        between views on macOS: Enable System Preferences / Keyboard / Shortcuts
        > Use keyboard navigation to move focus between controls.
      </Text>
      <View>
        {Platform.OS === 'macos' ? (
          <>
            <Text style={styles.title}>View</Text>
            <Text style={styles.text}>
              validKeysDown: [g, Escape, Enter, ArrowLeft]{'\n'}
              validKeysUp: [c, d]
            </Text>
            <View
              focusable={true}
              style={styles.row}
              validKeysDown={['g', 'Escape', 'Enter', 'ArrowLeft']}
              onKeyDown={e => appendLog('Key Down:' + e.nativeEvent.key)}
              validKeysUp={['c', 'd']}
              onKeyUp={e => appendLog('Key Up:' + e.nativeEvent.key)}></View>
            <Text style={styles.title}>TextInput</Text>
            <Text style={styles.text}>
              validKeysDown: [ArrowRight, ArrowDown]{'\n'}
              validKeysUp: [Escape, Enter]
            </Text>
            <TextInput
              blurOnSubmit={false}
              placeholder={'Singleline textInput'}
              multiline={false}
              focusable={true}
              style={styles.row}
              validKeysDown={['ArrowRight', 'ArrowDown']}
              onKeyDown={e => appendLog('Key Down:' + e.nativeEvent.key)}
              validKeysUp={['Escape', 'Enter']}
              onKeyUp={e => appendLog('Key Up:' + e.nativeEvent.key)}
            />
            <TextInput
              placeholder={'Multiline textInput'}
              multiline={true}
              focusable={true}
              style={styles.row}
              validKeysDown={['ArrowRight', 'ArrowDown']}
              onKeyDown={e => appendLog('Key Down:' + e.nativeEvent.key)}
              validKeysUp={['Escape', 'Enter']}
              onKeyUp={e => appendLog('Key Up:' + e.nativeEvent.key)}
            />
            <Text style={styles.text}>
              validKeysDown: []{'\n'}
              validKeysUp: []
            </Text>
            <TextInput
              blurOnSubmit={false}
              placeholder={'Singleline textInput'}
              multiline={false}
              focusable={true}
              style={styles.row}
            />
            <TextInput
              placeholder={'Multiline textInput'}
              multiline={true}
              focusable={true}
              style={styles.row}
            />
          </>
        ) : null}
        <Text>{'Events:\n' + log.join('\n')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 36,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: 'grey',
    padding: 10,
  },
  title: {
    fontSize: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  text: {
    fontSize: 12,
    paddingBottom: 4,
  },
});

exports.title = 'Key Events';
exports.description = 'Examples that show how Key events can be used.';
exports.examples = [
  {
    title: 'KeyEventExample',
    render: function (): React.Element<any> {
      return <KeyEventExample />;
    },
  },
];

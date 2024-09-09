/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict'; // [macOS]

import type {KeyEvent} from 'react-native/Libraries/Types/CoreEventTypes';

const React = require('react');
const ReactNative = require('react-native');

const {Button, ScrollView, StyleSheet, Switch, Text, TextInput, View} =
  ReactNative;

const switchStyle = {
  alignItems: 'center',
  padding: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
};

function KeyEventExample(): React.Node {
  // $FlowFixMe[missing-empty-array-annot]
  const [log, setLog] = React.useState([]);

  const clearLog = React.useCallback(() => {
    setLog([]);
  }, [setLog]);

  const appendLog = React.useCallback(
    (line: string) => {
      const limit = 12;
      let newLog = log.slice(0, limit - 1);
      newLog.unshift(line);
      setLog(newLog);
    },
    [log, setLog],
  );

  const handleKeyDown = React.useCallback(
    (e: KeyEvent) => {
      appendLog('Key Down:' + e.nativeEvent.key);
    },
    [appendLog],
  );

  const handleKeyUp = React.useCallback(
    (e: KeyEvent) => {
      appendLog('Key Up:' + e.nativeEvent.key);
    },
    [appendLog],
  );

  const [showView, setShowView] = React.useState(true);
  const toggleShowView = React.useCallback(
    (value: boolean) => {
      setShowView(value);
    },
    [setShowView],
  );

  const [showTextInput, setShowTextInput] = React.useState(true);
  const toggleShowTextInput = React.useCallback(
    (value: boolean) => {
      setShowTextInput(value);
    },
    [setShowTextInput],
  );

  const [showTextInput2, setShowTextInput2] = React.useState(true);
  const toggleShowTextInput2 = React.useCallback(
    (value: boolean) => {
      setShowTextInput2(value);
    },
    [setShowTextInput2],
  );

  const [passthroughAllKeyEvents, setPassthroughAllKeyEvents] =
    React.useState(false);
  const togglePassthroughAllKeyEvents = React.useCallback(
    (value: boolean) => {
      setPassthroughAllKeyEvents(value);
    },
    [setPassthroughAllKeyEvents],
  );

  const [useKeyDownOrUpEvents, setUseKeyDownOrUpEvents] = React.useState(false);
  const toggleKeyDownOrUpEvents = React.useCallback(
    (value: boolean) => {
      setUseKeyDownOrUpEvents(value);
    },
    [setUseKeyDownOrUpEvents],
  );

  const ViewText = useKeyDownOrUpEvents
    ? "keyDownEvents: [{key: 'g'}, {key: 'Escape'}, {key: 'Enter'}, {key: 'ArrowLeft'}] \nkeyUpEvents: [{key: 'c'}, {key: 'd'}]"
    : 'validKeysDown: [g, Escape, Enter, ArrowLeft] \nvalidKeysUp: [c, d]';
  const viewKeyboardProps = useKeyDownOrUpEvents
    ? {
        keyDownEvents: [
          {key: 'g'},
          {key: 'Escape'},
          {key: 'Enter'},
          {key: 'ArrowLeft'},
        ],
        keyUpEvents: [{key: 'c'}, {key: 'd'}],
      }
    : {
        validKeysDown: ['g', 'Escape', 'Enter', 'ArrowLeft'],
        validKeysUp: ['c ', 'd'],
      };

  const TextInputText = useKeyDownOrUpEvents
    ? "keyDownEvents: [{key: 'ArrowRight'}, {key: 'ArrowDown'}, {key: 'Enter', ctrlKey: true}, \nkeyUpEvents: [{key: 'Escape'}, {key: 'Enter'}]"
    : "validKeysDown: ['ArrowRight', 'ArrowDown', 'Enter'] \nvalidKeysUp: ['Escape ', {key: 'Enter', ctrlKey: true}]";
  const textInputKeyboardProps = useKeyDownOrUpEvents
    ? {
        keyDownEvents: [
          {key: 'ArrowRight'},
          {key: 'ArrowDown'},
          {key: 'Enter', ctrlKey: true},
        ],
        keyUpEvents: [{key: 'Escape'}, {key: 'Enter'}],
      }
    : {
        validKeysDown: ['ArrowRight', 'ArrowDown', 'Enter'],
        validKeysUp: ['Escape ', {key: 'Enter', ctrlKey: true}],
      };

  return (
    <ScrollView>
      <View style={{padding: 10}}>
        <Text>
          Key events are called when a component detects a key press.To tab
          between views on macOS: Enable System Preferences / Keyboard /
          Shortcuts > Use keyboard navigation to move focus between controls.
        </Text>
        <View>
          <View style={switchStyle}>
            <Text style={styles.title}>View</Text>
            <Switch value={showView} onValueChange={toggleShowView} />
          </View>
          {showView && (
            <>
              <Text style={styles.text}>{ViewText}</Text>
              <View
                focusable={true}
                style={styles.row}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                passthroughAllKeyEvents={passthroughAllKeyEvents}
                {...viewKeyboardProps}
              />
            </>
          )}
          <View style={switchStyle}>
            <Text style={styles.title}>TextInput</Text>
            <Switch value={showTextInput} onValueChange={toggleShowTextInput} />
          </View>
          {showTextInput && (
            <>
              <Text style={styles.text}>{TextInputText}</Text>
              <TextInput
                blurOnSubmit={false}
                placeholder={'Singleline textInput'}
                multiline={false}
                focusable={true}
                style={styles.row}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                passthroughAllKeyEvents={passthroughAllKeyEvents}
                {...textInputKeyboardProps}
              />
              <TextInput
                placeholder={'Multiline textInput'}
                multiline={true}
                focusable={true}
                style={styles.row}
                passthroughAllKeyEvents={passthroughAllKeyEvents}
                validKeysDown={[
                  'ArrowRight',
                  'ArrowDown',
                  {key: 'Enter', ctrlKey: true},
                ]}
                onKeyDown={handleKeyDown}
                validKeysUp={['Escape', 'Enter']}
                onKeyUp={handleKeyUp}
              />
            </>
          )}
          <View style={switchStyle}>
            <Text style={styles.title}>TextInput with no handled keys</Text>
            <Switch
              value={showTextInput2}
              onValueChange={toggleShowTextInput2}
            />
          </View>
          {showTextInput2 && (
            <>
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
                passthroughAllKeyEvents={passthroughAllKeyEvents}
                validKeysDown={[]}
                onKeyDown={handleKeyDown}
                validKeysUp={[]}
                onKeyUp={handleKeyUp}
              />
              <TextInput
                placeholder={'Multiline textInput'}
                multiline={true}
                focusable={true}
                style={styles.row}
                passthroughAllKeyEvents={passthroughAllKeyEvents}
                validKeysDown={[]}
                onKeyDown={handleKeyDown}
                validKeysUp={[]}
                onKeyUp={handleKeyUp}
              />
            </>
          )}
          <View style={switchStyle}>
            <Text>{'Pass through all key events'}</Text>
            <Switch
              value={passthroughAllKeyEvents}
              onValueChange={togglePassthroughAllKeyEvents}
            />
          </View>
          <View style={switchStyle}>
            <Text>{'Use keyDownEvents / keyUpEvents'}</Text>
            <Switch
              value={useKeyDownOrUpEvents}
              onValueChange={toggleKeyDownOrUpEvents}
            />
          </View>
          <Button
            testID="event_clear_button"
            onPress={clearLog}
            title="Clear event log"
          />
          <Text>{'Events:\n' + log.join('\n')}</Text>
        </View>
      </View>
    </ScrollView>
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
    render: function (): React.Node {
      return <KeyEventExample />;
    },
  },
];

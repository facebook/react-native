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

const React = require('react');
const ReactNative = require('react-native');

const {Button, ScrollView, StyleSheet, Text, TextInput, View} = ReactNative;

const ghostTextKeywords = ['Alpha', 'Beta'];

function isWhitespace(str: string): boolean {
  return str.trim().length === 0;
}

function lastIndexOfWhitespace(str: string, searchPos: number): number {
  if (searchPos >= str.length) {
    searchPos = str.length - 1;
  }

  while (searchPos >= 0) {
    if (isWhitespace(str.charAt(searchPos))) {
      return searchPos;
    }

    searchPos -= 1;
  }

  return -1;
}

function determinePrefixAndSuffix(
  oldText: string,
  newText: string,
): {
  previousText: string,
  range: $ReadOnly<{start: number, end: number}>,
  text: string,
} {
  const oldTextLength = oldText.length;
  const newTextLength = newText.length;

  let suffixLength = 0;
  while (
    suffixLength < oldTextLength &&
    suffixLength < newTextLength &&
    oldText.charAt(oldTextLength - suffixLength - 1) ===
      newText.charAt(newTextLength - suffixLength - 1)
  ) {
    suffixLength++;
  }

  let prefixLength = 0;
  while (
    prefixLength < oldTextLength - suffixLength &&
    prefixLength < newTextLength - suffixLength &&
    oldText.charAt(prefixLength) === newText.charAt(prefixLength)
  ) {
    prefixLength++;
  }

  return {
    previousText: oldText,
    range: {start: prefixLength, end: oldTextLength - suffixLength},
    text: newText.substring(prefixLength, newTextLength - suffixLength),
  };
}

function determineGhostText(
  text: string,
  selection: $ReadOnly<{start: number, end: number}>,
  input: string,
): ?string {
  if (!input || selection.start !== selection.end) {
    return undefined;
  }

  if (
    selection.start !== text.length &&
    !isWhitespace(text.charAt(selection.start))
  ) {
    return undefined;
  }

  const spacePos =
    selection.start > 0 ? lastIndexOfWhitespace(text, selection.start - 1) : -1;

  const query =
    text.substring(spacePos > 0 ? spacePos + 1 : 0, selection.start) + input;

  for (const keyword of ghostTextKeywords) {
    if (keyword.indexOf(query) === 0 && keyword !== query) {
      return keyword.substring(query.length);
    }
  }

  return undefined;
}

function GhostTextExample(): React.Node {
  const counter = React.useRef(0);
  // $FlowFixMe[missing-empty-array-annot]
  const [log, setLog] = React.useState([]);

  const clearLog = React.useCallback(() => {
    setLog([]);
  }, [setLog]);

  const appendLog = React.useCallback(
    (line: string) => {
      const limit = 20;
      let newLog = log.slice(0, limit - 1);
      newLog.unshift('[' + counter.current.toString() + '] ' + line);
      setLog(newLog);
      counter.current += 1;
    },
    [log, setLog],
  );

  const textInput =
    React.useRef<?React.ElementRef<typeof TextInput>>(undefined);
  const textInput2 =
    React.useRef<?React.ElementRef<typeof TextInput>>(undefined);
  const oldTextContent = React.useRef('');
  const oldText2Content = React.useRef('');
  return (
    <ScrollView>
      <View style={styles.root}>
        <Text>
          Ghost text is hint text that is inserted inline as a hint to the user
          (for example predictive text). Unlike autocomplete for combo boxes,
          which is "visible" to the model, ghost text is "invisible" or
          transparent to the model (i.e. not observable in any callback or
          imperative method).
        </Text>
        <View>
          <TextInput
            ref={textInput}
            placeholder={'Multi line text input'}
            multiline
            onBlur={event =>
              appendLog('onBlur: ' + JSON.stringify(event.nativeEvent))
            }
            onChangeText={text => {
              appendLog('onChangeText: ' + text);
              const changes = determinePrefixAndSuffix(
                oldTextContent.current,
                text,
              );
              textInput.current?.setGhostText(
                determineGhostText(
                  changes.previousText,
                  changes.range,
                  changes.text,
                ),
              );
              oldTextContent.current = text;
            }}
            onEndEditing={event =>
              appendLog('onEndEditing: ' + event.nativeEvent.text)
            }
            onFocus={event =>
              appendLog('onFocus: ' + JSON.stringify(event.nativeEvent))
            }
            onSelectionChange={event => {
              appendLog(
                'onSelectionChange: ' +
                  JSON.stringify(event.nativeEvent.selection),
              );
            }}
            onSubmitEditing={event =>
              appendLog('onSubmitEditing: ' + event.nativeEvent.text)
            }
            style={styles.row}
          />
          <TextInput
            ref={textInput2}
            placeholder={'Single line text input'}
            onBlur={event =>
              appendLog('onBlur: ' + JSON.stringify(event.nativeEvent))
            }
            onChangeText={text => {
              appendLog('onChangeText: ' + text);
              const changes = determinePrefixAndSuffix(
                oldText2Content.current,
                text,
              );
              textInput2.current?.setGhostText(
                determineGhostText(
                  changes.previousText,
                  changes.range,
                  changes.text,
                ),
              );
              oldText2Content.current = text;
            }}
            onEndEditing={event =>
              appendLog('onEndEditing: ' + event.nativeEvent.text)
            }
            onFocus={event =>
              appendLog('onFocus: ' + JSON.stringify(event.nativeEvent))
            }
            onSelectionChange={event => {
              appendLog(
                'onSelectionChange: ' +
                  JSON.stringify(event.nativeEvent.selection),
              );
            }}
            onSubmitEditing={event =>
              appendLog('onSubmitEditing: ' + event.nativeEvent.text)
            }
            style={styles.row}
          />
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
  root: {
    padding: 10,
  },
  row: {
    height: 36,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: 'grey',
    padding: 10,
  },
});

exports.title = 'Ghost text';
exports.description = 'Examples that show how ghost text can be used.';
exports.examples = [
  {
    title: 'GhostTextExample',
    render: function (): React.Element<any> {
      return <GhostTextExample />;
    },
  },
];

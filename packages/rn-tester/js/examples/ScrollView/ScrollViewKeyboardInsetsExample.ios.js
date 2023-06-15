/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import * as React from 'react';

import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

export function ScrollViewKeyboardInsetsExample() {
  const [automaticallyAdjustKeyboardInsets, setAutomaticallyAdjustKeyboardInsets] = React.useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.controlRow}>
        <Text><Text style={styles.code}>automaticallyAdjustKeyboardInsets</Text> is {automaticallyAdjustKeyboardInsets + ''}</Text>
        <Switch
          onValueChange={v => setAutomaticallyAdjustKeyboardInsets(v)}
          value={automaticallyAdjustKeyboardInsets}
          style={styles.controlSwitch}/>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scrollViewContent,
        ]}
        automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
        keyboardDismissMode={'interactive'}>
        {[...Array(20).keys()].map((item, index) => {
          const largeInput = (index % 5) === 4;
          return (
            <View key={item} style={styles.textInputRow}>
              <TextInput placeholder={item.toString()}
                         multiline={largeInput}
                         style={[styles.textInput, largeInput && styles.textInputLarger]}/>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  scrollViewContent: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  textInputRow: {
    borderWidth: 1,
    marginVertical: 8,
    borderColor: '#999',
  },
  textInput: {
    width: '100%',
    backgroundColor: '#fff',
    fontSize: 24,
    padding: 8,
  },
  textInputLarger: {
    minHeight: 200,
  },
  controlRow: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  controlSwitch: {
  },
  controlTextInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: -10,
    marginRight: -10,
    fontSize: 20,
    textAlign: 'right',
  },
  code: {
    fontSize: 12,
    fontFamily: 'Courier',
  },
});

exports.title = 'ScrollViewKeyboardInsets';
exports.category = 'iOS';
exports.description =
  'ScrollView automaticallyAdjustKeyboardInsets adjusts keyboard insets when soft keyboard is activated.';
exports.examples = [
  {
    title: '<ScrollView> automaticallyAdjustKeyboardInsets Example',
    render: (): React.Node => <ScrollViewKeyboardInsetsExample/>,
  },
];

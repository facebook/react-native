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
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

export function ScrollViewKeyboardInsetsExample() {
  const [automaticallyAdjustKeyboardInsets, setAutomaticallyAdjustKeyboardInsets] = React.useState(true);
  const [flatList, setFlatList] = React.useState(false);
  const [inverted, setInverted] = React.useState(false);
  const [heightRestricted, setHeightRestricted] = React.useState(false);

  const scrollViewProps = {
    style: heightRestricted && styles.scrollViewHeightRestricted,
    contentContainerStyle: styles.scrollViewContent,
    automaticallyAdjustKeyboardInsets: automaticallyAdjustKeyboardInsets,
    keyboardDismissMode: 'interactive',
  };

  const data = [...Array(20).keys()];
  const renderItem = ({ item, index }) => {
    const largeInput = (index % 5) === 4;
    return (
      <View key={item} style={styles.textInputRow}>
        <TextInput placeholder={item.toString()}
                   multiline={largeInput}
                   style={[styles.textInput, largeInput && styles.textInputLarger]}/>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlRow}>
        <Text><Text style={styles.code}>automaticallyAdjustKeyboardInsets</Text> is {automaticallyAdjustKeyboardInsets + ''}</Text>
        <Switch
          onValueChange={v => setAutomaticallyAdjustKeyboardInsets(v)}
          value={automaticallyAdjustKeyboardInsets}
          style={styles.controlSwitch}/>
      </View>
      <View style={styles.controlRow}>
        <Text><Text style={styles.code}>FlatList</Text> is {flatList + ''}</Text>
        <Switch
          onValueChange={v => setFlatList(v)}
          value={flatList}
          style={styles.controlSwitch}/>
      </View>
      {flatList && (
        <View style={styles.controlRow}>
          <Text><Text style={styles.code}>inverted</Text> is {inverted + ''}</Text>
          <Switch
            onValueChange={v => setInverted(v)}
            value={inverted}
            style={styles.controlSwitch}/>
        </View>
      )}
      <View style={styles.controlRow}>
        <Text><Text style={styles.code}>HeightRestricted</Text> is {heightRestricted + ''}</Text>
        <Switch
          onValueChange={v => setHeightRestricted(v)}
          value={heightRestricted}
          style={styles.controlSwitch}/>
      </View>
      <View style={styles.controlRow}>
        <TextInput placeholder={'Text input outside scroll view'} style={styles.controlTextInput} />
      </View>
      {flatList
        ? (
          <FlatList
            {...scrollViewProps}
            inverted={inverted}
            data={data}
            renderItem={renderItem}/>
        )
        : (
          <ScrollView {...scrollViewProps}>
            {data.map((item, index) => renderItem({ item, index }))}
          </ScrollView>
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  scrollViewHeightRestricted: {
    marginVertical: 50,
    borderColor: '#f00',
    borderWidth: 1,
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
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
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

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('react');
import {useState} from 'react';
const {Text, View, Pressable, Alert, StyleSheet} = require('react-native');

const Doubler = require('../../../NativeDoubler/NativeDoubler');
import type {BoxedString} from '../../../NativeDoubler/NativeDoubler';

const DoublerExample = (): React.Element<any> => {
  const [value, setValue] = useState<
    null | number | string | {aNumber: number} | BoxedString,
  >(null);

  const doubleValue = (
    val: number | string | {aNumber: number} | BoxedString,
  ) => {
    Doubler.doubleTheValue(val)
      .then(result => {
        setValue(result);
      })
      .catch(error => Alert.alert(error));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => doubleValue(2)}>
        <Text style={{color: 'green'}}>
          Double number: 2 {typeof value === 'number' ? `= ${value}` : null}
        </Text>
      </Pressable>
      <Pressable onPress={() => doubleValue('Hi')}>
        <Text style={{color: 'green'}}>
          Double string: "Hi"{' '}
          {typeof value === 'string' ? `= "${value}"` : null}
        </Text>
      </Pressable>
      <Pressable onPress={() => doubleValue({aNumber: 4})}>
        <Text style={{color: 'green'}}>
          Double object: aNumber => 4{' '}
          {typeof value === 'object' && value != null && value.aNumber != null
            ? `= {aNumber: ${value.aNumber}}`
            : null}
        </Text>
      </Pressable>
      <Pressable
        style={{marginBottom: 25}}
        onPress={() => doubleValue({aString: 'Hello'})}>
        <Text style={{color: 'green'}}>
          Double BString: aString => "Hello"{' '}
          {typeof value === 'object' && value != null && value.aString != null
            ? `= {aString: "${value.aString}"}`
            : null}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

exports.title = 'Doubler';
exports.category = 'Basic';
exports.description = 'API to double number or strings.';
exports.examples = [
  {
    title: 'Take screenshot',
    render(): React.Element<any> {
      return DoublerExample();
    },
  },
];

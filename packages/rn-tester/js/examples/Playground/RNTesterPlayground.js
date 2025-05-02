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
import * as React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';

function Playground() {
  const [value, setValue] = React.useState('0.5');
  const [scale, setScale] = React.useState(0.5);

  return (
    <View>
      <View style={{backgroundColor: 'green', marginTop: 10}}>
        <View style={{height: 100, transform: [{scaleY: 0}]}}>
          <TouchableWithoutFeedback onPress={() => console.log('1 clicked')}>
            <View style={{flex: 1, backgroundColor: 'red'}} />
          </TouchableWithoutFeedback>
        </View>
      </View>
      <View style={{backgroundColor: 'green', marginTop: 10}}>
        <View style={{height: 100, transform: [{scaleY: scale}]}}>
          <TouchableWithoutFeedback onPress={() => console.log('2 clicked')}>
            <View style={{flex: 1, backgroundColor: 'red'}} />
          </TouchableWithoutFeedback>
        </View>
      </View>
      <View>
        <Text>Scale:</Text>
        <TextInput
          value={value}
          onChangeText={it => {
            setValue(it);
            const p = parseFloat(it);
            if (isFinite(p)) setScale(p);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);

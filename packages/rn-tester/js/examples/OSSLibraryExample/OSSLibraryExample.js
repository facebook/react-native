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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {NativeComponentType} from '@react-native/oss-library-example';

import RNTesterText from '../../components/RNTesterText';
import {
  SampleNativeComponent,
  SampleNativeComponentCommands,
} from '@react-native/oss-library-example';
import {NativeSampleModule} from '@react-native/oss-library-example';
import * as React from 'react';
import {useRef, useState} from 'react';
import {Button, View} from 'react-native';
import {StyleSheet} from 'react-native';

const colors = [
  '#0000FF',
  '#FF0000',
  '#00FF00',
  '#003300',
  '#330000',
  '#000033',
];

// $FlowFixMe[value-as-type]
const styles: StyleSheet = StyleSheet.create({
  container: {
    flex: 1,
  },
  column: {
    flex: 2,
    justifyContent: 'center',
    paddingLeft: 5,
    paddingRight: 5,
  },
});

function SampleNativeComponentContainer(props: {}): React.Node {
  const ref = useRef<React.ElementRef<NativeComponentType> | null>(null);
  const [opacity, setOpacity] = useState(1.0);
  const [arrayValues, setArrayValues] = useState([1, 2, 3]);
  return (
    <View style={{flex: 1}}>
      <SampleNativeComponent
        ref={ref}
        style={{flex: 1}}
        opacity={opacity}
        values={arrayValues}
        onIntArrayChanged={event => {
          console.log(event.nativeEvent.values);
          console.log(event.nativeEvent.boolValues);
          console.log(event.nativeEvent.floats);
          console.log(event.nativeEvent.doubles);
          console.log(event.nativeEvent.yesNos);
          console.log(event.nativeEvent.strings);
          console.log(event.nativeEvent.latLons);
          console.log(event.nativeEvent.multiArrays);
        }}
      />
      <Button
        title="Change Background"
        onPress={() => {
          let newColor = colors[Math.floor(Math.random() * 5)];
          SampleNativeComponentCommands.changeBackgroundColor(
            // $FlowFixMe[incompatible-call]
            ref.current,
            newColor,
          );
        }}
      />
      <Button
        title="Set Opacity"
        onPress={() => {
          setOpacity(Math.random());
          setArrayValues([
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
          ]);
        }}
      />
    </View>
  );
}

function NativeSampleModuleWrapper(props: {}): React.Node {
  const [randomNumber, setRandomNumber] = useState(0);
  return (
    <View style={styles.container}>
      <Button
        title="Get Random Number"
        onPress={() => {
          const x = NativeSampleModule?.getRandomNumber();
          if (x != null) {
            setRandomNumber(x);
          }
        }}
      />
      <RNTesterText style={styles.column}>{randomNumber}</RNTesterText>
    </View>
  );
}

exports.title = 'OSS Library Example';
exports.description = 'OSS Library Example.';
exports.examples = [
  {
    title: 'OSS Library Example',
    description: 'Click to change background and opacity',
    render(): React.MixedElement {
      return (
        <>
          <SampleNativeComponentContainer />
          <NativeSampleModuleWrapper />
        </>
      );
    },
  },
] as Array<RNTesterModuleExample>;

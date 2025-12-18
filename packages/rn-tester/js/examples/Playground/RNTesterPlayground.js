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

import {useMemo, useRef, useState} from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
// import CustomViewNativeComponent, {Commands} from '@discordapp/rtn-codegen/js/CustomViewNativeComponent';
import CustomViewNativeComponent, { Commands } from './CustomViewNativeComponent';

function Playground() {
  const [changeZIndex, setChangeZIndex] = useState(false);
  const viewRef = useRef<React.ElementRef<typeof CustomViewNativeComponent>>(null);

  const startViewTransition = () => {
    if (viewRef.current) {
      Commands.startViewTransition(viewRef.current);
    }
  };
  const endViewTransition = () => {
    if (viewRef.current) {
      Commands.endViewTransition(viewRef.current);
    }
  };

  return (
    <View style={styles.container} collapsableChildren={false}>
      <View style={styles.buttons}>
        <Button title="Start View Transition" onPress={startViewTransition} />
        <Button title="End View Transition" onPress={endViewTransition} />
        <Button title="Change Z-Index" onPress={() => setChangeZIndex(!changeZIndex)} />
      </View>

      <CustomViewNativeComponent ref={viewRef} style={styles.parent} collapsable={false} collapsableChildren={false}>
        {/* Box A: starts at zIndex 1, goes to 4 when changed */}
        <View
          style={[styles.box, styles.boxA, {zIndex: changeZIndex ? 4 : 1}]}
          collapsable={false}
          collapsableChildren={false}>
          <Text>Box A</Text>
        </View>

        {/* Box B: starts at zIndex 2, goes to 3 when changed */}
        <View
          style={[styles.box, styles.boxB, {zIndex: changeZIndex ? 3 : 2}]}
          collapsable={false}
          collapsableChildren={false}>
          <Text>Box B</Text>
        </View>

        {/* Box C: starts at zIndex 3, goes to 2 when changed */}
        <View
          style={[styles.box, styles.boxC, {zIndex: changeZIndex ? 2 : 3}]}
          collapsable={false}
          collapsableChildren={false}>
          <Text>Box C</Text>
        </View>

        {/* Box D: starts at zIndex 4, goes to 1 when changed */}
        <View
          style={[styles.box, styles.boxD, {zIndex: changeZIndex ? 1 : 4}]}
          collapsable={false}
          collapsableChildren={false}>
          <Text>Box D</Text>
        </View>

        {/* Box E: no zIndex change, acts as a stable reference */}
        <View style={[styles.box, styles.boxE]} collapsable={false} collapsableChildren={false}>
          <Text>Box E</Text>
        </View>
      </CustomViewNativeComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  buttons: {
    flexDirection: 'column',
    gap: 10,
  },
  parent: {
    marginTop: 20,
    height: 400,
    backgroundColor: '#f0f0f0',
  },
  box: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  boxA: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    top: 20,
    left: 20,
  },
  boxB: {
    backgroundColor: 'rgba(0, 0, 255, 0.7)',
    top: 50,
    left: 50,
  },
  boxC: {
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    top: 80,
    left: 80,
  },
  boxD: {
    backgroundColor: 'rgba(255, 255, 0, 0.7)',
    top: 110,
    left: 110,
  },
  boxE: {
    backgroundColor: 'rgba(255, 0, 255, 0.7)',
    top: 140,
    left: 140,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);

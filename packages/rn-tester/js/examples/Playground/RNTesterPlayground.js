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
import {Button, Dimensions, Modal, StyleSheet, View} from 'react-native';

function Playground() {
  const [visible, setVisible] = React.useState(false);
  const [heights, setHeights] = React.useState<Array<number>>([]);
  const screenHeight = Dimensions.get('screen').height;

  return (
    <View style={styles.container}>
      <RNTesterText>
        Android edge-to-edge Modal initial layout (issue #59353)
      </RNTesterText>
      <RNTesterText>Screen height: {screenHeight}</RNTesterText>
      <RNTesterText>
        Every onLayout height: {heights.join(' -> ') || 'Open the modal'}
      </RNTesterText>
      <Button
        title="Open Modal"
        onPress={() => {
          setHeights([]);
          setVisible(true);
        }}
      />
      {visible && (
        <Modal
          visible
          transparent
          statusBarTranslucent
          navigationBarTranslucent
          animationType="none"
          onRequestClose={() => setVisible(false)}>
          <View
            collapsable={false}
            style={styles.modal}
            onLayout={({nativeEvent: {layout}}) => {
              console.log('Modal onLayout:', layout);
              setHeights(previous => [...previous, layout.height]);
            }}>
            <View style={styles.content}>
              <RNTesterText>Screen height: {screenHeight}</RNTesterText>
              <RNTesterText>
                Every onLayout height: {heights.join(' -> ')}
              </RNTesterText>
              <RNTesterText>
                Expected: the first height matches the full modal window.
              </RNTesterText>
              <Button title="Close Modal" onPress={() => setVisible(false)} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#bde3ff',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 100,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Reproduce the initial height of an Android edge-to-edge Modal.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;

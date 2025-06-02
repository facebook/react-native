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
import {StyleSheet, View, Modal, Button, Dimensions} from 'react-native';

function Playground() {
  const [modalVisible, setModalVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <Button
        title="Open Modal with Detents"
        onPress={() => setModalVisible(true)}
      />
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet"
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <RNTesterText>
              Try dragging the modal up and down to see the bottom red box flicker
            </RNTesterText>
            <Button title="Close Modal" onPress={() => setModalVisible(false)} />
            <View style={styles.flexContainer}>
              <View style={styles.bottomBox} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  flexContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'red',
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);

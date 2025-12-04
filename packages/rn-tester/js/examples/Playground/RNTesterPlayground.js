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
import {StyleSheet, View, Text, Button, Modal} from 'react-native';


function Example() {
  const [isOpen, setOpen] = React.useState(false);
  const [isOpenTwo, setOpenTwo] = React.useState(false);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const openModalTwo = () => setOpenTwo(true);
  const closeModalTwo = () => setOpenTwo(false);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'lightblue',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Take Over</Text>
      <Button title="open modal" onPress={openModal} />
      <Button title="open modal two" onPress={openModalTwo} />
      <Modal visible={isOpenTwo} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'lightgreen',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>Hello second modal</Text>
          <Button title="dismiss" onPress={closeModalTwo} />
        </View>
      </Modal>
      <Modal visible={isOpen} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'lightyellow',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>Hello world again</Text>
          <Button title="dismiss" onPress={closeModal} />
          <Button title="open second modal" onPress={openModalTwo} />
        </View>
      </Modal>

    </View>
  );
}

function Playground() {
  return (
    <View style={styles.container}>
      <Example />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);

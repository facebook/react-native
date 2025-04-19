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

import * as React from 'react';
import {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

function causeJSThreadBlocking() {
  const intervalId = setInterval(() => {
    const start = Date.now();
    while (Date.now() - start < 20) {
      // Blocking operation
      Math.random() * Math.random();
    }
  }, 16);
  setTimeout(() => {
    clearInterval(intervalId);
  }, 10000);
}

function ModalInSequence(): React.Node {
  const [firstModalVisible, setFirstModalVisible] = useState(false);
  const [secondModalVisible, setSecondModalVisible] = useState(false);

  const showSecondHideFirst = () => {
    setFirstModalVisible(false);
    setSecondModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Modal
        key="first"
        animationType="slide"
        transparent={true}
        visible={firstModalVisible}
        onRequestClose={() => setFirstModalVisible(false)}>
        <View
          onLayout={e => {
            causeJSThreadBlocking();
            console.log('modal first', e.nativeEvent.layout);
          }}
          style={[styles.centeredView, styles.modalBackdrop]}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>This is the first modal</Text>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={async () => {
                // await new Promise(resolve => setTimeout(resolve, 100));
                setFirstModalVisible(false);
              }}>
              <Text style={styles.textStyle}>Close Modal</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonOpen]}
              onPress={showSecondHideFirst}>
              <Text style={styles.textStyle}>Show Second Modal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        key="second"
        animationType="slide"
        transparent={true}
        visible={secondModalVisible}
        onRequestClose={() => setSecondModalVisible(false)}>
        <View
          onLayout={e => {
            console.log('modal second', e.nativeEvent.layout);
          }}
          style={[styles.centeredView, styles.modalBackdrop]}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>This is the second modal</Text>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setSecondModalVisible(false)}>
              <Text style={styles.textStyle}>Close Modal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Pressable
        style={[styles.button, styles.buttonOpen]}
        onPress={() => setFirstModalVisible(true)}>
        <Text style={styles.textStyle}>Show First Modal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    paddingVertical: 30,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 10,
    elevation: 2,
    minWidth: 150,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <ModalInSequence />,
}: RNTesterModuleExample);


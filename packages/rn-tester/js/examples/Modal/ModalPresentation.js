/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/* eslint-disable no-alert */

import * as React from 'react';
import {Modal, Platform, StyleSheet, Switch, Text, View} from 'react-native';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import RNTOption from '../../components/RNTOption';
const RNTesterButton = require('../../components/RNTesterButton');

const supportedOrientations = {
  Portrait: ['portrait'],
  Landscape: ['landscape'],
  'Landscape Left': ['landscape-left'],
  'Portrait and Landscape Right': ['portrait', 'landscape-right'],
  'Portrait and Landscape': ['portrait', 'landscape'],
  Default: [],
};

const animationTypes = ['slide', 'none', 'fade'];
const presentationStyles = [
  'fullScreen',
  'pageSheet',
  'formSheet',
  'overFullScreen',
];
const iOSActions = ['None', 'On Dismiss', 'On Show'];
const noniOSActions = ['None', 'On Show'];

function ModalPresentation() {
  const [animationType, setAnimationType] = React.useState('none');
  const [transparent, setTransparent] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [hardwareAccelerated, setHardwareAccelerated] = React.useState(false);
  const [statusBarTranslucent, setStatusBarTranslucent] = React.useState(false);
  const [presentationStyle, setPresentationStyle] =
    React.useState('fullScreen');
  const [supportedOrientationKey, setSupportedOrientationKey] =
    React.useState('Portrait');
  const [currentOrientation, setCurrentOrientation] = React.useState('unknown');
  const [action, setAction] = React.useState('None');
  const actions = Platform.OS === 'ios' ? iOSActions : noniOSActions;
  const onDismiss = () => {
    setVisible(false);
    if (action === 'onDismiss') {
      alert('onDismiss');
    }
  };

  const onShow = () => {
    if (action === 'onShow') {
      alert('onShow');
    }
  };
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  const onOrientationChange = event =>
    setCurrentOrientation(event.nativeEvent.orientation);
  const modalBackgroundStyle = {
    backgroundColor: transparent ? 'rgba(0, 0, 0, 0.5)' : '#f5fcff',
  };
  const innerContainerTransparentStyle = transparent
    ? {backgroundColor: '#fff', padding: 20}
    : null;
  return (
    <View>
      <RNTesterButton onPress={() => setVisible(true)}>
        Show Modal
      </RNTesterButton>
      <Modal
        animationType={animationType}
        presentationStyle={presentationStyle}
        transparent={transparent}
        hardwareAccelerated={hardwareAccelerated}
        statusBarTranslucent={statusBarTranslucent}
        visible={visible}
        onRequestClose={onDismiss}
        supportedOrientations={supportedOrientations[supportedOrientationKey]}
        onOrientationChange={onOrientationChange}
        onDismiss={onDismiss}
        onShow={onShow}>
        <View style={[styles.modalContainer, modalBackgroundStyle]}>
          <View
            style={[
              styles.modalInnerContainer,
              innerContainerTransparentStyle,
            ]}>
            <Text>
              This modal was presented with animationType: '{animationType}'
            </Text>
            {Platform.OS === 'ios' ? (
              <Text>
                It is currently displayed in {currentOrientation} mode.
              </Text>
            ) : null}
            <RNTesterButton onPress={onDismiss}>Close</RNTesterButton>
          </View>
        </View>
      </Modal>
      <View style={styles.block}>
        <Text style={styles.title}>Animation Type</Text>
        <View style={styles.row}>
          {animationTypes.map(type => (
            <RNTOption
              key={type}
              style={styles.option}
              label={type}
              onPress={() => setAnimationType(type)}
              selected={type === animationType}
            />
          ))}
        </View>
      </View>
      {Platform.OS === 'android' && Platform.isTV !== true ? (
        <>
          <View style={styles.inlineBlock}>
            <Text style={styles.title}>Status Bar Translucent</Text>
            <Switch
              value={statusBarTranslucent}
              onValueChange={() =>
                setStatusBarTranslucent(!statusBarTranslucent)
              }
            />
          </View>
          <View style={styles.inlineBlock}>
            <Text style={styles.title}>Hardware Acceleration</Text>
            <Switch
              value={hardwareAccelerated}
              onValueChange={() => setHardwareAccelerated(!hardwareAccelerated)}
            />
          </View>
        </>
      ) : null}
      {Platform.isTV !== true ? (
        <>
          {Platform.OS === 'ios' ? (
            <View style={styles.block}>
              <Text style={styles.title}>Presentation Style</Text>
              <View style={styles.row}>
                {presentationStyles.map(type => (
                  <RNTOption
                    key={type}
                    style={styles.option}
                    label={type}
                    onPress={() => {
                      if (type !== 'overFullScreen' && transparent) {
                        setTransparent(false);
                      }
                      setPresentationStyle(type);
                    }}
                    selected={type === presentationStyle}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.block}>
            <View style={styles.rowWithSpaceBetween}>
              <Text style={styles.title}>Transparent</Text>
              <Switch
                value={transparent}
                disabled={presentationStyle !== 'overFullScreen'}
                onValueChange={() => setTransparent(!transparent)}
              />
            </View>
            {Platform.OS === 'ios' && presentationStyle !== 'overFullScreen' ? (
              <Text style={styles.warning}>
                iOS Modal can only be transparent with 'overFullScreen'
                Presentation Style
              </Text>
            ) : null}
          </View>
          <View style={styles.block}>
            <Text style={styles.title}>Supported Orientation</Text>
            <View style={styles.row}>
              {Object.keys(supportedOrientations).map(label => (
                <RNTOption
                  key={label}
                  style={styles.option}
                  label={label}
                  onPress={() => setSupportedOrientationKey(label)}
                  selected={label === supportedOrientationKey}
                />
              ))}
            </View>
          </View>
          <View style={styles.block}>
            <Text style={styles.title}>Actions</Text>
            <View style={styles.row}>
              {actions.map(value => (
                <RNTOption
                  key={value}
                  style={styles.option}
                  label={value}
                  onPress={() => setAction(value)}
                  selected={value === action}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  rowWithSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  block: {
    borderColor: 'rgba(0,0,0, 0.1)',
    borderBottomWidth: 1,
    padding: 6,
  },
  inlineBlock: {
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: 'rgba(0,0,0, 0.1)',
    borderBottomWidth: 1,
  },
  title: {
    margin: 3,
    fontWeight: 'bold',
  },
  option: {
    marginRight: 8,
    marginTop: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalInnerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },
  warning: {
    margin: 3,
    fontSize: 12,
    color: 'red',
  },
});

export default ({
  title: 'Modal Presentation',
  name: 'basic',
  description: 'Modals can be presented with or without animation',
  render: (): React.Node => <ModalPresentation />,
}: RNTesterModuleExample);

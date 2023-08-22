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
import type {Props as ModalProps} from 'react-native/Libraries/Modal/Modal';
import RNTOption from '../../components/RNTOption';
const RNTesterButton = require('../../components/RNTesterButton');

const animationTypes = ['slide', 'none', 'fade'];
const presentationStyles = [
  'fullScreen',
  'pageSheet',
  'formSheet',
  'overFullScreen',
];
const supportedOrientations = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
];

function ModalPresentation() {
  const onDismiss = React.useCallback(() => {
    alert('onDismiss');
  }, []);

  const onShow = React.useCallback(() => {
    alert('onShow');
  }, []);

  const onRequestClose = React.useCallback(() => {
    console.log('onRequestClose');
  }, []);

  const [props, setProps] = React.useState<ModalProps>({
    animationType: 'none',
    transparent: false,
    hardwareAccelerated: false,
    statusBarTranslucent: false,
    presentationStyle: Platform.select({
      ios: 'fullScreen',
      default: undefined,
    }),
    supportedOrientations: Platform.select({
      ios: ['portrait'],
      default: undefined,
    }),
    onDismiss: undefined,
    onShow: undefined,
    visible: false,
  });
  const presentationStyle = props.presentationStyle;
  const hardwareAccelerated = props.hardwareAccelerated;
  const statusBarTranslucent = props.statusBarTranslucent;

  const [currentOrientation, setCurrentOrientation] = React.useState('unknown');

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  const onOrientationChange = event =>
    setCurrentOrientation(event.nativeEvent.orientation);

  const controls = (
    <>
      <View style={styles.inlineBlock}>
        <Text style={styles.title}>Status Bar Translucent 🟢</Text>
        <Switch
          value={statusBarTranslucent}
          onValueChange={enabled =>
            setProps(prev => ({...prev, statusBarTranslucent: enabled}))
          }
        />
      </View>
      <View style={styles.inlineBlock}>
        <Text style={styles.title}>Hardware Acceleration 🟢</Text>
        <Switch
          value={hardwareAccelerated}
          onValueChange={enabled =>
            setProps(prev => ({
              ...prev,
              hardwareAccelerated: enabled,
            }))
          }
        />
      </View>
      <View style={styles.block}>
        <Text style={styles.title}>Presentation Style ⚫️</Text>
        <View style={styles.row}>
          {presentationStyles.map(type => (
            <RNTOption
              key={type}
              disabled={Platform.OS !== 'ios'}
              style={styles.option}
              label={type}
              multiSelect={true}
              onPress={() =>
                setProps(prev => {
                  if (type === 'overFullScreen' && prev.transparent === true) {
                    return {
                      ...prev,
                      presentationStyle: type,
                      transparent: false,
                    };
                  }
                  return {
                    ...prev,
                    presentationStyle:
                      type === prev.presentationStyle ? undefined : type,
                  };
                })
              }
              selected={type === presentationStyle}
            />
          ))}
        </View>
      </View>
      <View style={styles.block}>
        <View style={styles.rowWithSpaceBetween}>
          <Text style={styles.title}>Transparent</Text>
          <Switch
            value={props.transparent}
            onValueChange={enabled =>
              setProps(prev => ({...prev, transparent: enabled}))
            }
          />
        </View>
        {Platform.OS === 'ios' && presentationStyle !== 'overFullScreen' ? (
          <Text style={styles.warning}>
            iOS Modal can only be transparent with 'overFullScreen' Presentation
            Style
          </Text>
        ) : null}
      </View>
      <View style={styles.block}>
        <Text style={styles.title}>Supported Orientation ⚫️</Text>
        <View style={styles.row}>
          {supportedOrientations.map(orientation => (
            <RNTOption
              key={orientation}
              disabled={Platform.OS !== 'ios'}
              style={styles.option}
              label={orientation}
              multiSelect={true}
              onPress={() =>
                setProps(prev => {
                  if (prev.supportedOrientations?.includes(orientation)) {
                    return {
                      ...prev,
                      supportedOrientations: prev.supportedOrientations?.filter(
                        o => o !== orientation,
                      ),
                    };
                  }
                  return {
                    ...prev,
                    supportedOrientations: [
                      ...(prev.supportedOrientations ?? []),
                      orientation,
                    ],
                  };
                })
              }
              selected={props.supportedOrientations?.includes(orientation)}
            />
          ))}
        </View>
      </View>
      <View style={styles.block}>
        <Text style={styles.title}>Actions</Text>
        <View style={styles.row}>
          <RNTOption
            key="onShow"
            style={styles.option}
            label="onShow"
            multiSelect={true}
            onPress={() =>
              setProps(prev => ({
                ...prev,
                onShow: prev.onShow ? undefined : onShow,
              }))
            }
            selected={!!props.onShow}
          />
          <RNTOption
            key="onDismiss"
            style={styles.option}
            label="onDismiss ⚫️"
            disabled={Platform.OS !== 'ios'}
            onPress={() =>
              setProps(prev => ({
                ...prev,
                onDismiss: prev.onDismiss ? undefined : onDismiss,
              }))
            }
            selected={!!props.onDismiss}
          />
        </View>
      </View>
    </>
  );

  return (
    <View>
      <RNTesterButton
        onPress={() => setProps(prev => ({...prev, visible: true}))}>
        Show Modal
      </RNTesterButton>
      <Modal
        {...props}
        onRequestClose={onRequestClose}
        onOrientationChange={onOrientationChange}>
        <View style={styles.modalContainer}>
          <View style={styles.modalInnerContainer}>
            <Text testID="modal_animationType_text">
              This modal was presented with animationType: '
              {props.animationType}'
            </Text>
            {Platform.OS === 'ios' ? (
              <Text>
                It is currently displayed in {currentOrientation} mode.
              </Text>
            ) : null}
            <RNTesterButton
              onPress={() => setProps(prev => ({...prev, visible: false}))}>
              Close
            </RNTesterButton>
            {controls}
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
              onPress={() => setProps(prev => ({...prev, animationType: type}))}
              selected={type === props.animationType}
            />
          ))}
        </View>
      </View>
      {controls}
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
    backgroundColor: '#fff',
    padding: 10,
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

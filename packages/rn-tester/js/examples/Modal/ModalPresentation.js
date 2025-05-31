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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ModalProps} from 'react-native';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import RNTOption from '../../components/RNTOption';
import * as React from 'react';
import {useCallback, useContext, useState} from 'react';
import {Modal, Platform, StyleSheet, Switch, Text, View} from 'react-native';

const animationTypes = ['slide', 'none', 'fade'] as const;
const presentationStyles = [
  'fullScreen',
  'pageSheet',
  'formSheet',
  'overFullScreen',
] as const;
const supportedOrientations = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
] as const;

const backdropColors = ['red', 'blue', undefined];

function ModalPresentation() {
  const onDismiss = useCallback(() => {
    alert('onDismiss');
  }, []);

  const onShow = useCallback(() => {
    alert('onShow');
  }, []);

  const onRequestClose = useCallback(() => {
    console.log('onRequestClose');
  }, []);

  const [props, setProps] = useState<ModalProps>({
    animationType: 'none',
    transparent: false,
    hardwareAccelerated: false,
    statusBarTranslucent: false,
    navigationBarTranslucent: false,
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
    backdropColor: undefined,
  });
  const presentationStyle = props.presentationStyle;
  const hardwareAccelerated = props.hardwareAccelerated;
  const statusBarTranslucent = props.statusBarTranslucent;
  const navigationBarTranslucent = props.navigationBarTranslucent;
  const backdropColor = props.backdropColor;
  const backgroundColor = useContext(RNTesterThemeContext).BackgroundColor;

  const [currentOrientation, setCurrentOrientation] = useState('unknown');

  type OrientationChangeEvent = Parameters<
    $NonMaybeType<ModalProps['onOrientationChange']>,
  >[0];
  const onOrientationChange = (event: OrientationChangeEvent) =>
    setCurrentOrientation(event.nativeEvent.orientation);

  const controls = (
    <>
      <View style={styles.inlineBlock}>
        <RNTesterText style={styles.title}>
          Status Bar Translucent 🟢
        </RNTesterText>
        <Switch
          value={statusBarTranslucent}
          onValueChange={enabled =>
            setProps(prev => ({
              ...prev,
              statusBarTranslucent: enabled,
              navigationBarTranslucent: false,
            }))
          }
        />
      </View>
      <View style={styles.inlineBlock}>
        <RNTesterText style={styles.title}>
          Navigation Bar Translucent 🟢
        </RNTesterText>
        <Switch
          value={navigationBarTranslucent}
          onValueChange={enabled => {
            setProps(prev => ({
              ...prev,
              statusBarTranslucent: enabled,
              navigationBarTranslucent: enabled,
            }));
          }}
        />
      </View>
      <View style={styles.inlineBlock}>
        <RNTesterText style={styles.title}>
          Hardware Acceleration 🟢
        </RNTesterText>
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
        <RNTesterText style={styles.title}>Presentation Style ⚫️</RNTesterText>
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
          <RNTesterText style={styles.title}>Transparent</RNTesterText>
          <Switch
            value={props.transparent}
            onValueChange={enabled =>
              setProps(prev => ({...prev, transparent: enabled}))
            }
          />
        </View>
        {Platform.OS === 'ios' && presentationStyle !== 'overFullScreen' ? (
          <RNTesterText style={styles.warning}>
            iOS Modal can only be transparent with 'overFullScreen' Presentation
            Style
          </RNTesterText>
        ) : null}
      </View>
      <View style={styles.block}>
        <RNTesterText style={styles.title}>
          Supported Orientation ⚫️
        </RNTesterText>
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
        <RNTesterText style={styles.title}>Actions</RNTesterText>
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
      <View style={styles.block}>
        <RNTesterText style={styles.title}>Backdrop Color ⚫️</RNTesterText>
        <View style={styles.row}>
          {backdropColors.map(type => (
            <RNTOption
              key={type ?? 'default'}
              style={styles.option}
              label={type ?? 'default'}
              multiSelect={true}
              onPress={() =>
                setProps(prev => ({
                  ...prev,
                  backdropColor: type,
                }))
              }
              selected={type === backdropColor}
            />
          ))}
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
          <View style={[styles.modalInnerContainer, {backgroundColor}]}>
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
        <RNTesterText style={styles.title}>Animation Type</RNTesterText>
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

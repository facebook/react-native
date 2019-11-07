/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {LogLevel} from '../Data/LogBoxLog';

import * as React from 'react';
import SafeAreaView from '../../Components/SafeAreaView/SafeAreaView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';

type Props = $ReadOnly<{|
  onDismiss: () => void,
  onMinimize: () => void,
  fatalType?: ?LogLevel,
|}>;

function LogBoxInspectorFooter(props: Props): React.Node {
  if (props.fatalType === 'fatal' || props.fatalType === 'syntax') {
    return (
      <View style={[styles.root, fatalStyles.root]}>
        <LogBoxButton
          backgroundColor={{
            default: LogBoxStyle.getFatalColor(),
            pressed: LogBoxStyle.getFatalDarkColor(),
          }}
          onPress={() =>
            require('../../Utilities/DevSettings').reload('LogBox fatal')
          }
          style={fatalStyles.button}>
          <View style={[fatalStyles.content]}>
            <Text style={fatalStyles.label}>Reload</Text>
            <Text style={fatalStyles.subtextLabel}>
              {{fatal: 'Fatal', syntax: 'Syntax'}[props.fatalType]} errors
              require a full reload
            </Text>
          </View>
          <SafeAreaView />
        </LogBoxButton>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FooterButton text="Dismiss" onPress={props.onDismiss} />
      <FooterButton text="Close" onPress={props.onMinimize} />
    </View>
  );
}

type ButtonProps = $ReadOnly<{|
  onPress: () => void,
  text: string,
|}>;

function FooterButton(props: ButtonProps): React.Node {
  return (
    <LogBoxButton
      backgroundColor={{
        default: 'transparent',
        pressed: LogBoxStyle.getBackgroundDarkColor(),
      }}
      onPress={props.onPress}
      style={buttonStyles.button}>
      <View style={buttonStyles.content}>
        <Text style={buttonStyles.label}>{props.text}</Text>
      </View>
      <SafeAreaView />
    </LogBoxButton>
  );
}

const fatalStyles = StyleSheet.create({
  root: {
    shadowColor: LogBoxStyle.getBackgroundDarkColor(1),
  },
  button: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
  },
  subtext: {
    height: 60,
  },
  label: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
  subtextLabel: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 12,
  },
});

const buttonStyles = StyleSheet.create({
  button: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  label: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  root: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowRadius: 2,
    shadowOpacity: 0.5,
    elevation: 1,
    flexDirection: 'row',
  },
});

export default LogBoxInspectorFooter;

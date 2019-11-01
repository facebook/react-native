/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import Image from '../../Image/Image';
import Platform from '../../Utilities/Platform';
import * as React from 'react';
import SafeAreaView from '../../Components/SafeAreaView/SafeAreaView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import LogBoxImageSource from './LogBoxImageSource';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import type {LogLevel} from '../Data/LogBoxLog';
type Props = $ReadOnly<{|
  onSelectIndex: (selectedIndex: number) => void,
  selectedIndex: number,
  total: number,
  level: LogLevel,
|}>;

function LogBoxInspectorHeader(props: Props): React.Node {
  const prevIndex =
    props.selectedIndex - 1 < 0 ? props.total - 1 : props.selectedIndex - 1;
  const nextIndex =
    props.selectedIndex + 1 > props.total - 1 ? 0 : props.selectedIndex + 1;

  const titleText = `Log ${props.selectedIndex + 1} of ${props.total}`;

  return (
    <SafeAreaView style={styles[props.level]}>
      <View style={styles.header}>
        <LogBoxInspectorHeaderButton
          disabled={props.total <= 1}
          level={props.level}
          image={LogBoxImageSource.chevronLeft}
          onPress={() => props.onSelectIndex(prevIndex)}
        />
        <View style={styles.title}>
          <Text style={styles.titleText}>{titleText}</Text>
        </View>
        <LogBoxInspectorHeaderButton
          disabled={props.total <= 1}
          level={props.level}
          image={LogBoxImageSource.chevronRight}
          onPress={() => props.onSelectIndex(nextIndex)}
        />
      </View>
    </SafeAreaView>
  );
}

const backgroundForLevel = (level: LogLevel) =>
  ({
    warn: {
      default: LogBoxStyle.getWarningColor(),
      pressed: LogBoxStyle.getWarningDarkColor(),
    },
    error: {
      default: LogBoxStyle.getErrorColor(),
      pressed: LogBoxStyle.getErrorDarkColor(),
    },
    fatal: {
      default: LogBoxStyle.getFatalColor(),
      pressed: LogBoxStyle.getFatalDarkColor(),
    },
    syntax: {
      default: LogBoxStyle.getFatalColor(),
      pressed: LogBoxStyle.getFatalDarkColor(),
    },
  }[level]);

function LogBoxInspectorHeaderButton(
  props: $ReadOnly<{|
    disabled: boolean,
    image: string,
    level: LogLevel,
    onPress?: ?() => void,
  |}>,
): React.Node {
  return (
    <LogBoxButton
      backgroundColor={backgroundForLevel(props.level)}
      onPress={props.disabled ? null : props.onPress}
      style={headerStyles.button}>
      {props.disabled ? null : (
        <Image
          source={{height: 16, uri: props.image, width: 16}}
          style={headerStyles.buttonImage}
        />
      )}
    </LogBoxButton>
  );
}

const headerStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    marginTop: 5,
    marginRight: 6,
    marginLeft: 6,
    marginBottom: -8,
    borderRadius: 3,
  },
  buttonImage: {
    tintColor: LogBoxStyle.getTextColor(1),
  },
});

const styles = StyleSheet.create({
  syntax: {
    backgroundColor: LogBoxStyle.getFatalColor(),
  },
  fatal: {
    backgroundColor: LogBoxStyle.getFatalColor(),
  },
  warn: {
    backgroundColor: LogBoxStyle.getWarningColor(),
  },
  error: {
    backgroundColor: LogBoxStyle.getErrorColor(),
  },
  header: {
    flexDirection: 'row',
    height: Platform.select({
      android: 48,
      ios: 44,
    }),
  },
  title: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
});

export default LogBoxInspectorHeader;

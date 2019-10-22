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

type Props = $ReadOnly<{|
  onSelectIndex: (selectedIndex: number) => void,
  selectedIndex: number,
  total: number,
|}>;

function LogBoxInspectorHeader(props: Props): React.Node {
  const prevIndex = props.selectedIndex - 1;
  const nextIndex = props.selectedIndex + 1;

  const titleText =
    props.total === 1
      ? 'Log'
      : `Log ${props.selectedIndex + 1} of ${props.total}`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <LogBoxInspectorHeaderButton
          disabled={prevIndex < 0}
          image={LogBoxImageSource.chevronLeft}
          onPress={() => props.onSelectIndex(prevIndex)}
        />
        <View style={styles.title}>
          <Text style={styles.titleText}>{titleText}</Text>
        </View>
        <LogBoxInspectorHeaderButton
          disabled={nextIndex >= props.total}
          image={LogBoxImageSource.chevronRight}
          onPress={() => props.onSelectIndex(nextIndex)}
        />
      </View>
    </SafeAreaView>
  );
}

function LogBoxInspectorHeaderButton(
  props: $ReadOnly<{|
    disabled: boolean,
    image: string,
    onPress?: ?() => void,
  |}>,
): React.Node {
  return (
    <LogBoxButton
      backgroundColor={{
        default: LogBoxStyle.getWarningColor(),
        pressed: LogBoxStyle.getWarningDarkColor(),
      }}
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
    marginTop: 3,
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
  root: {
    backgroundColor: LogBoxStyle.getWarningColor(1),
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

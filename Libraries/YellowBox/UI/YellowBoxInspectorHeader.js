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

const Image = require('../../Image/Image');
const Platform = require('../../Utilities/Platform');
const React = require('react');
const SafeAreaView = require('../../Components/SafeAreaView/SafeAreaView');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const Text = require('../../Text/Text');
const View = require('../../Components/View/View');
const YellowBoxPressable = require('./YellowBoxPressable');
const YellowBoxStyle = require('./YellowBoxStyle');

import type YellowBoxWarning from '../Data/YellowBoxWarning';

type Props = $ReadOnly<{|
  onSelectIndex: (selectedIndex: number) => void,
  selectedIndex: number,
  warnings: $ReadOnlyArray<YellowBoxWarning>,
|}>;

const YellowBoxInspectorHeader = (props: Props): React.Node => {
  const prevIndex = props.selectedIndex - 1;
  const nextIndex = props.selectedIndex + 1;

  const titleText =
    props.warnings.length === 1
      ? 'Single Occurrence'
      : `Occurrence ${props.selectedIndex + 1} of ${props.warnings.length}`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <YellowBoxInspectorHeaderButton
          disabled={props.warnings[prevIndex] == null}
          image={require('../../LogBox/UI/LogBoxImages/chevron-left.png')}
          onPress={() => props.onSelectIndex(prevIndex)}
        />
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>{titleText}</Text>
        </View>
        <YellowBoxInspectorHeaderButton
          disabled={props.warnings[nextIndex] == null}
          image={require('../../LogBox/UI/LogBoxImages/chevron-right.png')}
          onPress={() => props.onSelectIndex(nextIndex)}
        />
      </View>
    </SafeAreaView>
  );
};

const YellowBoxInspectorHeaderButton = (
  props: $ReadOnly<{|
    disabled: boolean,
    image: number,
    onPress?: ?() => void,
  |}>,
): React.Node => (
  <YellowBoxPressable
    backgroundColor={{
      default: 'transparent',
      pressed: YellowBoxStyle.getHighlightColor(1),
    }}
    onPress={props.disabled ? null : props.onPress}
    style={styles.headerButton}>
    {props.disabled ? null : (
      <Image source={props.image} style={styles.headerButtonImage} />
    )}
  </YellowBoxPressable>
);

const styles = StyleSheet.create({
  root: {
    backgroundColor: YellowBoxStyle.getBackgroundColor(0.95),
  },
  header: {
    flexDirection: 'row',
    height: Platform.select({
      android: 48,
      ios: 44,
    }),
  },
  headerButton: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  headerButtonImage: {
    height: 14,
    width: 8,
    tintColor: YellowBoxStyle.getTextColor(1),
  },
  headerTitle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleText: {
    color: YellowBoxStyle.getTextColor(1),
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
});

module.exports = YellowBoxInspectorHeader;

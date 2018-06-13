/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const Platform = require('Platform');
const React = require('React');
const SafeAreaView = require('SafeAreaView');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const UTFSequence = require('UTFSequence');
const View = require('View');
const YellowBoxPressable = require('YellowBoxPressable');
const YellowBoxStyle = require('YellowBoxStyle');

import type YellowBoxWarning from 'YellowBoxWarning';

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
          label={UTFSequence.TRIANGLE_LEFT}
          onPress={() => props.onSelectIndex(prevIndex)}
        />
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>{titleText}</Text>
        </View>
        <YellowBoxInspectorHeaderButton
          disabled={props.warnings[nextIndex] == null}
          label={UTFSequence.TRIANGLE_RIGHT}
          onPress={() => props.onSelectIndex(nextIndex)}
        />
      </View>
    </SafeAreaView>
  );
};

const YellowBoxInspectorHeaderButton = (
  props: $ReadOnly<{|
    disabled: boolean,
    label: React.Node,
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
      <Text style={styles.headerButtonText}>{props.label}</Text>
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
  headerButtonText: {
    color: YellowBoxStyle.getTextColor(1),
    fontSize: 16,
    includeFontPadding: false,
    lineHeight: 20,
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

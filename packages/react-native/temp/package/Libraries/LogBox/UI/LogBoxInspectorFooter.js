/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {LogLevel} from '../Data/LogBoxLog';

import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import LogBoxInspectorFooterButton from './LogBoxInspectorFooterButton';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

type Props = $ReadOnly<{
  onDismiss: () => void,
  onMinimize: () => void,
  level?: ?LogLevel,
}>;

export default function LogBoxInspectorFooter(props: Props): React.Node {
  if (props.level === 'syntax') {
    return (
      <View style={styles.root}>
        <View style={styles.button}>
          <Text style={styles.syntaxErrorText}>
            This error cannot be dismissed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LogBoxInspectorFooterButton text="Dismiss" onPress={props.onDismiss} />
      <LogBoxInspectorFooterButton text="Minimize" onPress={props.onMinimize} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowRadius: 2,
    shadowOpacity: 0.5,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
  syntaxErrorText: {
    textAlign: 'center',
    width: '100%',
    height: 48,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 20,
    paddingBottom: 50,
    fontStyle: 'italic',
    color: LogBoxStyle.getTextColor(0.6),
  },
});

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

import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import Platform from '../../Utilities/Platform';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';

import type {PressEvent} from '../../Types/CoreEventTypes';
import type {StackFrame} from '../../Core/NativeExceptionsManager';

type Props = $ReadOnly<{|
  frame: StackFrame,
  onPress?: ?(event: PressEvent) => void,
|}>;

function LogBoxInspectorStackFrame(props: Props): React.Node {
  const {frame, onPress} = props;

  return (
    <LogBoxButton
      backgroundColor={{
        default: 'transparent',
        pressed: LogBoxStyle.getBackgroundColor(1),
      }}
      onPress={onPress}
      style={styles.frame}>
      <Text style={[styles.name, frame.collapse === true && styles.dim]}>
        {frame.methodName}
      </Text>

      <View style={styles.lineLocation}>
        <Text
          ellipsizeMode="middle"
          numberOfLines={1}
          style={[styles.location, frame.collapse === true && styles.dim]}>
          {getFileName(frame)}
        </Text>
        {frame.lineNumber != null && (
          <Text style={[styles.line, frame.collapse === true && styles.dim]}>
            :{frame.lineNumber}
          </Text>
        )}
        {frame.column != null && !isNaN(parseInt(frame.column, 10)) && (
          <Text style={[styles.line, frame.collapse === true && styles.dim]}>
            :{parseInt(frame.column, 10) + 1}
          </Text>
        )}
      </View>
    </LogBoxButton>
  );
}

function getFileName(frame: StackFrame): string {
  const {file} = frame;
  if (file == null) {
    return '<unknown>';
  }
  const queryIndex = file.indexOf('?');

  const path = queryIndex < 0 ? file : file.substr(0, queryIndex);
  return path.substr(path.lastIndexOf('/') + 1);
}

const styles = StyleSheet.create({
  frame: {
    paddingHorizontal: 25,
    paddingVertical: 4,
  },
  lineLocation: {
    flexDirection: 'row',
  },
  name: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
  location: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10,
  },
  dim: {
    color: LogBoxStyle.getTextColor(0.4),
    fontWeight: '300',
  },
  line: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
  },
});

export default LogBoxInspectorStackFrame;

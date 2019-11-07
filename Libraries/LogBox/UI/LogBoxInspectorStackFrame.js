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
      <Text
        ellipsizeMode="middle"
        numberOfLines={1}
        style={[styles.location, frame.collapse === true && styles.dim]}>
        {formatFrameLocation(frame)}
      </Text>
    </LogBoxButton>
  );
}

function formatFrameLocation(frame: StackFrame): string {
  const {file, lineNumber, column} = frame;
  if (file == null) {
    return '<unknown>';
  }
  const queryIndex = file.indexOf('?');
  const query = queryIndex < 0 ? '' : file.substr(queryIndex);

  const path = queryIndex < 0 ? file : file.substr(0, queryIndex);
  let location = path.substr(path.lastIndexOf('/') + 1) + query;

  if (lineNumber == null) {
    return location;
  }

  location = location + ':' + lineNumber;

  if (column == null) {
    return location;
  }

  return location + ':' + column;
}

const styles = StyleSheet.create({
  frame: {
    paddingHorizontal: 25,
    paddingVertical: 4,
  },
  name: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
  },
  location: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10,
  },
  dim: {
    color: LogBoxStyle.getTextColor(0.4),
  },
});

export default LogBoxInspectorStackFrame;

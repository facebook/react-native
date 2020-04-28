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

const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const Text = require('../../Text/Text');
const YellowBoxPressable = require('./YellowBoxPressable');
const YellowBoxStyle = require('./YellowBoxStyle');

import type {PressEvent} from '../../Types/CoreEventTypes';
import type {StackFrame} from '../../Core/NativeExceptionsManager';

type Props = $ReadOnly<{|
  frame: StackFrame,
  onPress?: ?(event: PressEvent) => void,
|}>;

const YellowBoxInspectorStackFrame = (props: Props): React.Node => {
  const {frame, onPress} = props;

  return (
    <YellowBoxPressable
      backgroundColor={{
        default: YellowBoxStyle.getBackgroundColor(0),
        pressed: YellowBoxStyle.getHighlightColor(1),
      }}
      onPress={onPress}
      style={styles.frame}>
      <Text style={styles.frameName}>{frame.methodName}</Text>
      <Text
        ellipsizeMode="middle"
        numberOfLines={1}
        style={styles.frameLocation}>
        {formatFrameLocation(frame)}
      </Text>
    </YellowBoxPressable>
  );
};

const formatFrameLocation = (frame: StackFrame): string => {
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
};

const styles = StyleSheet.create({
  frame: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frameName: {
    color: YellowBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
  },
  frameLocation: {
    color: YellowBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
  },
});

module.exports = YellowBoxInspectorStackFrame;

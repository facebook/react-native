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
import type {StackFrame} from '../../Core/Devtools/parseErrorStack';

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
        {`${getFrameLocation(frame.file)}:${frame.lineNumber}${
          frame.column == null ? '' : ':' + frame.column
        }`}
      </Text>
    </YellowBoxPressable>
  );
};

const getFrameLocation = (uri: string): string => {
  const queryIndex = uri.indexOf('?');
  const query = queryIndex < 0 ? '' : uri.substr(queryIndex);

  const path = queryIndex < 0 ? uri : uri.substr(0, queryIndex);
  const file = path.substr(path.lastIndexOf('/') + 1);

  return file + query;
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

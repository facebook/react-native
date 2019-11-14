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
import Platform from '../../Utilities/Platform';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import LogBoxInspectorSection from './LogBoxInspectorSection';
import type LogBoxLog from '../Data/LogBoxLog';

type Props = $ReadOnly<{|
  log: LogBoxLog,
|}>;

function LogBoxInspectorReactFrames(props: Props): React.Node {
  const [collapsed, setCollapsed] = React.useState(true);
  if (props.log.componentStack == null || props.log.componentStack.length < 1) {
    return null;
  }

  function getStackList() {
    if (collapsed) {
      return props.log.componentStack.slice(0, 3);
    } else {
      return props.log.componentStack;
    }
  }

  function getCollapseMessage() {
    const count = props.log.componentStack.length - 3;
    if (collapsed) {
      return `See ${count} more components`;
    } else {
      return `Collapse ${count} components`;
    }
  }

  return (
    <LogBoxInspectorSection heading="Component Stack">
      {getStackList().map((frame, index) => (
        <View
          // Unfortunately we don't have a unique identifier for stack traces.
          key={index}
          style={componentStyles.frame}>
          <View style={componentStyles.component}>
            <Text style={componentStyles.frameName}>
              <Text style={componentStyles.bracket}>{'<'}</Text>
              {frame.component}
              <Text style={componentStyles.bracket}>{' />'}</Text>
            </Text>
          </View>
          <Text style={componentStyles.frameLocation}>{frame.location}</Text>
        </View>
      ))}
      <View style={componentStyles.collapseContainer}>
        <LogBoxButton
          backgroundColor={{
            default: 'transparent',
            pressed: LogBoxStyle.getBackgroundColor(1),
          }}
          onPress={() => setCollapsed(!collapsed)}
          style={componentStyles.collapseButton}>
          <Text style={componentStyles.collapse}>{getCollapseMessage()}</Text>
        </LogBoxButton>
      </View>
    </LogBoxInspectorSection>
  );
}

const componentStyles = StyleSheet.create({
  collapseContainer: {
    marginLeft: 15,
    flexDirection: 'row',
  },
  collapseButton: {
    borderRadius: 5,
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 20,
    marginTop: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  frame: {
    paddingHorizontal: 25,
    paddingVertical: 4,
  },
  component: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  frameName: {
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
  },
  bracket: {
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
    color: LogBoxStyle.getTextColor(0.4),
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18,
  },
  frameLocation: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10,
  },
});

export default LogBoxInspectorReactFrames;

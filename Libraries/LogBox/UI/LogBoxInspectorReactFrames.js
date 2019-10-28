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
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';

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
    <View style={componentStyles.section}>
      <View style={componentStyles.heading}>
        <Text style={componentStyles.headingText}>React</Text>
      </View>
      <View style={componentStyles.body}>
        {getStackList().map((frame, index) => (
          <View
            // Unfortunately we don't have a unique identifier for stack traces.
            key={index}
            style={componentStyles.frame}>
            <Text style={componentStyles.frameName}>{frame.component}</Text>
            <Text style={componentStyles.frameLocation}>{frame.location}</Text>
          </View>
        ))}
        <LogBoxButton
          backgroundColor={{
            default: 'transparent',
            pressed: LogBoxStyle.getBackgroundColor(1),
          }}
          onPress={() => setCollapsed(!collapsed)}>
          <Text style={componentStyles.collapse}>{getCollapseMessage()}</Text>
        </LogBoxButton>
      </View>
    </View>
  );
}

const componentStyles = StyleSheet.create({
  section: {
    marginTop: 15,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
  body: {
    paddingBottom: 10,
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '500',
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 20,
    marginLeft: 25,
    marginTop: 0,
    paddingVertical: 5,
  },
  frame: {
    paddingHorizontal: 25,
    paddingVertical: 4,
  },
  frameName: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
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

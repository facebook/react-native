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
import LogBoxInspectorSourceMapStatus from './LogBoxInspectorSourceMapStatus';
import LogBoxInspectorStackFrame from './LogBoxInspectorStackFrame';
import * as LogBoxStyle from './LogBoxStyle';
import openFileInEditor from '../../Core/Devtools/openFileInEditor';

import type LogBoxLog from '../Data/LogBoxLog';

type Props = $ReadOnly<{|
  log: LogBoxLog,
  onRetry: () => void,
|}>;

function LogBoxInspectorStackFrames(props: Props): React.Node {
  const [collapsed, setCollapsed] = React.useState(true);

  function getStackList() {
    if (collapsed === true) {
      return props.log.getAvailableStack().filter(({collapse}) => !collapse);
    } else {
      return props.log.getAvailableStack();
    }
  }

  function getCollapseMessage() {
    const stackFrames = props.log.getAvailableStack();
    const collapsedCount = stackFrames.reduce((count, {collapse}) => {
      if (collapse !== true) {
        return count + 1;
      }

      return count;
    }, 0);

    if (collapsed) {
      return `See ${collapsedCount} more frames`;
    } else {
      return `Collapse ${collapsedCount} frames`;
    }
  }

  if (props.log.getAvailableStack().length === 0) {
    return null;
  }

  return (
    <View style={stackStyles.section}>
      <StackFrameHeader
        status={props.log.symbolicated.status}
        onRetry={props.onRetry}
      />
      <View style={stackStyles.body}>
        <StackFrameList
          list={getStackList()}
          status={props.log.symbolicated.status}
        />
        <StackFrameFooter
          onPress={() => setCollapsed(!collapsed)}
          message={getCollapseMessage()}
        />
      </View>
    </View>
  );
}

function StackFrameHeader(props) {
  return (
    <View style={stackStyles.heading}>
      <Text style={stackStyles.headingText}>Stack</Text>
      <LogBoxInspectorSourceMapStatus
        onPress={props.status !== 'COMPLETE' ? props.onRetry : null}
        status={props.status}
      />
    </View>
  );
}

function StackFrameList(props) {
  return (
    <>
      {props.list.map((frame, index) => {
        const {file, lineNumber} = frame;
        return (
          <LogBoxInspectorStackFrame
            key={index}
            frame={frame}
            onPress={() => {
              if (
                props.status === 'COMPLETE' &&
                file != null &&
                lineNumber != null
              ) {
                openFileInEditor(file, lineNumber);
              }
            }}
          />
        );
      })}
    </>
  );
}

function StackFrameFooter(props) {
  return (
    <View>
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundColor(1),
        }}
        onPress={props.onPress}>
        <Text style={stackStyles.collapse}>{props.message}</Text>
      </LogBoxButton>
    </View>
  );
}

const stackStyles = StyleSheet.create({
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
    paddingHorizontal: 27,
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
});

export default LogBoxInspectorStackFrames;

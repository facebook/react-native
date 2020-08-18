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
import LogBoxInspectorSection from './LogBoxInspectorSection';
import * as LogBoxStyle from './LogBoxStyle';
import openFileInEditor from '../../Core/Devtools/openFileInEditor';
import type {Stack} from '../Data/LogBoxSymbolication';
import type LogBoxLog from '../Data/LogBoxLog';

type Props = $ReadOnly<{|
  log: LogBoxLog,
  onRetry: () => void,
|}>;

export function getCollapseMessage(
  stackFrames: Stack,
  collapsed: boolean,
): string {
  if (stackFrames.length === 0) {
    return 'No frames to show';
  }

  const collapsedCount = stackFrames.reduce((count, {collapse}) => {
    if (collapse === true) {
      return count + 1;
    }

    return count;
  }, 0);

  if (collapsedCount === 0) {
    return 'Showing all frames';
  }

  const framePlural = `frame${collapsedCount > 1 ? 's' : ''}`;
  if (collapsedCount === stackFrames.length) {
    return collapsed
      ? `See${
          collapsedCount > 1 ? ' all ' : ' '
        }${collapsedCount} collapsed ${framePlural}`
      : `Collapse${
          collapsedCount > 1 ? ' all ' : ' '
        }${collapsedCount} ${framePlural}`;
  } else {
    return collapsed
      ? `See ${collapsedCount} more ${framePlural}`
      : `Collapse ${collapsedCount} ${framePlural}`;
  }
}

function LogBoxInspectorStackFrames(props: Props): React.Node {
  const [collapsed, setCollapsed] = React.useState(true);

  function getStackList() {
    if (collapsed === true) {
      return props.log.getAvailableStack().filter(({collapse}) => !collapse);
    } else {
      return props.log.getAvailableStack();
    }
  }

  if (props.log.getAvailableStack().length === 0) {
    return null;
  }

  return (
    <LogBoxInspectorSection
      heading="Call Stack"
      action={
        <LogBoxInspectorSourceMapStatus
          onPress={
            props.log.symbolicated.status === 'FAILED' ? props.onRetry : null
          }
          status={props.log.symbolicated.status}
        />
      }>
      {props.log.symbolicated.status !== 'COMPLETE' && (
        <View style={stackStyles.hintBox}>
          <Text style={stackStyles.hintText}>
            This call stack is not symbolicated. Some features are unavailable
            such as viewing the function name or tapping to open files.
          </Text>
        </View>
      )}
      <StackFrameList
        list={getStackList()}
        status={props.log.symbolicated.status}
      />
      <StackFrameFooter
        onPress={() => setCollapsed(!collapsed)}
        message={getCollapseMessage(props.log.getAvailableStack(), collapsed)}
      />
    </LogBoxInspectorSection>
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
            onPress={
              props.status === 'COMPLETE' && file != null && lineNumber != null
                ? () => openFileInEditor(file, lineNumber)
                : null
            }
          />
        );
      })}
    </>
  );
}

function StackFrameFooter(props) {
  return (
    <View style={stackStyles.collapseContainer}>
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundColor(1),
        }}
        onPress={props.onPress}
        style={stackStyles.collapseButton}>
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
  hintText: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 13,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '400',
    marginHorizontal: 10,
  },
  hintBox: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginHorizontal: 10,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
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
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

export default LogBoxInspectorStackFrames;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Clipboard from '../../Components/Clipboard/Clipboard';
import ScrollView from '../../Components/ScrollView/ScrollView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import LogBoxLog from '../Data/LogBoxLog';
import LogBoxInspectorCodeFrame from './LogBoxInspectorCodeFrame';
import LogBoxInspectorMessageHeader from './LogBoxInspectorMessageHeader';
import LogBoxInspectorReactFrames from './LogBoxInspectorReactFrames';
import LogBoxInspectorStackFrames from './LogBoxInspectorStackFrames';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';

const headerTitleMap = {
  warn: 'Console Warning',
  error: 'Console Error',
  fatal: 'Uncaught Error',
  syntax: 'Syntax Error',
  component: 'Render Error',
};

function formatStackFrameForCopy(frame: {
  methodName: string,
  file?: ?string,
  lineNumber?: ?number,
  column?: ?string | ?number,
  ...
}): string {
  const location = frame.file
    ? ` (${frame.file}${frame.lineNumber != null ? ':' + frame.lineNumber : ''}${frame.column != null ? ':' + frame.column : ''})`
    : '';
  return `    at ${frame.methodName}${location}`;
}

export default function LogBoxInspectorBody(props: {
  log: LogBoxLog,
  onRetry: () => void,
}): React.Node {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(true);
  }, [props.log]);

  const headerTitle =
    props.log.type ??
    headerTitleMap[props.log.isComponentError ? 'component' : props.log.level];

  const handleCopy = useCallback(() => {
    const log = props.log;
    const stack = log.getAvailableStack();

    let text = `${headerTitle}\n\n${log.message.content}`;

    if (stack.length > 0) {
      const stackText = stack.map(formatStackFrameForCopy).join('\n');
      text += `\n\n${stackText}`;
    }

    Clipboard.setString(text);
  }, [props.log, headerTitle]);

  if (collapsed) {
    return (
      <>
        <LogBoxInspectorMessageHeader
          collapsed={collapsed}
          onPress={() => setCollapsed(!collapsed)}
          onCopy={handleCopy}
          message={props.log.message}
          level={props.log.level}
          title={headerTitle}
        />
        <ScrollView style={styles.scrollBody}>
          <LogBoxInspectorCodeFrame
            codeFrame={props.log.codeFrame}
            componentCodeFrame={props.log.componentCodeFrame}
          />
          <LogBoxInspectorReactFrames log={props.log} />
          <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
        </ScrollView>
      </>
    );
  }
  return (
    <ScrollView style={styles.scrollBody}>
      <LogBoxInspectorMessageHeader
        collapsed={collapsed}
        onPress={() => setCollapsed(!collapsed)}
        onCopy={handleCopy}
        message={props.log.message}
        level={props.log.level}
        title={headerTitle}
      />
      <LogBoxInspectorCodeFrame
        codeFrame={props.log.codeFrame}
        componentCodeFrame={props.log.componentCodeFrame}
      />
      <LogBoxInspectorReactFrames log={props.log} />
      <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogBoxStyle.getTextColor(),
  },
  scrollBody: {
    backgroundColor: LogBoxStyle.getBackgroundColor(0.9),
    flex: 1,
  },
});

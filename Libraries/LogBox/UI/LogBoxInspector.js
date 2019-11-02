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

import LogBoxInspectorCodeFrame from './LogBoxInspectorCodeFrame';
import Platform from '../../Utilities/Platform';
import * as React from 'react';
import ScrollView from '../../Components/ScrollView/ScrollView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../../Components/View/View';
import * as LogBoxData from '../Data/LogBoxData';
import LogBoxInspectorFooter from './LogBoxInspectorFooter';
import LogBoxInspectorMessageHeader from './LogBoxInspectorMessageHeader';
import LogBoxInspectorReactFrames from './LogBoxInspectorReactFrames';
import LogBoxInspectorStackFrames from './LogBoxInspectorStackFrames';
import LogBoxInspectorMeta from './LogBoxInspectorMeta';
import LogBoxInspectorHeader from './LogBoxInspectorHeader';
import * as LogBoxStyle from './LogBoxStyle';

import type LogBoxLog, {LogLevel} from '../Data/LogBoxLog';

type Props = $ReadOnly<{|
  onDismiss: () => void,
  onChangeSelectedIndex: (index: number) => void,
  onMinimize: () => void,
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedIndex: number,
  fatalType?: ?LogLevel,
|}>;

function LogBoxInspector(props: Props): React.Node {
  const {logs, selectedIndex} = props;

  const log = logs[selectedIndex];
  React.useEffect(() => {
    // Symbolicate the visible log if it hasn't been already.
    if (log != null && log.symbolicated.status !== 'COMPLETE') {
      LogBoxData.symbolicateLogNow(log);
    }
  }, [log]);

  React.useEffect(() => {
    // Optimistically symbolicate the last and next logs.
    if (logs.length > 1) {
      const selected = selectedIndex;
      const lastIndex = logs.length - 1;
      const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
      const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
      LogBoxData.symbolicateLogLazy(logs[prevIndex]);
      LogBoxData.symbolicateLogLazy(logs[nextIndex]);
    }
  }, [logs, selectedIndex]);

  function _handleRetry() {
    LogBoxData.retrySymbolicateLogNow(log);
  }

  if (log == null) {
    return null;
  }

  return (
    <View style={styles.root}>
      <LogBoxInspectorHeader
        onSelectIndex={props.onChangeSelectedIndex}
        selectedIndex={selectedIndex}
        total={logs.length}
        level={log.level}
      />
      <LogBoxInspectorBody log={log} onRetry={_handleRetry} />
      <LogBoxInspectorFooter
        onDismiss={props.onDismiss}
        onMinimize={props.onMinimize}
        fatalType={props.fatalType}
      />
    </View>
  );
}

function LogBoxInspectorBody(props) {
  const [collapsed, setCollapsed] = React.useState(true);
  if (collapsed) {
    return (
      <>
        <LogBoxInspectorMessageHeader
          collapsed={collapsed}
          onPress={() => setCollapsed(!collapsed)}
          message={props.log.message}
          level={props.log.level}
        />
        <ScrollView style={styles.scrollBody}>
          <LogBoxInspectorCodeFrame codeFrame={props.log.codeFrame} />
          <LogBoxInspectorReactFrames log={props.log} />
          <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
          <LogBoxInspectorMeta />
        </ScrollView>
      </>
    );
  }
  return (
    <ScrollView style={styles.scrollBody}>
      <LogBoxInspectorMessageHeader
        collapsed={collapsed}
        onPress={() => setCollapsed(!collapsed)}
        message={props.log.message}
        level={props.log.level}
      />
      <LogBoxInspectorReactFrames log={props.log} />
      <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
      <LogBoxInspectorMeta />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: LogBoxStyle.getTextColor(1),
    elevation: Platform.OS === 'android' ? Number.MAX_SAFE_INTEGER : undefined,
    height: '100%',
  },
  scrollBody: {
    backgroundColor: LogBoxStyle.getBackgroundColor(0.9),
    flex: 1,
  },
});

export default LogBoxInspector;

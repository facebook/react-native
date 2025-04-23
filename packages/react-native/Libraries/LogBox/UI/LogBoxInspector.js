/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Keyboard from '../../Components/Keyboard/Keyboard';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import * as LogBoxData from '../Data/LogBoxData';
import LogBoxLog, {type LogLevel} from '../Data/LogBoxLog';
import LogBoxInspectorBody from './LogBoxInspectorBody';
import LogBoxInspectorFooter from './LogBoxInspectorFooter';
import LogBoxInspectorHeader from './LogBoxInspectorHeader';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useEffect} from 'react';

type Props = $ReadOnly<{
  onDismiss: () => void,
  onChangeSelectedIndex: (index: number) => void,
  onMinimize: () => void,
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedIndex: number,
  fatalType?: ?LogLevel,
}>;

export default function LogBoxInspector(props: Props): React.Node {
  const {logs, selectedIndex} = props;
  let log = logs[selectedIndex];

  useEffect(() => {
    if (log) {
      LogBoxData.symbolicateLogNow(log);
    }
  }, [log]);

  useEffect(() => {
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

  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  function _handleRetry() {
    LogBoxData.retrySymbolicateLogNow(log);
  }

  if (log == null) {
    return null;
  }

  return (
    <View id="logbox_inspector" style={styles.root}>
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
        level={log.level}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogBoxStyle.getTextColor(),
  },
});

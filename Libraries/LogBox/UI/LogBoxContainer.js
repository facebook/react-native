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
import SafeAreaView from '../../Components/SafeAreaView/SafeAreaView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../../Components/View/View';
import LogBoxInspector from './LogBoxInspector';
import LogBoxLog from '../Data/LogBoxLog';
import LogBoxLogNotification from './LogBoxLogNotification';
import type {LogBoxLogs} from '../Data/LogBoxLogData';

type Props = $ReadOnly<{|
  onDismiss: (log: LogBoxLog) => void,
  onDismissAll: () => void,
  logs: LogBoxLogs,
|}>;

function LogBoxContainer(props: Props): React.Node {
  const [selectedLogIndex, setSelectedLog] = React.useState(null);

  const filteredLogs = props.logs.filter(log => !log.ignored);

  function getVisibleLog() {
    // TODO: currently returns the newest log but later will need to return
    // the newest log of the highest level. For example, we want to show
    // the latest error message even if there are newer warnings.
    return filteredLogs[filteredLogs.length - 1];
  }

  function handleInspectorDismissAll() {
    props.onDismissAll();
  }

  function handleInspectorDismiss() {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    if (selectedLogIndex != null) {
      if (props.logs.length - 1 <= 0) {
        setSelectedLog(null);
      } else if (selectedLogIndex >= props.logs.length - 1) {
        setSelectedLog(selectedLogIndex - 1);
      }
      props.onDismiss(props.logs[selectedLogIndex]);
    }
  }

  function handleInspectorMinimize() {
    setSelectedLog(null);
  }

  function handleRowPress(index: number) {
    setSelectedLog(filteredLogs.length - 1);
  }

  if (selectedLogIndex != null) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <LogBoxInspector
          onDismiss={handleInspectorDismiss}
          onMinimize={handleInspectorMinimize}
          onChangeSelectedIndex={setSelectedLog}
          logs={filteredLogs}
          selectedIndex={selectedLogIndex}
        />
      </View>
    );
  }

  return filteredLogs.length === 0 ? null : (
    <View style={styles.list}>
      <View style={styles.toast}>
        <LogBoxLogNotification
          log={getVisibleLog()}
          onPressOpen={handleRowPress}
          onPressList={() => {
            /* TODO: open log list */
          }}
          onPressDismiss={handleInspectorDismissAll}
        />
      </View>
      <SafeAreaView style={styles.safeArea} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    bottom: 10,
    left: 10,
    right: 10,
    position: 'absolute',
  },
  toast: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
});

export default LogBoxContainer;

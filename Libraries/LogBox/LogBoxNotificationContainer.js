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
import StyleSheet from '../StyleSheet/StyleSheet';
import SafeAreaView from '../Components/SafeAreaView/SafeAreaView';
import View from '../Components/View/View';
import * as LogBoxData from './Data/LogBoxData';
import LogBoxLog from './Data/LogBoxLog';
import LogBoxLogNotification from './UI/LogBoxNotification';

type Props = $ReadOnly<{|
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedLogIndex: number,
  isDisabled?: ?boolean,
|}>;

const onDismissWarns = () => {
  LogBoxData.clearWarnings();
};
const onDismissErrors = () => {
  LogBoxData.clearErrors();
};

const setSelectedLog = (index: number): void => {
  LogBoxData.setSelectedLog(index);
};

export function _LogBoxNotificationContainer(props: Props): React.Node {
  const {logs} = props;

  const [isWarnOnBottom, setIsWarnOnBottom] = React.useState(true);

  const toggleWarnPosition = React.useCallback((): void => {
    setIsWarnOnBottom(!isWarnOnBottom);
  }, [setIsWarnOnBottom, isWarnOnBottom]);

  const [isErrorOnBottom, setIsErrorOnBottom] = React.useState(true);

  const toggleErrorPosition = React.useCallback((): void => {
    setIsErrorOnBottom(!isErrorOnBottom);
  }, [setIsErrorOnBottom, isErrorOnBottom]);

  const openLog = React.useCallback(
    (log: LogBoxLog) => {
      let index = logs.length - 1;

      // Stop at zero because if we don't find any log, we'll open the first log.
      while (index > 0 && logs[index] !== log) {
        index -= 1;
      }
      setSelectedLog(index);
    },
    [logs],
  );

  const renderLogBoxLogNotifications = React.useCallback(
    (level, onDismiss, togglePosition, isOnBottom) => {
      const filteredLogs = logs.filter(log => log.level === level);
      if (filteredLogs.length === 0) {
        return null;
      }

      return (
        <View style={styles.toast}>
          <LogBoxLogNotification
            togglePosition={togglePosition}
            isOnBottom={isOnBottom}
            log={filteredLogs[filteredLogs.length - 1]}
            level={level}
            totalLogCount={filteredLogs.length}
            onPressOpen={() => openLog(filteredLogs[filteredLogs.length - 1])}
            onPressDismiss={onDismiss}
          />
        </View>
      );
    },
    [logs, openLog],
  );

  const renderWarns = React.useCallback(
    () =>
      renderLogBoxLogNotifications(
        'warn',
        onDismissWarns,
        toggleWarnPosition,
        isWarnOnBottom,
      ),
    [renderLogBoxLogNotifications, toggleWarnPosition, isWarnOnBottom],
  );

  const renderErrors = React.useCallback(
    () =>
      renderLogBoxLogNotifications(
        'error',
        onDismissErrors,
        toggleErrorPosition,
        isErrorOnBottom,
      ),
    [renderLogBoxLogNotifications, toggleErrorPosition, isErrorOnBottom],
  );

  if (logs.length === 0 || props.isDisabled === true) {
    return null;
  }

  return (
    <SafeAreaView style={styles.list} pointerEvents="box-none">
      <View>
        {isWarnOnBottom || renderWarns()}
        {isErrorOnBottom || renderErrors()}
      </View>
      <View>
        {isWarnOnBottom && renderWarns()}
        {isErrorOnBottom && renderErrors()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    left: 10,
    flex: 1,
    justifyContent: 'space-between',
    right: 10,
    top: 40,
    bottom: 0,
    position: 'absolute',
  },
  toast: {
    borderRadius: 8,
    marginBottom: 5,
    overflow: 'hidden',
  },
});

export default (LogBoxData.withSubscription(
  _LogBoxNotificationContainer,
): React.AbstractComponent<{||}>);

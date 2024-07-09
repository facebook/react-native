/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import View from '../Components/View/View';
import StyleSheet from '../StyleSheet/StyleSheet';
import * as LogBoxData from './Data/LogBoxData';
import LogBoxLog from './Data/LogBoxLog';
import LogBoxLogNotification from './UI/LogBoxNotification';
import * as React from 'react';

type Props = $ReadOnly<{|
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedLogIndex: number,
  isDisabled?: ?boolean,
|}>;

export function _LogBoxNotificationContainer(props: Props): React.Node {
  const {logs} = props;

  const onDismissWarns = () => {
    LogBoxData.clearWarnings();
  };
  const onDismissErrors = () => {
    LogBoxData.clearErrors();
  };

  const setSelectedLog = (index: number): void => {
    LogBoxData.setSelectedLog(index);
  };

  function openLog(log: LogBoxLog) {
    if (log.onNotificationPress) {
      log.onNotificationPress();
      return;
    }
    let index = logs.length - 1;

    // Stop at zero because if we don't find any log, we'll open the first log.
    while (index > 0 && logs[index] !== log) {
      index -= 1;
    }
    setSelectedLog(index);
  }

  if (logs.length === 0 || props.isDisabled === true) {
    return null;
  }

  const warnings = logs.filter(log => log.level === 'warn');
  const errors = logs.filter(
    log => log.level === 'error' || log.level === 'fatal',
  );
  return (
    <View style={styles.list}>
      {warnings.length > 0 && (
        <View style={styles.toast}>
          <LogBoxLogNotification
            log={warnings[warnings.length - 1]}
            level="warn"
            totalLogCount={warnings.length}
            onPressOpen={() => openLog(warnings[warnings.length - 1])}
            onPressDismiss={onDismissWarns}
          />
        </View>
      )}
      {errors.length > 0 && (
        <View style={styles.toast}>
          <LogBoxLogNotification
            log={errors[errors.length - 1]}
            level="error"
            totalLogCount={errors.length}
            onPressOpen={() => openLog(errors[errors.length - 1])}
            onPressDismiss={onDismissErrors}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    bottom: 20,
    left: 10,
    right: 10,
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

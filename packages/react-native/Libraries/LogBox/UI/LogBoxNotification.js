/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import * as LogBoxData from '../Data/LogBoxData';
import LogBoxLog from '../Data/LogBoxLog';
import LogBoxButton from './LogBoxButton';
import LogBoxNotificationCountBadge from './LogBoxNotificationCountBadge';
import LogBoxNotificationDismissButton from './LogBoxNotificationDismissButton';
import LogBoxNotificationMessage from './LogBoxNotificationMessage';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useEffect} from 'react';

type Props = $ReadOnly<{
  log: LogBoxLog,
  totalLogCount: number,
  level: 'warn' | 'error',
  onPressOpen: () => void,
  onPressDismiss: () => void,
}>;

export default function LogBoxNotification(props: Props): React.Node {
  const {totalLogCount, level, log} = props;

  // Eagerly symbolicate so the stack is available when pressing to inspect.
  useEffect(() => {
    LogBoxData.symbolicateLogLazy(log);
  }, [log]);

  return (
    <View style={styles.container}>
      <LogBoxButton
        onPress={props.onPressOpen}
        style={styles.press}
        backgroundColor={{
          default: LogBoxStyle.getBackgroundColor(1),
          pressed: LogBoxStyle.getBackgroundColor(0.9),
        }}>
        <View style={styles.content}>
          <LogBoxNotificationCountBadge count={totalLogCount} level={level} />
          <LogBoxNotificationMessage message={log.message} />
          <LogBoxNotificationDismissButton onPress={props.onPressDismiss} />
        </View>
      </LogBoxButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    marginTop: 0.5,
    backgroundColor: LogBoxStyle.getTextColor(1),
  },
  press: {
    height: 48,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    marginTop: 0.5,
    paddingHorizontal: 12,
  },
  content: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    borderRadius: 8,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
});

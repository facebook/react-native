/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Message as MessageType} from '../Data/parseLogBoxLog';

import View from '../../Components/View/View';
import Image from '../../Image/Image';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import * as LogBoxData from '../Data/LogBoxData';
import LogBoxLog from '../Data/LogBoxLog';
import LogBoxButton from './LogBoxButton';
import LogBoxMessage from './LogBoxMessage';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

type Props = $ReadOnly<{|
  log: LogBoxLog,
  totalLogCount: number,
  level: 'warn' | 'error',
  onPressOpen: () => void,
  onPressDismiss: () => void,
|}>;

function LogBoxLogNotification(props: Props): React.Node {
  const {totalLogCount, level, log} = props;

  // Eagerly symbolicate so the stack is available when pressing to inspect.
  React.useEffect(() => {
    LogBoxData.symbolicateLogLazy(log);
  }, [log]);

  return (
    <View style={toastStyles.container}>
      <LogBoxButton
        onPress={props.onPressOpen}
        style={toastStyles.press}
        backgroundColor={{
          default: LogBoxStyle.getBackgroundColor(1),
          pressed: LogBoxStyle.getBackgroundColor(0.9),
        }}>
        <View style={toastStyles.content}>
          <CountBadge count={totalLogCount} level={level} />
          <Message message={log.message} />
          <DismissButton onPress={props.onPressDismiss} />
        </View>
      </LogBoxButton>
    </View>
  );
}

function CountBadge(
  props: $TEMPORARY$object<{count: number, level: 'error' | 'warn'}>,
) {
  return (
    <View style={countStyles.outside}>
      {/* $FlowFixMe[incompatible-type] (>=0.114.0) This suppression was added
       * when fixing the type of `StyleSheet.create`. Remove this comment to
       * see the error. */}
      <View style={[countStyles.inside, countStyles[props.level]]}>
        <Text style={countStyles.text}>
          {props.count <= 1 ? '!' : props.count}
        </Text>
      </View>
    </View>
  );
}

function Message(props: $TEMPORARY$object<{message: MessageType}>) {
  return (
    <View style={messageStyles.container}>
      <Text numberOfLines={1} style={messageStyles.text}>
        {props.message && (
          <LogBoxMessage
            plaintext
            message={props.message}
            style={messageStyles.substitutionText}
          />
        )}
      </Text>
    </View>
  );
}

function DismissButton(props: $TEMPORARY$object<{onPress: () => void}>) {
  return (
    <View style={dismissStyles.container}>
      <LogBoxButton
        backgroundColor={{
          default: LogBoxStyle.getTextColor(0.3),
          pressed: LogBoxStyle.getTextColor(0.5),
        }}
        hitSlop={{
          top: 12,
          right: 10,
          bottom: 12,
          left: 10,
        }}
        onPress={props.onPress}
        style={dismissStyles.press}>
        <Image
          source={require('./LogBoxImages/close.png')}
          style={dismissStyles.image}
        />
      </LogBoxButton>
    </View>
  );
}

const countStyles = StyleSheet.create({
  warn: {
    backgroundColor: LogBoxStyle.getWarningColor(1),
  },
  error: {
    backgroundColor: LogBoxStyle.getErrorColor(1),
  },
  log: {
    backgroundColor: LogBoxStyle.getLogColor(1),
  },
  outside: {
    padding: 2,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  inside: {
    minWidth: 18,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 25,
    fontWeight: '600',
  },
  text: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: LogBoxStyle.getBackgroundColor(0.4),
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 3,
  },
});

const messageStyles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    borderLeftColor: LogBoxStyle.getTextColor(0.2),
    borderLeftWidth: 1,
    paddingLeft: 8,
  },
  text: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  substitutionText: {
    color: LogBoxStyle.getTextColor(0.6),
  },
});

const dismissStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    marginLeft: 5,
  },
  press: {
    height: 20,
    width: 20,
    borderRadius: 25,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: 8,
    width: 8,
    tintColor: LogBoxStyle.getBackgroundColor(1),
  },
});

const toastStyles = StyleSheet.create({
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

export default LogBoxLogNotification;

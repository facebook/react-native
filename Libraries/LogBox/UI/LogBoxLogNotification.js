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
import Image from '../../Image/Image';
import LogBoxImageSource from './LogBoxImageSource';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import LogBoxLog from '../Data/LogBoxLog';
import LogBoxMessage from './LogBoxMessage';

type Props = $ReadOnly<{|
  log: LogBoxLog,
  onPressOpen: (index: number) => void,
  onPressList: () => void,
  onPressDismiss: () => void,
|}>;

class LogBoxLogNotification extends React.Component<Props> {
  static GUTTER: number = StyleSheet.hairlineWidth;
  static HEIGHT: number = 48;

  shouldComponentUpdate(nextProps: Props): boolean {
    const prevProps = this.props;
    return (
      prevProps.onPressOpen !== nextProps.onPressOpen ||
      prevProps.onPressList !== nextProps.onPressList ||
      prevProps.onPressDismiss !== nextProps.onPressDismiss ||
      prevProps.log !== nextProps.log
    );
  }

  _handlePressOpen = () => {
    this.props.onPressOpen(0);
  };

  _handlePressList = () => {
    this.props.onPressList();
  };

  _handlePressDismiss = () => {
    this.props.onPressDismiss();
  };

  render(): React.Node {
    const {log} = this.props;

    return (
      <View style={toastStyles.container}>
        <LogBoxButton
          onPress={this._handlePressOpen}
          style={toastStyles.press}
          backgroundColor={{
            default: LogBoxStyle.getBackgroundColor(1),
            pressed: LogBoxStyle.getBackgroundColor(0.9),
          }}>
          <View style={toastStyles.content}>
            <CountBadge count={log.count} level="warn" />
            <Message message={log.message} />
            <DismissButton onPress={this._handlePressDismiss} />
          </View>
        </LogBoxButton>
      </View>
    );
  }
}

function CountBadge(props) {
  return (
    <View style={countStyles.outside}>
      <View style={[countStyles.inside, countStyles[props.level]]}>
        <Text style={countStyles.text}>
          {props.count <= 1 ? '!' : props.count}
        </Text>
      </View>
    </View>
  );
}

function Message(props) {
  return (
    <View style={messageStyles.container}>
      <Text numberOfLines={1} style={messageStyles.text}>
        {props.message && (
          <LogBoxMessage
            message={props.message}
            style={messageStyles.substitutionText}
          />
        )}
      </Text>
    </View>
  );
}

function DismissButton(props) {
  return (
    <View style={dismissStyles.container}>
      <LogBoxButton
        backgroundColor={{
          default: LogBoxStyle.getTextColor(0.3),
          pressed: LogBoxStyle.getTextColor(0.5),
        }}
        onPress={props.onPress}
        style={dismissStyles.press}>
        <Image
          source={{
            width: 8,
            height: 8,
            uri: LogBoxImageSource.close,
          }}
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
    includeFontPadding: false,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
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
    includeFontPadding: false,
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
    tintColor: LogBoxStyle.getBackgroundColor(1),
  },
});

const toastStyles = StyleSheet.create({
  container: {
    height: LogBoxLogNotification.HEIGHT,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    marginTop: LogBoxLogNotification.GUTTER,
    backgroundColor: LogBoxStyle.getTextColor(1),
  },
  press: {
    height: LogBoxLogNotification.HEIGHT,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    marginTop: LogBoxLogNotification.GUTTER,
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

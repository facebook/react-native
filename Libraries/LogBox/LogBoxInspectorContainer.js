/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as React from 'react';
import {View, StyleSheet} from 'react-native';
import * as LogBoxData from './Data/LogBoxData';
import LogBoxInspector from './UI/LogBoxInspector';
import type LogBoxLog from './Data/LogBoxLog';
import NativeLogBox from '../NativeModules/specs/NativeLogBox';

type Props = $ReadOnly<{|
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedLogIndex: number,
  isDisabled?: ?boolean,
|}>;

function NativeLogBoxVisibility(props) {
  React.useLayoutEffect(() => {
    if (NativeLogBox) {
      if (props.visible) {
        // Schedule this to try and prevent flashing the old state.
        setTimeout(() => NativeLogBox.show(), 10);
      } else {
        NativeLogBox.hide();
      }
    }
  }, [props.visible]);

  return props.children;
}

export class _LogBoxInspectorContainer extends React.Component<Props> {
  render(): React.Node {
    return (
      <NativeLogBoxVisibility visible={this.props.selectedLogIndex >= 0}>
        <View style={StyleSheet.absoluteFill}>
          <LogBoxInspector
            onDismiss={this._handleDismiss}
            onMinimize={this._handleMinimize}
            onChangeSelectedIndex={this._handleSetSelectedLog}
            logs={this.props.logs}
            selectedIndex={this.props.selectedLogIndex}
          />
        </View>
      </NativeLogBoxVisibility>
    );
  }

  _handleDismiss = (): void => {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    const {selectedLogIndex, logs} = this.props;
    const logsArray = Array.from(logs);
    if (selectedLogIndex != null) {
      if (logsArray.length - 1 <= 0) {
        LogBoxData.setSelectedLog(-1);
      } else if (selectedLogIndex >= logsArray.length - 1) {
        LogBoxData.setSelectedLog(selectedLogIndex - 1);
      }

      LogBoxData.dismiss(logsArray[selectedLogIndex]);
    }
  };

  _handleMinimize = (): void => {
    LogBoxData.setSelectedLog(-1);
  };

  _handleSetSelectedLog = (index: number): void => {
    LogBoxData.setSelectedLog(index);
  };
}

export default (LogBoxData.withSubscription(
  _LogBoxInspectorContainer,
): React.AbstractComponent<{||}>);
